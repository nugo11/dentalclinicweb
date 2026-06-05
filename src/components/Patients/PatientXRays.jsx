import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from "../../context/AuthContext";
import { Image as ImageIcon, Download, Eye, Upload, Loader2, MessageSquare, X, Camera, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { logActivity } from "../../utils/activityLogger";

const PatientXRays = ({ patientId, patientName }) => {
  const { userData, currentUser, activeStaff } = useAuth();
  const [xrays, setXrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Upload form state
  const [fileToUpload, setFileToUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, "patient_xrays"),
      where("patientId", "==", patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid needing a composite index if one isn't set up yet
      const sorted = data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setXrays(sorted);
      setLoading(false);
    }, (error) => {
      console.error("PatientXRays error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Canvas to Blob conversion failed"));
            }
          }, 'image/webp', 0.85); // Compress to webp at 85% quality
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს");
      return;
    }

    if (!file.type.startsWith('image/')) {
       setError("გთხოვთ ატვირთოთ მხოლოდ სურათი (JPG, PNG, WEBP)");
       return;
    }

    setError("");
    setFileToUpload(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    setError("");

    try {
      const compressedBlob = await compressImage(fileToUpload);
      
      const CLOUD_NAME = "dxyhm9ftw";
      const UPLOAD_PRESET = "ml_default";

      const uploadData = new FormData();
      uploadData.append("file", compressedBlob, "xray.webp");
      uploadData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      
      if (result.secure_url) {
        // Save to Firestore
        const clinicId = userData?.clinicId || currentUser?.uid;
        await addDoc(collection(db, "patient_xrays"), {
          patientId,
          clinicId,
          imageUrl: result.secure_url,
          comment: comment.trim(),
          originalName: fileToUpload.name,
          createdAt: serverTimestamp(),
          uploadedBy: activeStaff?.fullName || userData?.clinicName || "Unknown"
        });

        // Log Activity
        await logActivity(
            clinicId, 
            activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 
            'xray_upload', 
            `აიტვირთა რენტგენის სურათი პაციენტისთვის: ${patientName || 'უცნობი'}`, 
            { patientId }
        );

        // Reset form
        setShowUploadModal(false);
        setFileToUpload(null);
        setPreviewUrl(null);
        setComment("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
          throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(error);
      setError("ატვირთვის დროს დაფიქსირდა შეცდომა");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'xray.webp';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const openViewModal = (image) => {
      setSelectedImage(image);
      setShowViewModal(true);
  };

  const deleteFromCloudinary = async (imageUrl) => {
    try {
        const cloudName = "dxyhm9ftw";
        const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
        const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
        
        if (!apiKey || !apiSecret) {
            console.warn("Cloudinary API credentials missing. Cannot delete from Cloudinary.");
            return true; // Pretend it succeeded so we can still delete from DB
        }

        // Extract public_id from URL
        const parts = imageUrl.split('/');
        const filename = parts.pop();
        const publicId = filename.split('.')[0];
        
        const timestamp = Math.round(new Date().getTime() / 1000);
        
        // Generate signature: SHA-1 of "public_id={publicId}&timestamp={timestamp}{apiSecret}"
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        
        // Use Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('signature', signature);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        return result.result === 'ok';
    } catch (e) {
        console.error("Cloudinary delete error:", e);
        return false;
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    
    try {
        await deleteFromCloudinary(imageToDelete.imageUrl);

        await deleteDoc(doc(db, "patient_xrays", imageToDelete.id));
        
        const clinicId = userData?.clinicId || currentUser?.uid;
        await logActivity(
            clinicId, 
            activeStaff || userData || { uid: currentUser?.uid, fullName: 'Unknown', role: 'unknown' }, 
            'xray_delete', 
            `წაიშალა რენტგენის სურათი პაციენტისთვის: ${patientName || 'უცნობი'}`, 
            { patientId }
        );
        setImageToDelete(null);
    } catch (error) {
        console.error("Error deleting xray:", error);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="bg-surface rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border border-border-main shadow-sm relative overflow-hidden mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <h3 className="text-xl sm:text-2xl font-black text-text-main italic tracking-tighter flex items-center gap-3">
          <ImageIcon className="text-brand-purple shrink-0" size={24} /> რენტგენის ფოტოები
        </h3>
        <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 sm:py-3 bg-brand-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-deep transition-all shrink-0 w-full sm:w-auto"
        >
            <Upload size={16} /> ფოტოს ატვირთვა
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar relative z-10">
        {loading ? (
            <div className="py-20 text-center text-text-muted animate-pulse font-black uppercase text-[10px]">იტვირთება...</div>
        ) : xrays.length > 0 ? (
          xrays.map((xray) => (
            <div 
              key={xray.id} 
              className="bg-surface-soft/50 border border-transparent p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] hover:bg-surface hover:border-brand-purple/10 hover:shadow-xl transition-all group flex flex-col xl:flex-row xl:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 w-full">
                <div 
                    onClick={() => openViewModal(xray)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-soft border border-border-main flex-shrink-0 overflow-hidden cursor-pointer relative group/img"
                >
                    <img src={xray.imageUrl} alt="X-Ray" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                    <div className="absolute inset-0 bg-brand-deep/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={20} className="text-white" />
                    </div>
                </div>
                
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
                         <span>{xray.createdAt?.toDate ? new Date(xray.createdAt.toDate()).toLocaleDateString('ka-GE') : "თარიღი უცნობია"}</span>
                         <span className="hidden sm:block w-1 h-1 rounded-full bg-border-main"></span>
                     </p>
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest truncate">
                         ატვირთა: <span className="text-text-main">{xray.uploadedBy}</span>
                     </p>
                  </div>
                  <div className="text-sm font-black text-text-main tracking-tight flex items-start gap-2">
                    <MessageSquare size={16} className="text-brand-purple mt-0.5 shrink-0" />
                    <span className="break-words line-clamp-2">{xray.comment || <span className="text-text-muted italic opacity-50">კომენტარის გარეშე</span>}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full xl:w-auto mt-2 xl:mt-0 pt-4 xl:pt-0 border-t border-border-main xl:border-none">
                <button 
                  onClick={() => openViewModal(xray)}
                  className="flex-1 xl:flex-none flex items-center justify-center p-3 xl:px-4 bg-surface border border-border-main text-brand-purple rounded-xl hover:bg-brand-purple hover:text-white transition-all shadow-sm group/btn tooltip-trigger relative"
                  title="ნახვა"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => handleDownload(xray.imageUrl, `xray_${xray.createdAt?.toDate ? new Date(xray.createdAt.toDate()).getTime() : 'download'}.webp`)}
                  className="flex-1 xl:flex-none flex items-center justify-center p-3 xl:px-4 bg-surface border border-border-main text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm group/btn tooltip-trigger relative"
                  title="გადმოწერა"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => setImageToDelete(xray)}
                  className="flex-1 xl:flex-none flex items-center justify-center p-3 xl:px-4 bg-surface border border-border-main text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm group/btn tooltip-trigger relative"
                  title="წაშლა"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-40">
             <Camera size={48} className="mx-auto mb-4 text-text-muted" />
             <p className="font-black text-xs uppercase tracking-widest text-text-main">ფოტოები არ მოიძებნა</p>
          </div>
        )}
      </div>

      <div className="absolute left-[-5%] bottom-[-5%] w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => !uploading && setShowUploadModal(false)} />
            <div className="bg-surface rounded-[40px] w-full max-w-lg p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-text-main italic tracking-tighter flex items-center gap-3">
                        <Upload className="text-brand-purple" size={24} /> ფოტოს ატვირთვა
                    </h3>
                    <button 
                        onClick={() => !uploading && setShowUploadModal(false)}
                        className="text-text-muted hover:text-text-main p-2"
                        disabled={uploading}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Image Preview / File Input Area */}
                    <div className="w-full relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            ref={fileInputRef}
                            className="hidden" 
                            id="xray-upload"
                            disabled={uploading}
                        />
                        <label 
                            htmlFor="xray-upload"
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                                previewUrl ? 'border-brand-purple bg-surface overflow-hidden' : 'border-border-main bg-surface-soft hover:bg-surface hover:border-brand-purple/50'
                            }`}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center p-6">
                                    <Camera className="mx-auto text-text-muted mb-3" size={32} />
                                    <p className="text-xs font-black text-text-main uppercase tracking-widest mb-1">აირჩიეთ ფაილი</p>
                                    <p className="text-[10px] text-text-muted font-bold">JPG, PNG ფორმატები (Max: 10MB)</p>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <Loader2 className="animate-spin text-brand-purple mb-2" size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple">იტვირთება...</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 italic flex items-center gap-2">
                            <MessageSquare size={12} /> კომენტარი
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="დაამატეთ შენიშვნა ფოტოსთან დაკავშირებით..."
                            className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm text-text-main min-h-[100px] resize-none transition-all"
                            disabled={uploading}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            disabled={uploading}
                            className="flex-1 py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-border-main transition-all"
                        >
                            გაუქმება
                        </button>
                        <button 
                            type="button"
                            onClick={handleUpload}
                            disabled={!fileToUpload || uploading}
                            className="flex-1 py-4 bg-brand-purple text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-brand-deep transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {uploading ? (
                                <><Loader2 size={16} className="animate-spin" /> მიმდინარეობს</>
                            ) : (
                                <><Save size={16} /> შენახვა</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* View Full Image Modal */}
      {showViewModal && selectedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-deep/90 backdrop-blur-xl" onClick={() => setShowViewModal(false)} />
            <div className="relative z-10 w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 bg-surface/10 p-4 rounded-3xl backdrop-blur-md">
                    <div className="text-white">
                        <p className="text-sm font-black tracking-tight">{selectedImage.comment || "კომენტარის გარეშე"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                            ატვირთულია: {selectedImage.createdAt?.toDate ? new Date(selectedImage.createdAt.toDate()).toLocaleString('ka-GE') : ""} | {selectedImage.uploadedBy}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleDownload(selectedImage.imageUrl, `xray_${selectedImage.createdAt?.toDate ? new Date(selectedImage.createdAt.toDate()).getTime() : 'download'}.webp`)}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            <Download size={20} />
                        </button>
                        <button 
                            onClick={() => setShowViewModal(false)}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-black/50 rounded-[40px] overflow-hidden flex items-center justify-center p-4">
                    <img 
                        src={selectedImage.imageUrl} 
                        alt="Full X-Ray" 
                        className="max-w-full max-h-full object-contain rounded-2xl" 
                    />
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => !isDeleting && setImageToDelete(null)} />
            <div className="bg-surface rounded-[32px] w-full max-w-sm p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-text-main text-center mb-2">ფოტოს წაშლა</h3>
                <p className="text-sm font-bold text-text-muted text-center mb-8">
                    ნამდვილად გსურთ ფოტოს წაშლა? <br/>ეს მოქმედება შეუქცევადია.
                </p>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setImageToDelete(null)}
                        disabled={isDeleting}
                        className="flex-1 py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-border-main transition-all"
                    >
                        გაუქმება
                    </button>
                    <button 
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isDeleting ? <><Loader2 size={16} className="animate-spin" /> იშლება</> : "წაშლა"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PatientXRays;
