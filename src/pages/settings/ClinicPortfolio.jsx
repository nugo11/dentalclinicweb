import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { PLANS } from "../../config/plans";
import Sidebar from "../../components/Dashboard/Sidebar";
import TopNav from "../../components/Dashboard/TopNav";
import FormInput from "../../components/Common/FormInput";
import { 
  Globe, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  Save, 
  Loader2, 
  Lock,
  Layout,
  ExternalLink,
  Clock,
  Camera,
  CheckCircle2,
  Plus,
  X,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { logActivity } from "../../utils/activityLogger";

const DIRECTIONS = [
  "ბავშვთა ქირურგია",
  "ორთოდონტია",
  "ესთეტიური სტომატოლოგია",
  "ბავშვთა თერაპია",
  "ყბა-სახის ქირურგია",
  "იმპლანტოლოგია",
  "ოდონტოლოგია",
  "მოზრდილთა სტომატოლოგია",
  "ბავშვთა სტომატოლოგია",
  "მოზრდილთა თერაპია",
  "მოზრდილთა ქირურგია",
  "პროფილაქტიკური სტომატოლოგია",
  "ბავშვთა თერაპიული სტომატოლოგია",
  "ბავშვთა ორთოდონტია",
  "ბავშვთა ორთოპედია",
  "სედაცია",
  "ციფრული დიაგნოსტიკა",
  "სედაცია და ზოგადი გაუტკივარება",
  "ენდოდონტია",
  "პაროდონტოლოგია",
  "ორთოპედიული სტომატოლოგია",
  "ვინირება",
  "კბილების გათეთრება",
  "რენტგენო-დიაგნოსტიკა"
];
const UpgradeOverlay = ({ title }) => (
  <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border-dark group-hover:border-brand-purple/20 transition-all">
     <Lock className="text-text-muted mb-2" size={24} />
     <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">{title || "Upgrade Required"}</p>
     <Link to="/settings/billing" className="px-4 py-2 bg-brand-purple text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">გაუმჯობესება</Link>
  </div>
);

const ClinicPortfolio = () => {
  const { clinicData, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const [customDir, setCustomDir] = useState("");
  
  const [formData, setFormData] = useState({
    clinicName: "",
    logoUrl: "",
    description: "",
    phone: "",
    city: "",
    address: "",
    workingHours: "",
    mapUrl: "",
    specialties: [],
    isPublic: false,
    legalName: "",
    idCode: "",
    bankAccounts: [{ bankName: "", iban: "" }],
    stampUrl: ""
  });

  useEffect(() => {
    if (clinicData) {
      setFormData({
        clinicName: clinicData.clinicName || "",
        logoUrl: clinicData.logoUrl || "",
        description: clinicData.description || "",
        phone: clinicData.phone || "",
        city: clinicData.city || "თბილისი",
        address: clinicData.address || "",
        workingHours: clinicData.workingHours || "09:00 - 19:00",
        mapUrl: clinicData.mapUrl || "",
        specialties: clinicData.specialties || [],
        isPublic: clinicData.isPublic || false,
        legalName: clinicData.legalName || "",
        idCode: clinicData.idCode || "",
        bankAccounts: clinicData.bankAccounts || [{ bankName: "", iban: "" }],
        stampUrl: clinicData.stampUrl || ""
      });
    }
  }, [clinicData]);

  useEffect(() => {
    if (toast.text) {
      const t = setTimeout(() => setToast({ type: "", text: "" }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const planKey = (clinicData?.plan || "free").toLowerCase();
  const plan = planKey === "solo" ? PLANS.basic : (PLANS[planKey] || PLANS.free);
  const features = plan.portfolioFeatures;

  const compressImage = (file, isStamp = false) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (isStamp) {
            const size = 600;
            canvas.width = size;
            canvas.height = size;
            const scale = Math.min(size / img.width, size / img.height);
            const x = (size / 2) - (img.width / 2) * scale;
            const y = (size / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          } else {
            const MAX_WIDTH = 600;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob((blob) => {
            resolve(blob);
          }, type, 0.8);
        };
      };
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const compressedBlob = await compressImage(file, false);
      const CLOUD_NAME = "dxyhm9ftw";
      const UPLOAD_PRESET = "ml_default";

      const uploadData = new FormData();
      uploadData.append("file", compressedBlob);
      uploadData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, logoUrl: result.secure_url }));
        setToast({ type: "success", text: "ლოგო აიტვირთა!" });
      }
    } catch (error) {
      console.error(error);
      setToast({ type: "error", text: "ლოგოს ატვირთვა ვერ მოხერხდა" });
    } finally {
      setUploading(false);
    }
  };

  const handleStampUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      setToast({ type: "error", text: "შტამპისთვის დაშვებულია მხოლოდ PNG ფორმატი!" });
      return;
    }
    
    setUploading(true);
    try {
      const compressedBlob = await compressImage(file, true);
      const CLOUD_NAME = "dxyhm9ftw";
      const UPLOAD_PRESET = "ml_default";

      const uploadData = new FormData();
      uploadData.append("file", compressedBlob);
      uploadData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, stampUrl: result.secure_url }));
        setToast({ type: "success", text: "შტამპი აიტვირთა!" });
      }
    } catch (error) {
      console.error(error);
      setToast({ type: "error", text: "შენახვა ვერ მოხერხდა" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin || !clinicData?.id) return;
    setLoading(true);
    try {
      const clinicRef = doc(db, "clinics", clinicData.id);
      
      // Extract URL if user pasted full iframe tag
      const mapUrlValue = formData.mapUrl.includes('src="') 
        ? formData.mapUrl.split('src="')[1].split('"')[0] 
        : formData.mapUrl;

      await updateDoc(clinicRef, {
        ...formData,
        mapUrl: mapUrlValue,
        updatedAt: new Date().toISOString()
      });

      // LOG ACTIVITY
      await logActivity(clinicData.id, { uid: auth.currentUser.uid, fullName: clinicData.clinicName, role: 'admin' }, 'settings_update', 'განახლდა კლინიკის პარამეტრები და პორტფოლიო', { clinicId: clinicData.id });

      setToast({ type: "success", text: "მონაცემები შენახულია!" });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", text: "შენახვა ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (s) => {
    if (!features.canShowSpecialties) return;
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(item => item !== s)
        : [...prev.specialties, s]
    }));
  };

  const addCustomSpecialty = () => {
    if (!customDir.trim() || !features.canAddCustomSpecialty) return;
    if (!formData.specialties.includes(customDir.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, customDir.trim()]
      }));
    }
    setCustomDir("");
  };



  return (
    <>
      <Helmet>
        <title>პორტფოლიო და პარამეტრები — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">კლინიკის პორტფოლიო</h1>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1 italic">მართეთ თქვენი საჯარო გვერდი და კატალოგი</p>
              </div>
              <div className="flex items-center gap-3">
                {toast.text && (
                  <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 text-[11px] font-black uppercase tracking-widest ${
                    toast.type === "success" 
                      ? "bg-surface text-emerald-600 border-emerald-500/20" 
                      : "bg-surface text-red-500 border-red-500/20"
                  }`}>
                    {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {toast.text}
                  </div>
                )}
                <Link to={`/catalog/${clinicData.id}`} className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-purple hover:bg-brand-purple hover:text-white transition-all shadow-sm">
                   <ExternalLink size={14} /> ჩემი გვერდი
                </Link>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-7 space-y-8">
                  <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="relative group">
                           <div className="w-32 h-32 bg-surface-soft rounded-[32px] border-4 border-border-main shadow-xl flex items-center justify-center overflow-hidden">
                              {formData.logoUrl ? (
                                <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                              ) : (
                                <ImageIcon className="text-text-muted" size={40} />
                              )}
                              {uploading && <div className="absolute inset-0 bg-brand-deep/50 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}
                           </div>
                           <label className="absolute bottom-[-10px] right-[-10px] w-10 h-10 bg-brand-purple text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all active:scale-95">
                              <Camera size={18} />
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           </label>
                        </div>
                        <div>
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-purple/5 text-brand-purple rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                              პაკეტი: {plan.title}
                           </div>
                           <h3 className="text-xl font-black text-text-main italic">ლოგო და სახელი</h3>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <FormInput label="კლინიკის საჯარო სახელი" icon={Globe} value={formData.clinicName} onChange={val => setFormData({...formData, clinicName: val})} />
                        <div className="relative group">
                           <FormInput type="textarea" label="კლინიკის შესახებ" value={formData.description} onChange={val => setFormData({...formData, description: val})} className={!features.canShowAbout ? "opacity-30 pointer-events-none" : ""} />
                           {!features.canShowAbout && <UpgradeOverlay title="Pro / Clinic Plus Required" />}
                        </div>
                     </div>
                  </div>

                  <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Layout className="text-brand-purple" size={20} />
                           <h3 className="text-sm font-black uppercase tracking-widest text-text-main italic">მიმართულებები</h3>
                        </div>
                     </div>
                     
                     <div className="relative group">
                        {features.canAddCustomSpecialty && (
                          <div className="flex gap-2 mb-6">
                             <input 
                                type="text" 
                                value={customDir} 
                                onChange={e => setCustomDir(e.target.value)}
                                placeholder="სხვა მიმართულება..."
                                className="flex-1 bg-surface-soft border border-border-main rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-brand-purple transition-all"
                             />
                             <button type="button" onClick={addCustomSpecialty} className="p-3 bg-brand-purple text-white rounded-xl hover:bg-brand-deep transition-all shadow-md">
                                <Plus size={18} />
                             </button>
                          </div>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${!features.canShowSpecialties ? "opacity-30 pointer-events-none" : ""}`}>
                           {DIRECTIONS.map(s => (
                              <button 
                                key={s} type="button" onClick={() => toggleSpecialty(s)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${formData.specialties.includes(s) ? "bg-brand-purple text-white border-brand-purple" : "bg-surface-soft text-text-muted border-transparent"}`}
                              >
                                 <span className="text-[11px] font-black uppercase tracking-tight">{s}</span>
                              </button>
                           ))}
                           {/* არჩეული Custom მიმართულებები */}
                           {formData.specialties.filter(s => !DIRECTIONS.includes(s)).map(s => (
                              <button 
                                key={s} type="button" onClick={() => toggleSpecialty(s)}
                                className="flex items-center justify-between p-4 rounded-2xl border bg-brand-purple text-white border-brand-purple hover:bg-red-500 hover:border-red-500 transition-all group/item"
                              >
                                 <span className="text-[11px] font-black uppercase tracking-tight">{s}</span>
                                 <X size={14} className="opacity-50 group-hover/item:opacity-100" />
                              </button>
                           ))}
                        </div>
                        {!features.canShowSpecialties && <UpgradeOverlay title="Pro / Clinic Plus Required" />}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-5 space-y-8">
                  <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm space-y-8">
                     <h3 className="text-xl font-black text-text-main italic flex items-center gap-3">
                        <Phone className="text-brand-purple" size={20} /> კონტაქტი
                     </h3>
                     <div className="space-y-6">
                        <div className="relative group">
                           <FormInput label="ტელეფონის ნომერი" icon={Phone} value={formData.phone} onChange={val => setFormData({...formData, phone: val})} className={!features.canShowPhone ? "opacity-30 pointer-events-none" : ""} />
                           {!features.canShowPhone && <UpgradeOverlay title="Solo / Pro Required" />}
                        </div>
                        <div className="relative group">
                           <FormInput label="მისამართი" icon={MapPin} value={formData.address} onChange={val => setFormData({...formData, address: val})} />
                        </div>
                        <div className="relative group">
                           <FormInput label="სამუშაო საათები" icon={Clock} value={formData.workingHours} onChange={val => setFormData({...formData, workingHours: val})} className={!features.canShowHours ? "opacity-30 pointer-events-none" : ""} />
                           {!features.canShowHours && <UpgradeOverlay title="Solo / Pro Required" />}
                        </div>
                        <div className="relative group">
                           <FormInput label="Google Maps (Iframe Src)" icon={Globe} value={formData.mapUrl} onChange={val => setFormData({...formData, mapUrl: val})} className={!features.canShowMap ? "opacity-30 pointer-events-none" : ""} />
                           {!features.canShowMap && <UpgradeOverlay title="Clinic Plus Required" />}
                        </div>
                     </div>
                  </div>

                  <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm space-y-8">
                     <div className="flex items-center gap-3">
                        <Lock className="text-brand-purple" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main italic">იურიდიული მონაცემები (ინვოისისთვის)</h3>
                     </div>

                     <div className="space-y-6">
                        <FormInput label="კომპანიის იურიდიული დასახელება" value={formData.legalName} onChange={val => setFormData({...formData, legalName: val})} />
                        <FormInput label="საიდენტიფიკაციო კოდი" value={formData.idCode} onChange={val => setFormData({...formData, idCode: val})} />
                        
                        <div className="space-y-4 pt-4 border-t border-border-main">
                           <div className="flex justify-between items-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">საბანკო რეკვიზიტები</p>
                              <button 
                                 type="button" 
                                 onClick={() => setFormData(prev => ({ ...prev, bankAccounts: [...prev.bankAccounts, { bankName: "", iban: "" }] }))}
                                 className="text-[10px] font-black text-brand-purple hover:text-text-main flex items-center gap-1"
                              >
                                 <Plus size={14} /> ბანკის დამატება
                              </button>
                           </div>
                           
                           {formData.bankAccounts.map((acc, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-soft rounded-2xl relative group/bank">
                                 <FormInput 
                                    label="მიმღები ბანკი" 
                                    value={acc.bankName} 
                                    onChange={val => {
                                       const newBanks = [...formData.bankAccounts];
                                       newBanks[index].bankName = val;
                                       setFormData({...formData, bankAccounts: newBanks});
                                    }} 
                                 />
                                 <FormInput 
                                    label="საბანკო ანგარიში (IBAN)" 
                                    value={acc.iban} 
                                    onChange={val => {
                                       const newBanks = [...formData.bankAccounts];
                                       newBanks[index].iban = val;
                                       setFormData({...formData, bankAccounts: newBanks});
                                    }} 
                                 />
                                 {formData.bankAccounts.length > 1 && (
                                    <button 
                                       type="button" 
                                       onClick={() => {
                                          const newBanks = formData.bankAccounts.filter((_, i) => i !== index);
                                          setFormData({...formData, bankAccounts: newBanks});
                                       }}
                                       className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/bank:opacity-100 transition-all shadow-lg"
                                    >
                                       <X size={12} />
                                    </button>
                                 )}
                              </div>
                           ))}
                        </div>
                        
                        <div className="pt-4 border-t border-border-main">
                           <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">კლინიკის შტამპი / ბეჭედი</p>
                           <div className="flex items-center gap-6">
                              <div className="w-24 h-24 bg-surface-soft rounded-2xl border-2 border-dashed border-border-dark flex items-center justify-center overflow-hidden relative group/stamp">
                                 {formData.stampUrl ? (
                                   <img src={formData.stampUrl} className="w-full h-full object-contain" alt="Stamp" />
                                 ) : (
                                   <Camera className="text-text-muted" size={24} />
                                 )}
                                 <label className="absolute inset-0 bg-brand-purple/80 text-white flex items-center justify-center opacity-0 group-hover/stamp:opacity-100 transition-all cursor-pointer">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleStampUpload} />
                                 </label>
                              </div>
                              <p className="text-[9px] text-text-muted font-bold max-w-[200px]">ატვირთეთ PNG ან JPG ფორმატის ბეჭედი (სასურველია გამჭვირვალე ფონით)</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm">
                     <button type="button" onClick={() => setFormData({...formData, isPublic: !formData.isPublic})} className="flex items-center gap-4 group cursor-pointer w-full">
                        <div className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${formData.isPublic ? "bg-emerald-500" : "bg-surface-soft"}`}>
                           <div className={`w-6 h-6 bg-surface rounded-full shadow-sm transition-all duration-300 transform ${formData.isPublic ? "translate-x-6" : "translate-x-0"}`} />
                        </div>
                        <div className="text-left"><span className="text-xs font-black text-text-main uppercase tracking-widest block">საჯარო სტატუსი</span></div>
                     </button>
                     <button type="submit" disabled={loading} className="w-full mt-10 py-5 bg-brand-deep text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-purple transition-all flex justify-center items-center gap-3">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> შენახვა</>}
                     </button>
                  </div>
               </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default ClinicPortfolio;
