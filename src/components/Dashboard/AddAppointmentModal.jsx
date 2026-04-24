import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  X,
  Search,
  Clock,
  Loader2,
  Check,
  UserPlus,
  PlusCircle,
  Building2,
  CalendarDays,
  AlertCircle,
  Phone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { transliterateToGeorgian, transliterateToLatin } from "../../utils/transliterateKa";
import FormInput from "../Common/FormInput";

const AddAppointmentModal = ({ isOpen, onClose, selectedDate }) => {
  const { userData, activeStaff, role, clinicData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isExternal, setIsExternal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const canSelectDoctor = role === "admin" || role === "receptionist";
  const isReceptionist = role === "receptionist";

  const [formData, setFormData] = useState({
    date: "",
    startTime: "10:00",
    duration: "60",
    service: "",
    doctorId: "",
    doctorName: "",
    externalClinicName: "",
    externalPatientName: "",
  });
  const [quickAddPhone, setQuickAddPhone] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // ექიმების ჩამოტვირთვა
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!userData?.clinicId) return;
      const q = query(
        collection(db, "users"),
        where("clinicId", "==", userData.clinicId),
        where("role", "==", "doctor")
      );
      const snapshot = await getDocs(q);
      const docsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDoctors(docsList);
      
      // თუ ადმინი/რეგისტრატორია და მხოლოდ ერთი ექიმია, ავტომატურად ავირჩიოთ
      if (docsList.length === 1 && canSelectDoctor) {
        setFormData(prev => ({ ...prev, doctorId: docsList[0].id, doctorName: docsList[0].fullName }));
      }
    };
    if (isOpen) fetchDoctors();
  }, [userData?.clinicId, isReceptionist, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const dateObj = selectedDate ? new Date(selectedDate) : new Date();
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const mins = String(dateObj.getMinutes()).padStart(2, "0");

      setFormData((prev) => ({
        ...prev,
        date: `${year}-${month}-${day}`,
        startTime: `${hours}:${mins}`,
      }));
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.length < 2 || isExternal) {
        setSearchResults([]);
        return;
      }
      const clinicId = userData?.clinicId;
      if (!clinicId) return;

      const q = query(
        collection(db, "patients"),
        where("clinicId", "==", clinicId),
      );
      const snapshot = await getDocs(q);
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) =>
          p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.personalId && p.personalId.includes(searchTerm))
        );
      setSearchResults(filtered);
    };
    searchPatients();
  }, [searchTerm, isExternal, userData?.clinicId]);

  const handleQuickAdd = async () => {
    if (!searchTerm) return;
    
    // ტელეფონის ვალიდაცია
    const cleanPhone = quickAddPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith("5")) {
      setFormErrors({ ...formErrors, quickAddPhone: true });
      setToast({ show: true, message: "ტელეფონის ნომერი უნდა იყოს 9 ნიშნა და იწყებოდეს 5-ით" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
      return;
    }

    setLoading(true);
    try {
      const clinicId = userData?.clinicId;
      const docRef = await addDoc(collection(db, "patients"), {
        fullName: searchTerm,
        phone: cleanPhone,
        clinicId,
        createdAt: serverTimestamp(),
        status: "active",
      });
      setSelectedPatient({ id: docRef.id, fullName: searchTerm, phone: cleanPhone });
      setSearchTerm(searchTerm);
      setSearchResults([]);
      setIsQuickAdding(false);
      setQuickAddPhone("");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const sendAppointmentSms = async (patientPhone, date, time, service, doctorName) => {
    if (!patientPhone || patientPhone === "არ არის მითითებული" || clinicData?.plan !== "pro") return;
    
    // ნომრის ფორმატირება
    let formattedPhone = patientPhone.replace(/\D/g, "");
    if (formattedPhone.length === 9) formattedPhone = "995" + formattedPhone;
    if (formattedPhone.length !== 12) return;

    // ტრანსლიტერაცია და მონაცემების მომზადება
    const clinicLatin = transliterateToLatin(clinicData?.clinicName || "Clinic");
    const serviceLatin = transliterateToLatin(service);
    const doctorLatin = transliterateToLatin(doctorName || "Doctor");
    const clinicPhone = clinicData?.phone || "";

    // თქვენი მოთხოვნილი სტრუქტურა
    const message = `javshani ${clinicLatin}\nProcedura: ${serviceLatin}\nTarigi ${date} - ${time}\n${doctorLatin}\ncvlilebis shemtxvevashi, dagvireket ${clinicPhone}`;

    try {
      const apiKey = import.meta.env.VITE_UBILL_API_KEY;
      await fetch(`/api/ubill/v1/sms/send?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandID: 2, 
          numbers: [formattedPhone],
          text: message
        })
      });
    } catch (err) {
      console.error("SMS Notification Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // შევამოწმოთ თუ ადმინია წარსულში ჯავშნისას
    const now = new Date();
    const [year, month, day] = formData.date.split("-");
    const [hours, minutes] = formData.startTime.split(":");
    const selected = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    selected.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // შეზღუდვა: წარსულში ჯავშნის უფლება მხოლოდ ადმინს/მენეჯერს აქვს და მხოლოდ სხვა კლინიკებისთვის.
    // თუ კლინიკის შიდა ჯავშანია, წარსულში ჩამატება ყველასთვის აკრძალულია.
    if (selected < now && !isExternal) {
        setToast({ show: true, message: "შიდა ჯავშნის გაკეთება წარსულში აკრძალულია" });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
        return;
    }
    
    // ვალიდაცია
    const errors = {};
    if (!isExternal && !selectedPatient) errors.patient = true;
    if (isExternal && !formData.externalPatientName) errors.externalPatientName = true;
    if (isExternal && !formData.externalClinicName) errors.externalClinicName = true;
    if (!formData.date) errors.date = true;
    if (!formData.startTime) errors.startTime = true;
    if (!formData.service) errors.service = true;
    if (canSelectDoctor && !isExternal && !formData.doctorId) errors.doctorId = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setToast({ show: true, message: "გთხოვთ შეავსოთ ყველა აუცილებელი ველი" });
      setTimeout(() => {
        setFormErrors({});
        setToast({ show: false, message: "" });
      }, 3000);
      return;
    }

    setLoading(true);
    try {
      const clinicId = userData?.clinicId;

      const [year, month, day] = formData.date.split("-");
      const [hours, minutes] = formData.startTime.split(":");

      const startDateTime = new Date();
      startDateTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      let displayTitle = isExternal
        ? `${formData.externalPatientName} (${formData.externalClinicName})`
        : selectedPatient?.fullName;

      await addDoc(collection(db, "appointments"), {
        clinicId,
        patientId: isExternal ? "external" : selectedPatient?.id,
        patientName: displayTitle,
        doctorId: canSelectDoctor ? formData.doctorId : (activeStaff?.id || userData?.uid),
        doctorName: canSelectDoctor ? formData.doctorName : (activeStaff?.fullName || userData?.fullName),
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        service: formData.service,
        isExternal,
        externalClinic: isExternal ? formData.externalClinicName : null,
        status: "scheduled",
        color: isExternal ? "#94A3B8" : "#7C3AED",
        createdAt: serverTimestamp(),
      });

      // SMS გაგზავნა მხოლოდ Pro პაკეტისთვის
      if (!isExternal && selectedPatient?.phone && clinicData?.plan === "pro") {
        const docName = canSelectDoctor ? formData.doctorName : (activeStaff?.fullName || userData?.fullName);
        sendAppointmentSms(selectedPatient.phone, formData.date, formData.startTime, formData.service, docName);
      }

      onClose();
      setSearchTerm("");
      setSelectedPatient(null);
      setFormData({
        date: "",
        startTime: "10:00",
        duration: "60",
        service: "",
        doctorId: "",
        doctorName: "",
        externalClinicName: "",
        externalPatientName: "",
      });
    } catch (error) {
      console.error("Error adding appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "w-full px-5 py-4 bg-surface-soft rounded-2xl outline-none font-bold text-sm text-text-main focus:bg-surface border-2 border-transparent focus:border-brand-purple transition-all autofill-fix";

  const showDropdown = searchTerm.length >= 2 && searchTerm !== selectedPatient?.fullName;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4">

      <div className="app-overlay fixed inset-0 bg-brand-deep/50 backdrop-blur-sm" onClick={onClose} />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="app-sheet bg-surface rounded-t-[28px] md:rounded-[40px] w-full max-w-lg shadow-2xl relative z-10 overflow-visible font-nino animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="p-5 md:p-8 border-b border-border-main flex justify-between items-center bg-surface-soft/50 rounded-t-[28px] md:rounded-t-[40px]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isExternal ? "bg-slate-500 text-white shadow-slate-500/20" : "bg-brand-purple text-white shadow-brand-purple/20"}`}>
              {isExternal ? <Building2 size={24} /> : <CalendarDays size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main italic tracking-tight">ვიზიტის ჩანიშვნა</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                {isExternal ? "პირადი განრიგი" : "კლინიკის ბაზა"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-text-muted hover:text-sale-red hover:bg-red-500/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 overflow-y-auto max-h-[80vh] md:max-h-[70vh] custom-scrollbar">
          {/* მხოლოდ ექიმებს შეუძლიათ სხვა კლინიკის ჯავშნები */}
          {!isReceptionist && (
            <div className="flex p-1 bg-surface-soft rounded-2xl">
                <button type="button" onClick={() => { setIsExternal(false); setSelectedPatient(null); setSearchTerm(""); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isExternal ? "bg-surface text-brand-purple shadow-sm" : "text-text-muted hover:text-gray-600"}`}>ჩემი კლინიკა</button>
                <button type="button" onClick={() => setIsExternal(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isExternal ? "bg-slate-500 text-white shadow-sm" : "text-text-muted hover:text-gray-600"}`}>სხვა კლინიკა</button>
            </div>
          )}

          {!isExternal ? (
            <div className="space-y-3 relative z-50">
              <FormInput 
                label="პაციენტის ძებნა" 
                icon={Search} 
                placeholder="ჩაწერეთ სახელი (გიორგი)..." 
                value={searchTerm} 
                error={formErrors.patient}
                onChange={(val) => { 
                  setSearchTerm(transliterateToGeorgian(val)); 
                  if (selectedPatient) setSelectedPatient(null); 
                }} 
              />

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-main rounded-2xl max-h-48 overflow-y-auto shadow-2xl p-2 space-y-1 z-50">
                  {searchResults.map((p) => (
                    <div key={p.id} onClick={() => { setSelectedPatient(p); setSearchTerm(p.fullName); }} className="p-3 hover:bg-brand-purple/5 rounded-xl cursor-pointer flex items-center justify-between group transition-all">
                      <div>
                        <span className="font-bold text-sm text-text-main block">{p.fullName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted bg-surface-soft px-2 py-0.5 rounded-md">ID: {p.personalId || "არ აქვს"}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">ტელ: {p.phone || "-"}</span>
                        </div>
                      </div>
                      <PlusCircle size={16} className="opacity-0 group-hover:opacity-100 text-brand-purple" />
                    </div>
                  ))}
                  {searchResults.length === 0 && !isQuickAdding && (
                    <button type="button" onClick={() => setIsQuickAdding(true)} className="w-full p-4 flex items-center gap-3 text-brand-purple bg-brand-purple/5 rounded-xl hover:bg-brand-purple/10 transition-all group">
                      <PlusCircle size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">დაამატე: "{searchTerm}"</span>
                    </button>
                  )}
                  {isQuickAdding && (
                    <div className="p-4 space-y-3 bg-surface-soft/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                       <p className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-2">შეიყვანეთ ტელეფონი</p>
                       <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input 
                              type="tel" 
                              maxLength={9}
                              placeholder="5XXXXXXXX"
                              value={quickAddPhone}
                              onChange={(e) => setQuickAddPhone(e.target.value.replace(/\D/g, ""))}
                              className={`w-full pl-10 pr-4 py-3 bg-surface border-2 rounded-xl outline-none font-bold text-sm transition-all ${formErrors.quickAddPhone ? "border-red-500" : "border-transparent focus:border-brand-purple"}`}
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleQuickAdd}
                            disabled={loading}
                            className="px-6 bg-brand-purple text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-purple/20"
                          >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "შენახვა"}
                          </button>
                          <button type="button" onClick={() => setIsQuickAdding(false)} className="p-3 text-text-muted hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
                             <X size={16} />
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="პაციენტი" 
                required 
                placeholder="პაციენტის სახელი" 
                value={formData.externalPatientName} 
                error={formErrors.externalPatientName}
                onChange={val => setFormData({ ...formData, externalPatientName: transliterateToGeorgian(val) })} 
              />
              <FormInput 
                label="კლინიკა" 
                required 
                placeholder="კლინიკის სახელი" 
                value={formData.externalClinicName} 
                error={formErrors.externalClinicName}
                onChange={val => setFormData({ ...formData, externalClinicName: transliterateToGeorgian(val) })} 
              />
            </div>
          )}

          {/* ექიმის არჩევა (ადმინისთვის და რეგისტრატორისთვის) */}
          {canSelectDoctor && !isExternal && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                აირჩიეთ ექიმი <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={(e) => {
                  const doc = doctors.find(d => d.id === e.target.value);
                  setFormData({ ...formData, doctorId: e.target.value, doctorName: doc?.fullName || "" });
                  if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: false });
                }}
                className={`${inputClasses} appearance-none cursor-pointer ${formErrors.doctorId ? "border-red-500 bg-red-50" : ""}`}
              >
                <option value="">აირჩიეთ ექიმი</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.fullName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              type="date" 
              label="თარიღი" 
              required 
              value={formData.date} 
              error={formErrors.date}
              onChange={val => setFormData({ ...formData, date: val })} 
            />
            <FormInput 
              type="time" 
              label="დრო" 
              required 
              value={formData.startTime} 
              error={formErrors.startTime}
              onChange={val => setFormData({ ...formData, startTime: val })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">ხანგრძლივობა</label>
              <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className={`${inputClasses} appearance-none cursor-pointer`}>
                <option value="30">30 წუთი</option>
                <option value="60">1 საათი</option>
                <option value="90">1.5 საათი</option>
                <option value="120">2 საათი</option>
                <option value="180">3 საათი</option>
                <option value="240">4 საათი</option>
                <option value="300">5 საათი</option>
                <option value="360">6 საათი</option>
                <option value="480">სრული დღე</option>
              </select>
            </div>
            <FormInput 
              label="მომსახურება" 
              required 
              placeholder={isExternal ? "მაგ: კონსულტაცია" : "მაგ: იმპლანტაცია"} 
              value={formData.service} 
              error={formErrors.service}
              onChange={val => setFormData({ ...formData, service: transliterateToGeorgian(val) })} 
            />
          </div>

          <button type="submit" disabled={loading} className={`w-full py-5 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex justify-center items-center gap-3 active:scale-[0.98] ${isExternal ? "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20" : "bg-brand-purple hover:brightness-110 shadow-brand-purple/20"}`}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "ჯავშნის დადასტურება"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
