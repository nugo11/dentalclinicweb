import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { X, Loader2, Trash2, Edit3, AlertTriangle, Check } from 'lucide-react';
import { transliterateToGeorgian } from '../../utils/transliterateKa';
import { useAuth } from '../../context/AuthContext';

const EditAppointmentModal = ({ isOpen, onClose, appointmentData }) => {
  const { role } = useAuth();
  const isReadOnly = role === 'manager';
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    duration: '60',
    service: ''
  });

  useEffect(() => {
    if (isOpen && appointmentData) {
      const startObj = new Date(appointmentData.start);
      const endObj = new Date(appointmentData.end);
      const year = startObj.getFullYear();
      const month = String(startObj.getMonth() + 1).padStart(2, '0');
      const day = String(startObj.getDate()).padStart(2, '0');
      const hours = String(startObj.getHours()).padStart(2, '0');
      const mins = String(startObj.getMinutes()).padStart(2, '0');
      
      const diffMs = endObj.getTime() - startObj.getTime();
      const durationMins = Math.round(diffMs / 60000);

      setFormData({
        date: `${year}-${month}-${day}`,
        startTime: `${hours}:${mins}`,
        duration: String(durationMins),
        service: appointmentData.extendedProps?.service || ''
      });
      setShowDeleteConfirm(false);
      setToast({ show: false, message: "" });
    }
  }, [isOpen, appointmentData]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    // წარსულში ჯავშნის ვალიდაცია
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = formData.date.split("-");
    const selected = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (selected < today && role !== "admin") {
      setToast({ show: true, message: "წარსულში ჯავშნის უფლება აქვს მხოლოდ ადმინისტრატორს" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
      return;
    }

    setLoading(true);
    try {
      const [year, month, day] = formData.date.split('-');
      const [hours, minutes] = formData.startTime.split(':');
      const startDateTime = new Date(year, month - 1, day, hours, minutes);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      await updateDoc(doc(db, "appointments", appointmentData.id), {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        service: formData.service
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // წაშლის ვალიდაცია: წარსული ჯავშნის წაშლაც მხოლოდ ადმინს შეეძლოს
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointmentData.start);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today && role !== "admin") {
      setToast({ show: true, message: "წარსული ჯავშნის წაშლის უფლება აქვს მხოლოდ ადმინისტრატორს" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
      setShowDeleteConfirm(false);
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "appointments", appointmentData.id));
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointmentData) return null;

  const inputClasses = "w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:bg-white border-2 border-transparent focus:border-brand-purple transition-all";

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="app-overlay fixed inset-0 bg-brand-deep/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="app-sheet bg-white rounded-t-[28px] md:rounded-[40px] w-full max-w-md shadow-2xl relative z-10 overflow-hidden font-nino animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-blue-500 text-white shadow-blue-500/20">
               <Edit3 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-brand-deep italic tracking-tight leading-tight">
                {appointmentData.title}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">რედაქტირება</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8">
          {/* წაშლის დასტურის სექცია - ჩნდება მხოლოდ როცა წაშლას აწვებიან */}
          {showDeleteConfirm ? (
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <p className="font-black text-sm italic uppercase tracking-tighter">დარწმუნებული ხართ?</p>
              </div>
              <p className="text-xs text-red-700/70 font-bold mb-6 leading-relaxed">
                ჯავშნის წაშლა შეუქცევადი პროცესია. ეს ინფორმაცია გაქრება როგორც კალენდრიდან, ისე დაშბორდიდან.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-4 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100/50 transition-all"
                >
                  გაუქმება
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex justify-center items-center"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "დიახ, წაშალე"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">თარიღი</label>
                  <input type="date" required disabled={isReadOnly} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">დრო</label>
                  <input type="time" required disabled={isReadOnly} value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className={inputClasses} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">ხანგრძლივობა</label>
                  <select disabled={isReadOnly} value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer`}>
                    <option value="30">30 წთ</option>
                    <option value="60">1 სთ</option>
                    <option value="90">1.5 სთ</option>
                    <option value="120">2 სთ</option>
                  </select>
                  <div className="absolute right-4 top-[38px] pointer-events-none text-gray-400 border-l border-b border-gray-400 w-2 h-2 -rotate-45" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">მომსახურება</label>
                  <input required disabled={isReadOnly} type="text" value={formData.service} onChange={e => setFormData({...formData, service: transliterateToGeorgian(e.target.value)})} className={inputClasses} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {role !== 'manager' ? (
                  <>
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="py-5 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                    >
                      <Trash2 size={16} /> წაშლა
                    </button>
                    
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="py-5 text-white bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> შენახვა</>}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="col-span-2 py-5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    დახურვა
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;