import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  X, 
  Loader2, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  HeartPulse, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  FileText, 
  MapPin,
  CalendarDays,
  ShieldAlert,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';
import { transliterateToGeorgian } from '../../utils/transliterateKa';
import { useAuth } from '../../context/AuthContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { scrollToFirstError } from '../../utils/scrollHelper';
import { formatPhone } from '../../utils/phoneFormatter';
import DentalChart from '../Patients/DentalChart/DentalChart';

const EditAppointmentModal = ({ isOpen, onClose, appointmentData }) => {
  useLockBodyScroll(isOpen);
  const navigate = useNavigate();
  const { role } = useAuth();
  const isDoctor = role === 'doctor';
  const isReadOnly = role === 'manager';

  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'details' | 'chart' | 'history'
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    duration: '60',
    service: ''
  });

  const patientId = appointmentData?.extendedProps?.patientId || appointmentData?.patientId;
  const isExternal = Boolean(appointmentData?.isExternal || appointmentData?.extendedProps?.isExternal);

  useEffect(() => {
    if (isOpen && appointmentData) {
      const hasPatient = Boolean(patientId && patientId !== 'external');
      setActiveTab(hasPatient ? 'details' : 'manage');
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
        duration: String(durationMins || 60),
        service: appointmentData.extendedProps?.service || appointmentData.service || ''
      });
      setShowDeleteConfirm(false);
      setToast({ show: false, message: "" });

      // პაციენტის დეტალების და ისტორიის წამოღება
      setLoadingPatient(true);
      const fetchPatientData = async () => {
        try {
          let pData = null;
          let targetPatId = (patientId && patientId !== 'external') ? patientId : null;

          if (targetPatId) {
            const pDoc = await getDoc(doc(db, "patients", targetPatId));
            if (pDoc.exists()) {
              pData = { id: pDoc.id, ...pDoc.data() };
            }
          }

          // Fallback: თუ patientId არ იყო ჩანაწერში (ძველი ჯავშნები), ვეძებთ სახელით
          if (!pData && appointmentData?.title && !isExternal) {
            const cleanTitle = appointmentData.title.split(' - ')[0].trim();
            const qSearch = query(
              collection(db, "patients"),
              where("clinicId", "==", appointmentData?.clinicId || appointmentData?.extendedProps?.clinicId || "")
            );
            const pSnap = await getDocs(qSearch);
            const found = pSnap.docs.find(d => {
              const fName = d.data()?.fullName || "";
              return fName.toLowerCase() === cleanTitle.toLowerCase();
            });
            if (found) {
              targetPatId = found.id;
              pData = { id: found.id, ...found.data() };
              setActiveTab('details');
            }
          }

          setPatientDetails(pData);

          if (targetPatId) {
            const qHist = query(
              collection(db, "appointments"),
              where("patientId", "==", targetPatId)
            );
            const snapHist = await getDocs(qHist);
            const list = snapHist.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => new Date(b.start) - new Date(a.start));
            setPatientHistory(list);
          } else {
            setPatientHistory([]);
          }
        } catch (err) {
          console.error("Error loading patient info in calendar modal:", err);
          setPatientDetails(null);
          setPatientHistory([]);
        } finally {
          setLoadingPatient(false);
        }
      };

      fetchPatientData();
    }
  }, [isOpen, appointmentData, patientId, isExternal]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.date) errors.date = true;
    if (!formData.startTime) errors.startTime = true;
    if (!formData.service || !formData.service.trim()) errors.service = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setToast({ show: true, message: "გთხოვთ შეავსოთ ყველა აუცილებელი ველი (*)" });
      scrollToFirstError('.app-sheet');
      setTimeout(() => setToast({ show: false, message: "" }), 4000);
      return;
    }

    // წარსულში ჯავშნის ვალიდაცია
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = formData.date.split("-");
    const selected = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (selected < today && !isExternal) {
      setToast({ show: true, message: "შიდა ჯავშნის წარსულში გადატანა აკრძალულია" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
      return;
    }

    setLoading(true);
    try {
      const [yearStr, monthStr, dayStr] = formData.date.split('-');
      const [hoursStr, minutesStr] = formData.startTime.split(':');
      const startDateTime = new Date(yearStr, monthStr - 1, dayStr, hoursStr, minutesStr);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      // Overlap check for doctor
      const doctorId = appointmentData.doctorId || appointmentData.extendedProps?.doctorId;
      if (doctorId) {
        const qOverlap = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId)
        );
        const overlapSnapshot = await getDocs(qOverlap);
        const hasOverlap = overlapSnapshot.docs.some((docSnap) => {
          if (docSnap.id === appointmentData.id) return false;
          const app = docSnap.data();
          if (app.status === "cancelled") return false;
          const existStart = new Date(app.start).getTime();
          const existEnd = new Date(app.end).getTime();
          const newStart = startDateTime.getTime();
          const newEnd = endDateTime.getTime();
          return newStart < existEnd && newEnd > existStart;
        });

        if (hasOverlap) {
          setToast({ show: true, message: "არჩეულ დროს ექიმს უკვე აქვს სხვა ჩანაწერი!" });
          setTimeout(() => setToast({ show: false, message: "" }), 4000);
          setLoading(false);
          return;
        }
      }

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

  const inputClasses = "w-full px-4 py-3.5 bg-surface-soft rounded-2xl outline-none font-bold text-sm text-text-main focus:bg-surface border-2 border-transparent focus:border-brand-purple transition-all min-w-0 box-border";

  const patientName = patientDetails?.fullName || appointmentData.extendedProps?.patientName || appointmentData.title || "პაციენტი";
  const patientPhoneNum = patientDetails?.phone || appointmentData.extendedProps?.patientPhone || "";
  const patientPersonalId = patientDetails?.personalId || appointmentData.extendedProps?.personalId || "";
  const activePatientId = patientDetails?.id || (patientId && patientId !== 'external' ? patientId : null);

  // ასაკის გამოთვლა
  const getAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const patientAge = getAge(patientDetails?.birthDate);

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 overscroll-none touch-action-none">
      <div className="app-overlay fixed inset-0 touch-none" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="app-sheet bg-surface rounded-t-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden font-nino animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 md:hidden shrink-0" />
        
        {/* Header with Patient Card Summary */}
        <div className="p-5 md:p-6 border-b border-border-main bg-surface-soft/60 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isExternal 
                  ? 'bg-slate-500 text-white shadow-slate-500/20' 
                  : 'bg-brand-purple text-white shadow-brand-purple/20'
              }`}>
                {isExternal ? <Building2 size={22} /> : <User size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-black text-text-main italic tracking-tight truncate">
                    {patientName}
                  </h2>
                  {isExternal && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-500 text-white rounded-md">
                      სხვა კლინიკა
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                  {patientPersonalId && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-text-muted bg-surface px-2.5 py-0.5 rounded-md border border-border-main">
                      ID: {patientPersonalId}
                    </span>
                  )}
                  {patientPhoneNum && (
                    <a 
                      href={`tel:${patientPhoneNum}`}
                      className="font-bold text-brand-purple hover:underline flex items-center gap-1 text-xs"
                      title="დარეკვა"
                    >
                      <Phone size={11} /> {formatPhone(patientPhoneNum)}
                    </a>
                  )}
                  {patientAge !== null && (
                    <span className="text-[10px] font-bold text-text-muted">
                      • {patientAge} წლის
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activePatientId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/patients/${activePatientId}`);
                  }}
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-brand-purple hover:bg-brand-deep text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-brand-purple/20 cursor-pointer active:scale-95"
                  title="პაციენტის ბარათის რედაქტირება"
                >
                  <Edit3 size={13} />
                  <span>ბარათის რედაქტირება</span>
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-2 text-text-muted hover:text-text-main hover:bg-surface-soft rounded-xl transition-colors cursor-pointer"
                title="დახურვა"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (შიდა პაციენტისთვის) */}
          {(activePatientId || (patientId && patientId !== 'external')) && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-border-main overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'bg-surface text-text-muted hover:text-text-main hover:bg-surface-soft border border-border-main'
                }`}
              >
                <User size={13} />
                <span>პაციენტის ბარათი</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'chart'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'bg-surface text-text-muted hover:text-text-main hover:bg-surface-soft border border-border-main'
                }`}
              >
                <Layers size={13} />
                <span>კბილების რუკა</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'bg-surface text-text-muted hover:text-text-main hover:bg-surface-soft border border-border-main'
                }`}
              >
                <Clock size={13} />
                <span>ვიზიტის მართვა</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'bg-surface text-text-muted hover:text-text-main hover:bg-surface-soft border border-border-main'
                }`}
              >
                <Activity size={13} />
                <span>ვიზიტების ისტორია</span>
                {patientHistory.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'
                  }`}>
                    {patientHistory.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB 1: ვიზიტის მართვა */}
          {activeTab === 'manage' && (
            <div>
              {showDeleteConfirm ? (
                <div className="bg-red-500/10 rounded-3xl p-6 border border-red-500/20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 text-red-600 mb-4">
                    <AlertTriangle size={24} />
                    <p className="font-black text-sm italic uppercase tracking-tighter">დარწმუნებული ხართ?</p>
                  </div>
                  <p className="text-xs text-red-700/70 font-bold mb-6 leading-relaxed">
                    ჯავშნის წაშლა შეუქცევადი პროცესია. ეს ინფორმაცია გაქრება როგორც კალენდრიდან, ისე დაშბორდიდან.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-4 bg-surface text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-500/20 hover:bg-red-100/50 transition-all cursor-pointer"
                    >
                      გაუქმება
                    </button>
                    <button 
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex justify-center items-center cursor-pointer"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : "დიახ, წაშალე"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                        თარიღი <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        required 
                        disabled={isReadOnly} 
                        value={formData.date} 
                        onChange={e => {
                          setFormData({...formData, date: e.target.value});
                          if (formErrors.date) setFormErrors(prev => ({ ...prev, date: false }));
                        }} 
                        className={`${inputClasses} ${formErrors.date ? 'border-red-500 bg-red-500/10' : ''}`} 
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                        დრო <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="time" 
                        required 
                        disabled={isReadOnly} 
                        value={formData.startTime} 
                        onChange={e => {
                          setFormData({...formData, startTime: e.target.value});
                          if (formErrors.startTime) setFormErrors(prev => ({ ...prev, startTime: false }));
                        }} 
                        className={`${inputClasses} ${formErrors.startTime ? 'border-red-500 bg-red-500/10' : ''}`} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">ხანგრძლივობა</label>
                      <select 
                        disabled={isReadOnly} 
                        value={formData.duration} 
                        onChange={e => setFormData({...formData, duration: e.target.value})} 
                        className={`${inputClasses} appearance-none cursor-pointer`}
                      >
                        <option value="30">30 წთ</option>
                        <option value="60">1 სთ</option>
                        <option value="90">1.5 სთ</option>
                        <option value="120">2 სთ</option>
                      </select>
                      <div className="absolute right-4 top-[38px] pointer-events-none text-text-muted border-l border-b border-gray-400 w-2 h-2 -rotate-45" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                        მომსახურება <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        disabled={isReadOnly} 
                        type="text" 
                        value={formData.service} 
                        onChange={e => {
                          setFormData({...formData, service: transliterateToGeorgian(e.target.value)});
                          if (formErrors.service) setFormErrors(prev => ({ ...prev, service: false }));
                        }} 
                        className={`${inputClasses} ${formErrors.service ? 'border-red-500 bg-red-500/10' : ''}`} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3">
                    {role !== 'manager' ? (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="py-4 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={16} /> წაშლა
                        </button>
                        
                        <button 
                          type="submit" 
                          disabled={loading} 
                          className="py-4 text-white bg-brand-purple hover:bg-brand-deep rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-purple/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> შენახვა</>}
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button" 
                        onClick={onClose}
                        className="col-span-2 py-4 text-text-muted bg-surface-soft hover:bg-border-main rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                      >
                        დახურვა
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: პაციენტის ბარათი (ინფორმაციული ხედი) */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {loadingPatient ? (
                <div className="flex justify-center py-12 text-brand-purple">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : patientDetails ? (
                <div className="space-y-5">
                  {/* Action Banner */}
                  <div className="p-4 bg-brand-purple/5 border border-brand-purple/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-brand-purple text-white flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-main uppercase">პაციენტის სრული პროფილი</h4>
                        <p className="text-[10px] font-bold text-text-muted">მონაცემების რედაქტირებისთვის გადადით პროფილზე</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/patients/${patientId}`);
                      }}
                      className="px-4 py-2 bg-brand-purple hover:bg-brand-deep text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Edit3 size={13} />
                      <span>პაციენტის ბარათის რედაქტირება</span>
                    </button>
                  </div>

                  {/* General Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">სრული სახელი</span>
                      <p className="text-xs font-black text-text-main truncate">
                        {patientDetails.fullName || '—'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">პირადი ნომერი</span>
                      <p className="text-xs font-black text-text-main">
                        {patientDetails.personalId || 'არ არის მითითებული'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">ტელეფონი</span>
                      {patientDetails.phone ? (
                        <a href={`tel:${patientDetails.phone}`} className="text-xs font-black text-brand-purple hover:underline flex items-center gap-1">
                          <Phone size={11} /> {formatPhone(patientDetails.phone)}
                        </a>
                      ) : (
                        <p className="text-xs font-black text-text-main">—</p>
                      )}
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">დაბადების თარიღი</span>
                      <p className="text-xs font-black text-text-main">
                        {patientDetails.birthDate ? `${patientDetails.birthDate} ${patientAge !== null ? `(${patientAge} წ.)` : ''}` : '—'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">სქესი</span>
                      <p className="text-xs font-black text-text-main">
                        {patientDetails.gender === 'male' ? 'მამრობითი' : patientDetails.gender === 'female' ? 'მდედრობითი' : '—'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">სისხლის ჯგუფი</span>
                      <p className="text-xs font-black text-brand-purple flex items-center gap-1">
                        <HeartPulse size={12} /> {patientDetails.bloodGroup || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50 col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">ელ-ფოსტა</span>
                      <p className="text-xs font-black text-text-main truncate">
                        {patientDetails.email || '—'}
                      </p>
                    </div>

                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-main/50 col-span-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1">მისამართი</span>
                      <p className="text-xs font-bold text-text-main truncate">
                        {[patientDetails.actualRegion, patientDetails.actualResidenceAddress].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Allergies Alert Card */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    patientDetails.allergies 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldAlert size={16} className={patientDetails.allergies ? 'text-red-500' : 'text-emerald-500'} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        patientDetails.allergies ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        ალერგიები
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${patientDetails.allergies ? 'text-red-600 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {patientDetails.allergies || "ალერგიული რეაქციები არ ფიქსირდება"}
                    </p>
                  </div>

                  {/* Chronic Diseases */}
                  {patientDetails.chronicDiseases && (
                    <div className="bg-surface-soft p-4 rounded-2xl border border-border-main/50 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block">ქრონიკული დაავადებები</span>
                      <p className="text-xs font-bold text-text-main">{patientDetails.chronicDiseases}</p>
                    </div>
                  )}

                  {/* Anamnesis / Medical notes */}
                  {patientDetails.anamnesis && (
                    <div className="bg-surface-soft p-4 rounded-2xl border border-border-main/50 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block">ანამნეზი და კლინიკური ჩანაწერები</span>
                      <p className="text-xs font-bold text-text-main leading-relaxed">{patientDetails.anamnesis}</p>
                    </div>
                  )}

                  {/* Dental Chart embedded right in Patient Card (Read-Only) */}
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-surface-soft border border-border-main rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                          <Layers size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-text-main uppercase">კბილების რუკა (საინფორმაციო რეჟიმი)</h4>
                          <p className="text-[10px] font-bold text-text-muted">მოდალიდან რუკა ხელმისაწვდომია მხოლოდ ნახვის რეჟიმში. კბილის სტატუსის შესაცვლელად გამოიყენეთ რედაქტირების ღილაკი.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (activePatientId) navigate(`/patients/${activePatientId}`);
                        }}
                        className="px-4 py-2 bg-brand-purple hover:bg-brand-deep text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        <Edit3 size={13} />
                        <span>პაციენტის ბარათის რედაქტირება</span>
                      </button>
                    </div>

                    <div className="bg-surface rounded-2xl border border-border-main p-2 sm:p-4 overflow-x-auto">
                      <DentalChart 
                        data={patientDetails.teethStatus || {}} 
                        onToothUpdate={null} 
                      />
                    </div>
                  </div>

                  {/* Bottom link button */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (activePatientId) navigate(`/patients/${activePatientId}`);
                    }}
                    className="w-full py-4 bg-brand-purple hover:bg-brand-deep text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20 cursor-pointer active:scale-98"
                  >
                    <Edit3 size={15} />
                    <span>პაციენტის ბარათის რედაქტირება</span>
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-text-muted space-y-2">
                  <User size={32} className="mx-auto opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wider">მონაცემები ვერ მოიძებნა</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: კბილების რუკა (საინფორმაციო ხედი - შეცვლის გარეშე) */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              {loadingPatient ? (
                <div className="flex justify-center py-12 text-brand-purple">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Chart Info & Action Header */}
                  <div className="p-4 bg-surface-soft border border-border-main rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-main uppercase">კბილების რუკა (საინფორმაციო რეჟიმი)</h4>
                        <p className="text-[10px] font-bold text-text-muted">კალენდრიდან რუკა ხელმისაწვდომია მხოლოდ ნახვის რეჟიმში. კბილის სტატუსის შესაცვლელად დააჭირეთ რედაქტირებას.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (activePatientId) navigate(`/patients/${activePatientId}`);
                      }}
                      className="px-4 py-2.5 bg-brand-purple hover:bg-brand-deep text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <Edit3 size={13} />
                      <span>პაციენტის ბარათის რედაქტირება</span>
                    </button>
                  </div>

                  {/* Dental Chart Container (Read-Only) */}
                  <div className="bg-surface rounded-2xl border border-border-main p-2 sm:p-4 overflow-x-auto">
                    <DentalChart 
                      data={patientDetails?.teethStatus || {}} 
                      onToothUpdate={null} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ვიზიტების ისტორია */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingPatient ? (
                <div className="flex justify-center py-12 text-brand-purple">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : patientHistory.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                      სულ {patientHistory.length} ვიზიტი
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (activePatientId) navigate(`/patients/${activePatientId}`);
                      }}
                      className="text-[10px] font-black text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      პროფილზე გადასვლა <ChevronRight size={12} />
                    </button>
                  </div>

                  {patientHistory.map((visit) => {
                    const isCompleted = visit.status === "completed_and_billed";
                    const isCancelled = visit.status === "cancelled";
                    const isFuture = new Date(visit.start) > new Date();

                    let statusBadge = {
                      label: "დასრულებული",
                      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    };
                    if (isCancelled) {
                      statusBadge = {
                        label: "გაუქმებული",
                        color: "bg-red-500/10 text-red-600 border-red-500/20"
                      };
                    } else if (isFuture) {
                      statusBadge = {
                        label: "მომავალი",
                        color: "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      };
                    } else if (!isCompleted) {
                      statusBadge = {
                        label: "დაუხურავი",
                        color: "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      };
                    }

                    return (
                      <div 
                        key={visit.id}
                        className="bg-surface-soft/60 hover:bg-surface-soft border border-border-main p-4 rounded-2xl transition-all space-y-2.5"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-sm text-text-main truncate">
                              {visit.service || "კონსულტაცია"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-text-muted flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(visit.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {new Date(visit.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {visit.doctorName && (
                                <>
                                  <span>•</span>
                                  <span className="text-brand-purple font-black">👨‍⚕️ {visit.doctorName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0 ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Billed services list */}
                        {visit.billedServices?.length > 0 && (
                          <div className="pt-2 border-t border-border-main/50 space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-text-muted block">ჩატარებული სერვისები:</span>
                            {visit.billedServices.map((s, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-text-main">
                                <span>{s.name}</span>
                                {!isDoctor && s.price !== undefined && (
                                  <span className="font-black text-brand-purple">{s.price} ₾</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {visit.notes && (
                          <div className="pt-2 border-t border-border-main/50">
                            <p className="text-[11px] font-bold text-text-muted italic bg-surface p-2.5 rounded-xl border border-border-main/40">
                              "{visit.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-text-muted space-y-2">
                  <Activity size={32} className="mx-auto opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wider">ვიზიტების ისტორია ცარიელია</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;
