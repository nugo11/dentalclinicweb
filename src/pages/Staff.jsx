import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db } from "../firebase";
import { 
  collection, query, where, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { PLANS } from "../config/plans";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { 
  Users, UserPlus, Mail, ShieldCheck, Trash2, 
  Loader2, Crown, Zap, X, Shield, UserCircle,
  Eye, EyeOff, Wallet, CheckCircle2, AlertTriangle, Lock
} from "lucide-react";
import { logActivity } from "../utils/activityLogger";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import PhoneInput from "../components/Common/PhoneInput";
import { formatPhone, validatePhone } from "../utils/phoneFormatter";
import { getRoleLabel } from "../utils/roleUtils";
import { scrollToFirstError } from "../utils/scrollHelper";

const Staff = () => {
  const { userData, clinicData, activeStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [visiblePins, setVisiblePins] = useState({});
  const [staffErrors, setStaffErrors] = useState({});
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, member: null, amount: "" });
  
  const [newDoctor, setNewDoctor] = useState({
    fullName: "",
    email: "",
    phone: "",
    pin: "",
    role: "doctor",
    salaryAmount: "",
    salaryPayDay: "1",
    salaryType: "fixed",
    commissionRate: "",
    personalId: "",
    birthDate: ""
  });

  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    pin: "",
    role: "",
    salaryAmount: "",
    salaryPayDay: "1",
    salaryType: "fixed",
    commissionRate: "",
    personalId: "",
    birthDate: ""
  });

  useLockBodyScroll(Boolean(showAddModal || editTarget || deleteTargetId || paymentModal.isOpen));

  const currentPlanIdRaw = (clinicData?.plan || "free").toLowerCase();
  const planId = (currentPlanIdRaw === "solo" || currentPlanIdRaw === "basic") ? "business" : 
                 (currentPlanIdRaw === "pro" ? "custom" : currentPlanIdRaw);
  const currentPlan = PLANS[planId] || PLANS.free;
  
  let maxDocs = currentPlan.maxDoctors;
  if (currentPlan.id === 'custom' && clinicData?.customMaxDoctors) {
    maxDocs = clinicData.customMaxDoctors;
  }
  const doctorLimitReached = staff.filter(s => s.role === 'doctor').length >= maxDocs;

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "users"),
      where("clinicId", "==", userData.clinicId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const hashPin = async (pin) => {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (newDoctor.role === 'doctor' && doctorLimitReached) {
      alert(`თქვენი პაკეტი გათვლილია მაქსიმუმ ${maxDocs} ექიმზე. გთხოვთ აირჩიოთ სხვა როლი (რეგისტრატორი, მენეჯერი, ბუღალტერი) ან გაზარდოთ ტარიფი.`);
      return;
    }

    const errors = {};
    if (!newDoctor.fullName || !newDoctor.fullName.trim()) {
      errors.addFullName = "მიუთითეთ სრული სახელი";
    }
    if (!newDoctor.pin || newDoctor.pin.length !== 4) {
      errors.addPin = "PIN უნდა შედგებოდეს 4 ციფრისგან";
    }
    if (newDoctor.phone) {
      const phoneErr = validatePhone(newDoctor.phone, false);
      if (phoneErr) {
        errors.addPhone = phoneErr;
      }
    }
    if (newDoctor.personalId && newDoctor.personalId.replace(/\D/g, '').length !== 11) {
      errors.addPersonalId = "პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან";
    }

    if (Object.keys(errors).length > 0) {
      setStaffErrors(errors);
      scrollToFirstError('.app-sheet');
      return;
    }
    setIsProcessing(true);

    try {
      const pinHash = await hashPin(newDoctor.pin);

      await addDoc(collection(db, "users"), {
        fullName: newDoctor.fullName,
        email: newDoctor.email,
        phone: newDoctor.phone ? formatPhone(newDoctor.phone) : "",
        pinHash: pinHash,
        role: newDoctor.role,
        salaryAmount: newDoctor.salaryType === 'fixed' ? (Number(newDoctor.salaryAmount) || 0) : 0,
        commissionRate: newDoctor.salaryType === 'commission' ? (Number(newDoctor.commissionRate) || 0) : null,
        salaryPayDay: Number(newDoctor.salaryPayDay) || 1,
        salaryType: newDoctor.salaryType || "fixed",
        personalId: newDoctor.personalId ? newDoctor.personalId.replace(/\D/g, '') : "",
        birthDate: newDoctor.birthDate || "",
        clinicId: userData.clinicId,
        status: "active",
        failedPinAttempts: 0,
        pinLockedUntil: null,
        createdAt: new Date().toISOString(),
      });
      
      // LOG ACTIVITY
      await logActivity(userData.clinicId, activeStaff || userData || { uid: userData.uid, fullName: 'Unknown', role: 'unknown' }, 'staff_create', `დაემატა ახალი თანამშრომელი: ${newDoctor.fullName} (${newDoctor.role})`, { name: newDoctor.fullName, role: newDoctor.role });

      setShowAddModal(false);
      setStaffErrors({});
      setNewDoctor({ fullName: "", email: "", phone: "", pin: "", role: "doctor", salaryAmount: "", salaryPayDay: "1", salaryType: "fixed", commissionRate: "", personalId: "", birthDate: "" });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditStaff = (member) => {
    setEditTarget(member.id);
    setStaffErrors({});
    setEditFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      pin: "",
      role: member.role || "doctor",
      salaryAmount: member.salaryAmount !== undefined ? member.salaryAmount : "",
      commissionRate: member.commissionRate !== undefined ? member.commissionRate : "",
      salaryPayDay: member.salaryPayDay !== undefined ? member.salaryPayDay : "1",
      salaryType: member.salaryType || "fixed",
      personalId: member.personalId || "",
      birthDate: member.birthDate || ""
    });
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.fullName || !editFormData.fullName.trim()) {
      errors.editFullName = "მიუთითეთ სრული სახელი";
    }
    if (editFormData.pin && editFormData.pin.length !== 4) {
      errors.editPin = "ახალი PIN უნდა იყოს 4 ციფრიანი";
    }
    if (editFormData.phone) {
      const phoneErr = validatePhone(editFormData.phone, false);
      if (phoneErr) {
        errors.editPhone = phoneErr;
      }
    }
    if (editFormData.personalId && editFormData.personalId.replace(/\D/g, '').length !== 11) {
      errors.editPersonalId = "პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან";
    }

    if (Object.keys(errors).length > 0) {
      setStaffErrors(errors);
      scrollToFirstError('.app-sheet');
      return;
    }

    setIsProcessing(true);
    try {
      const updates = {
        fullName: editFormData.fullName,
        email: editFormData.email,
        phone: editFormData.phone ? formatPhone(editFormData.phone) : "",
        role: editFormData.role,
        salaryAmount: editFormData.salaryType === 'fixed' ? (Number(editFormData.salaryAmount) || 0) : 0,
        commissionRate: editFormData.salaryType === 'commission' ? (Number(editFormData.commissionRate) || 0) : null,
        salaryPayDay: Number(editFormData.salaryPayDay) || 1,
        salaryType: editFormData.salaryType || "fixed",
        personalId: editFormData.personalId ? editFormData.personalId.replace(/\D/g, '') : "",
        birthDate: editFormData.birthDate || ""
      };

      if (editFormData.pin && editFormData.pin.length === 4) {
        updates.pinHash = await hashPin(editFormData.pin);
        updates.failedPinAttempts = 0;
        updates.pinLockedUntil = null;
      }

      await updateDoc(doc(db, "users", editTarget), updates);

      // LOG ACTIVITY
      await logActivity(userData.clinicId, activeStaff || userData || { uid: userData.uid, fullName: 'Unknown', role: 'unknown' }, 'staff_update', `განახლდა თანამშრომლის მონაცემები: ${updates.fullName}`, { staffId: editTarget, name: updates.fullName });

      setEditTarget(null);
    } catch (error) {
      console.error("Error updating staff:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockStaff = async (staffId, staffName) => {
    if (!window.confirm(`ნამდვილად გსურთ ${staffName}-ის ანგარიშის განბლოკვა?`)) return;
    try {
      await updateDoc(doc(db, "users", staffId), {
        failedPinAttempts: 0,
        pinLockedUntil: null
      });
      localStorage.removeItem(`pin_lock_${staffId}`);
      localStorage.removeItem(`pin_attempts_${staffId}`);
      await logActivity(userData.clinicId, activeStaff || userData || { uid: userData?.uid, fullName: 'Unknown', role: 'admin' }, 'staff_unlock', `თანამშრომელი ${staffName} განბლოკილია ადმინის მიერ`, { staffId, name: staffName });
    } catch (err) {
      console.error("Unlock error:", err);
      alert("განბლოკვისას დაფიქსირდა შეცდომა");
    }
  };

  const handleConfirmPayment = async () => {
    const { member, amount } = paymentModal;
    if (!member) return;
    
    const amountToPay = Number(amount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("გთხოვთ შეიყვანოთ ვალიდური თანხა");
      return;
    }

    setIsProcessing(true);
    try {
      const newFinanceDoc = await addDoc(collection(db, "finance"), {
        clinicId: userData.clinicId,
        type: 'expense',
        category: 'ხელფასი',
        amount: amountToPay,
        description: `ხელფასი: ${member.fullName} (${member.salaryType === 'commission' ? 'გამომუშავება' : 'ფიქსირებული'})`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        staffId: member.id,
        paidMonth: new Date().toISOString().slice(0, 7)
      });

      // LOG ACTIVITY
      await logActivity(userData.clinicId, activeStaff || userData, 'salary_payment', `გაიცა ხელფასი: ${member.fullName} (თანხა: ${amountToPay}₾)`, { financeId: newFinanceDoc.id, staffId: member.id, amount: amountToPay });

      setPaymentModal({ isOpen: false, member: null, amount: "" });
    } catch (error) {
      console.error("Error paying salary:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async (id, newRole) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
  };

  const handleDeleteStaff = (id, role) => {
    if (role === 'admin') return;
    setDeleteTargetId(id);
  };

  const confirmDeleteStaff = async () => {
    if (deleteTargetId) {
      const staffMember = staff.find(s => s.id === deleteTargetId);
      await deleteDoc(doc(db, "users", deleteTargetId));
      
      // LOG ACTIVITY
      if (staffMember) {
        await logActivity(userData.clinicId, activeStaff || userData || { uid: userData.uid, fullName: 'Unknown', role: 'unknown' }, 'staff_delete', `წაიშალა თანამშრომელი: ${staffMember.fullName}`, { staffId: deleteTargetId, name: staffMember.fullName });
      }

      setDeleteTargetId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen w-full bg-surface-soft flex items-center justify-center font-nino text-text-main p-4">
        <div className="bg-surface p-8 rounded-3xl border border-border-main text-center max-w-md shadow-lg">
          <Shield className="mx-auto text-amber-500 mb-4" size={40} />
          <h2 className="text-xl font-black mb-2">წვდომა შეზღუდულია</h2>
          <p className="text-xs text-text-muted mb-6">პერსონალის მართვის გვერდი ხელმისაწვდომია მხოლოდ კლინიკის მთავარი ადმინისტრატორისთვის.</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-brand-purple text-white rounded-xl text-xs font-black uppercase cursor-pointer">
            მთავარზე დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>თანამშრომლები — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">პერსონალის მართვა</h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-2 italic">
                   წვდომის კონტროლი და როლები
                </p>
              </div>
              
              <button 
                onClick={() => {
                  setNewDoctor({ 
                    fullName: "", email: "", phone: "", pin: "", 
                    role: doctorLimitReached ? "receptionist" : "doctor", 
                    salaryAmount: "", salaryPayDay: "1", salaryType: "fixed", 
                    commissionRate: "", personalId: "", birthDate: "" 
                  });
                  setStaffErrors({});
                  setShowAddModal(true);
                }}
                className="flex items-center gap-3 px-6 py-4 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all cursor-pointer active:scale-95"
              >
                <UserPlus size={18} /> თანამშრომლის დამატება
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center py-20 opacity-20"><Loader2 className="animate-spin" size={40} /></div>
              ) : (
                staff.map((member) => (
                  <div key={member.id} className="bg-surface p-8 rounded-[40px] border border-border-main shadow-sm hover:shadow-xl transition-all group relative">
                    
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button 
                          onClick={() => handleEditStaff(member)}
                          className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all cursor-pointer"
                          title="რედაქტირება"
                        >
                          <UserCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(member.id, member.role)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${member.role === 'admin' ? 'hidden' : 'text-text-muted hover:text-red-500 hover:bg-red-500/10'}`}
                          title="წაშლა"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 border ${member.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-surface-soft text-brand-purple border-border-main'}`}>
                      {member.role === 'admin' ? <Crown size={28} /> : member.fullName ? member.fullName[0] : "?"}
                    </div>

                    <h3 className="text-lg font-black text-text-main italic leading-tight mb-1">{member.fullName}</h3>
                    <div className="flex flex-col gap-1 mb-6">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Mail size={12} />
                        <span className="text-[10px] font-bold truncate">{member.email || "ფოსტა არ არის"}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-text-muted">
                          <Users size={12} className="rotate-90" />
                          <span className="text-[10px] font-bold">{member.phone}</span>
                        </div>
                      )}
                    </div>

                      {member.pinLockedUntil && new Date(member.pinLockedUntil).getTime() > Date.now() && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-wider">
                            <Lock size={12} /> 30 წთ დაბლოკილია
                          </div>
                          <button
                            onClick={() => handleUnlockStaff(member.id, member.fullName)}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            განბლოკვა
                          </button>
                        </div>
                      )}

                      <div className="mb-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            {member.salaryType === 'commission' ? 'გამომუშავება' : 'ხელფასი'}
                          </span>
                          <span className="text-[11px] font-black text-emerald-700">
                            {member.salaryType === 'commission' ? `${member.commissionRate || 0}%` : `₾${member.salaryAmount ?? 0}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-bold text-emerald-500/70 uppercase">რიცხვი</span>
                          <span className="text-[9px] font-black text-emerald-600">{member.salaryPayDay ?? 1}</span>
                        </div>
                      </div>

                      {member.role !== 'admin' && (
                        <button
                          onClick={() => setPaymentModal({
                            isOpen: true,
                            member,
                            amount: member.salaryType === 'fixed' ? (member.salaryAmount || "").toString() : ""
                          })}
                          className="w-full mb-6 py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Wallet size={12} /> ხელფასის გაცემა
                        </button>
                      )}
                    <div className="pt-6 border-t border-border-main flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-text-main uppercase tracking-widest">{getRoleLabel(member.role)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface-soft px-2.5 py-1.5 rounded-xl border border-border-main">
                        <Shield size={10} className="text-brand-purple" />
                        <span className="text-[9px] font-black text-text-main tracking-widest uppercase">SECURED</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="app-overlay fixed inset-0 touch-none" onClick={() => setDeleteTargetId(null)} onTouchMove={(e) => e.preventDefault()} />
          <div className="app-sheet bg-surface rounded-[40px] w-full max-w-sm p-10 relative z-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-text-main italic mb-2">თანამშრომლის წაშლა</h3>
            <p className="text-xs text-text-muted font-bold leading-relaxed mb-8 uppercase tracking-widest">ეს ოპერაცია შეუქცევადია.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteTargetId(null)} className="py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer">გაუქმება</button>
              <button onClick={confirmDeleteStaff} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg cursor-pointer">წაშლა</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="app-overlay fixed inset-0 touch-none" onClick={() => setShowAddModal(false)} onTouchMove={(e) => e.preventDefault()} />
          <div className="app-sheet bg-surface rounded-t-[32px] md:rounded-[40px] w-full max-w-md p-6 md:p-10 relative z-10 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] overscroll-contain custom-scrollbar">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black text-text-main italic">ახალი თანამშრომელი</h3>
                 <button type="button" onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-main"><X /></button>
              </div>

              {doctorLimitReached && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 text-xs">
                  <div>
                    <span className="font-black block">ექიმების ლიმიტი ({maxDocs}) შევსებულია</span>
                    <span className="text-[10px] opacity-80">შეგიძლიათ დაამატოთ რეგისტრატორი, ბუღალტერი ან მენეჯერი.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate('/settings/billing')}
                    className="px-3 py-1.5 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-amber-600 transition-colors whitespace-nowrap"
                  >
                    პაკეტის შეცვლა
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-4">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">სრული სახელი <span className="text-red-500">*</span></label>
                  {staffErrors.addFullName && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.addFullName}</span>}
                </div>
                <input 
                  required 
                  data-error={Boolean(staffErrors.addFullName)}
                  aria-invalid={Boolean(staffErrors.addFullName)}
                  className={`w-full bg-surface-soft border-2 rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all ${staffErrors.addFullName ? 'border-red-500 bg-red-500/10 animate-shake' : 'border-transparent focus:border-brand-purple'}`} 
                  value={newDoctor.fullName} 
                  onChange={e => {
                    setNewDoctor({...newDoctor, fullName: e.target.value});
                    if (staffErrors.addFullName) setStaffErrors(prev => ({ ...prev, addFullName: undefined }));
                  }} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex justify-between items-center ml-4">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">პირადი ნომერი</label>
                      {staffErrors.addPersonalId && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.addPersonalId}</span>}
                    </div>
                    <input 
                      className={`w-full bg-surface-soft border-2 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 outline-none font-bold text-sm transition-all min-w-0 ${staffErrors.addPersonalId ? 'border-red-500 bg-red-500/10' : 'border-transparent focus:border-brand-purple'}`} 
                      maxLength={11} 
                      value={newDoctor.personalId} 
                      onChange={e => {
                        setNewDoctor({...newDoctor, personalId: e.target.value.replace(/\D/g, '')});
                        if (staffErrors.addPersonalId) setStaffErrors(prev => ({ ...prev, addPersonalId: undefined }));
                      }} 
                      placeholder="010XXXXXXXX" 
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">დაბადების თარიღი</label>
                    <div className="relative min-w-0">
                      <input 
                        type="date" 
                        className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 outline-none font-bold text-sm transition-all min-w-0 box-border" 
                        value={newDoctor.birthDate} 
                        onClick={(e) => {
                          try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                        }}
                        onChange={e => setNewDoctor({...newDoctor, birthDate: e.target.value})} 
                      />
                      {typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !newDoctor.birthDate && (
                        <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold pointer-events-none opacity-60 select-none truncate pr-6">
                          mm/dd/yyyy
                        </span>
                      )}
                    </div>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-4">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">PIN (4 ციფრი) <span className="text-red-500">*</span></label>
                      {staffErrors.addPin && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.addPin}</span>}
                    </div>
                    <input 
                      required 
                      maxLength={4} 
                      data-error={Boolean(staffErrors.addPin)}
                      aria-invalid={Boolean(staffErrors.addPin)}
                      className={`w-full bg-surface-soft border-2 rounded-2xl px-6 py-4 outline-none font-bold text-sm text-center tracking-[0.5em] transition-all ${staffErrors.addPin ? 'border-red-500 bg-red-500/10 animate-shake' : 'border-transparent focus:border-brand-purple'}`} 
                      value={newDoctor.pin} 
                      onChange={e => {
                        setNewDoctor({...newDoctor, pin: e.target.value.replace(/\D/g, '')});
                        if (staffErrors.addPin) setStaffErrors(prev => ({ ...prev, addPin: undefined }));
                      }} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">როლი <span className="text-red-500">*</span></label>
                    <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer" value={newDoctor.role} onChange={e => setNewDoctor({...newDoctor, role: e.target.value})}>
                      <option value="doctor" disabled={doctorLimitReached}>ექიმი {doctorLimitReached ? `(ლიმიტი ${maxDocs} ამოწურულია)` : ''}</option>
                      <option value="receptionist">რეგისტრატორი</option>
                      <option value="accountant">ბუღალტერი</option>
                      <option value="manager">მენეჯერი</option>
                    </select>
                  </div>
              </div>
              <div>
                <PhoneInput 
                  label="ტელეფონი" 
                  value={newDoctor.phone} 
                  error={staffErrors.addPhone}
                  onChange={(formatted) => {
                    setNewDoctor({...newDoctor, phone: formatted});
                    if (staffErrors.addPhone) setStaffErrors(prev => ({ ...prev, addPhone: undefined }));
                  }} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ელ-ფოსტა</label>
                <input type="email" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასის ტიპი</label>
                    <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer" value={newDoctor.salaryType} onChange={e => setNewDoctor({...newDoctor, salaryType: e.target.value})}>
                      <option value="fixed">ფიქსირებული</option>
                      <option value="commission">გამომუშავება</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გადახდის რიცხვი</label>
                    <input type="number" min="1" max="31" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.salaryPayDay} onChange={e => setNewDoctor({...newDoctor, salaryPayDay: e.target.value})} placeholder="1-31" />
                  </div>
              </div>
              {newDoctor.salaryType === 'fixed' ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასი (₾)</label>
                  <input type="number" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.salaryAmount} onChange={e => setNewDoctor({...newDoctor, salaryAmount: e.target.value})} placeholder="0" />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გამომუშავების პროცენტი (%)</label>
                  <input type="number" min="0" max="100" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.commissionRate} onChange={e => setNewDoctor({...newDoctor, commissionRate: e.target.value})} placeholder="მაგ: 30" />
                </div>
              )}
              <button disabled={isProcessing} className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all mt-6">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "შენახვა"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="app-overlay fixed inset-0 touch-none" onClick={() => setEditTarget(null)} onTouchMove={(e) => e.preventDefault()} />
          <div className="app-sheet bg-surface rounded-t-[32px] md:rounded-[40px] w-full max-w-md p-6 md:p-10 relative z-10 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] overscroll-contain custom-scrollbar">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-text-main italic">მონაცემების შეცვლა</h3>
                  <button type="button" onClick={() => setEditTarget(null)} className="text-text-muted hover:text-text-main cursor-pointer"><X /></button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-4">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">სრული სახელი <span className="text-red-500">*</span></label>
                  {staffErrors.editFullName && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.editFullName}</span>}
                </div>
                <input 
                  required 
                  data-error={Boolean(staffErrors.editFullName)}
                  aria-invalid={Boolean(staffErrors.editFullName)}
                  className={`w-full bg-surface-soft border-2 rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all ${staffErrors.editFullName ? 'border-red-500 bg-red-500/10 animate-shake' : 'border-transparent focus:border-brand-purple'}`} 
                  value={editFormData.fullName} 
                  onChange={e => {
                    setEditFormData({...editFormData, fullName: e.target.value});
                    if (staffErrors.editFullName) setStaffErrors(prev => ({ ...prev, editFullName: undefined }));
                  }} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex justify-between items-center ml-4">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">პირადი ნომერი</label>
                      {staffErrors.editPersonalId && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.editPersonalId}</span>}
                    </div>
                    <input 
                      className={`w-full bg-surface-soft border-2 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 outline-none font-bold text-sm transition-all min-w-0 ${staffErrors.editPersonalId ? 'border-red-500 bg-red-500/10' : 'border-transparent focus:border-brand-purple'}`} 
                      maxLength={11} 
                      value={editFormData.personalId} 
                      onChange={e => {
                        setEditFormData({...editFormData, personalId: e.target.value.replace(/\D/g, '')});
                        if (staffErrors.editPersonalId) setStaffErrors(prev => ({ ...prev, editPersonalId: undefined }));
                      }} 
                      placeholder="010XXXXXXXX" 
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">დაბადების თარიღი</label>
                    <div className="relative min-w-0">
                      <input 
                        type="date" 
                        className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 outline-none font-bold text-sm transition-all min-w-0 box-border" 
                        value={editFormData.birthDate} 
                        onClick={(e) => {
                          try { if (e.target && typeof e.target.showPicker === 'function') e.target.showPicker(); } catch (err) {}
                        }}
                        onChange={e => setEditFormData({...editFormData, birthDate: e.target.value})} 
                      />
                      {typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !editFormData.birthDate && (
                        <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold pointer-events-none opacity-60 select-none truncate pr-6">
                          mm/dd/yyyy
                        </span>
                      )}
                    </div>
                  </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">როლი <span className="text-red-500">*</span></label>
                <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer" value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                  <option value="admin">ადმინისტრატორი</option>
                  <option value="manager">მენეჯერი</option>
                  <option value="doctor">ექიმი</option>
                  <option value="receptionist">რეგისტრატორი</option>
                  <option value="accountant">ბუღალტერი</option>
                </select>
              </div>
              <div>
                <PhoneInput 
                  label="ტელეფონი" 
                  value={editFormData.phone} 
                  error={staffErrors.editPhone}
                  onChange={(formatted) => {
                    setEditFormData({...editFormData, phone: formatted});
                    if (staffErrors.editPhone) setStaffErrors(prev => ({ ...prev, editPhone: undefined }));
                  }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-4">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">ახალი PIN (4 ციფრი)</label>
                      {staffErrors.editPin && <span className="text-[9px] font-black text-red-500 animate-in fade-in">{staffErrors.editPin}</span>}
                    </div>
                    <input 
                      maxLength={4} 
                      data-error={Boolean(staffErrors.editPin)}
                      aria-invalid={Boolean(staffErrors.editPin)}
                      className={`w-full bg-surface-soft border-2 rounded-2xl px-6 py-4 outline-none font-bold text-sm text-center tracking-[0.5em] transition-all ${staffErrors.editPin ? 'border-red-500 bg-red-500/10 animate-shake' : 'border-transparent focus:border-brand-purple'}`} 
                      value={editFormData.pin} 
                      onChange={e => {
                        setEditFormData({...editFormData, pin: e.target.value.replace(/\D/g, '')});
                        if (staffErrors.editPin) setStaffErrors(prev => ({ ...prev, editPin: undefined }));
                      }} 
                      placeholder="****" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ელ-ფოსტა</label>
                    <input type="email" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასის ტიპი</label>
                    <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer" value={editFormData.salaryType} onChange={e => setEditFormData({...editFormData, salaryType: e.target.value})}>
                      <option value="fixed">ფიქსირებული</option>
                      <option value="commission">გამომუშავება</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გადახდის რიცხვი</label>
                    <input type="number" min="1" max="31" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.salaryPayDay} onChange={e => setEditFormData({...editFormData, salaryPayDay: e.target.value})} />
                  </div>
              </div>
              {editFormData.salaryType === 'fixed' ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასი (₾)</label>
                  <input type="number" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.salaryAmount} onChange={e => setEditFormData({...editFormData, salaryAmount: e.target.value})} />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გამომუშავების პროცენტი (%)</label>
                  <input type="number" min="0" max="100" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.commissionRate} onChange={e => setEditFormData({...editFormData, commissionRate: e.target.value})} placeholder="მაგ: 30" />
                </div>
              )}
              <button disabled={isProcessing} className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all mt-6 cursor-pointer">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ცვლილებების შენახვა"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Salary Payment Modal */}
      {paymentModal.isOpen && paymentModal.member && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="app-overlay fixed inset-0 touch-none" onClick={() => setPaymentModal({ isOpen: false, member: null, amount: "" })} onTouchMove={(e) => e.preventDefault()} />
          <div className="app-sheet bg-surface rounded-[32px] w-full max-w-sm p-8 relative z-10 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Wallet size={24} />
            </div>
            <h3 className="text-xl font-black text-text-main italic mb-1">ხელფასის გაცემა</h3>
            <p className="text-xs text-text-muted font-bold mb-6">
              თანამშრომელი: <span className="text-text-main font-black">{paymentModal.member.fullName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 ml-1">
                  გასაცემი თანხა (₾)
                </label>
                <input 
                  type="number"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-5 py-3.5 outline-none font-black text-lg transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ isOpen: false, member: null, amount: "" })}
                  className="py-3.5 bg-surface-soft text-text-muted rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  disabled={isProcessing || !paymentModal.amount}
                  onClick={handleConfirmPayment}
                  className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" size={16} /> : "დადასტურება"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Staff;