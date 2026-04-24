import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db } from "../firebase";
import { 
  collection, query, where, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { PLANS } from "../config/plans";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { 
  Users, UserPlus, Mail, ShieldCheck, Trash2, 
  Loader2, Crown, Zap, X, Shield, UserCircle,
  Eye, EyeOff
} from "lucide-react";
import { logActivity } from "../utils/activityLogger";

const Staff = () => {
  const { userData, clinicData, activeStaff } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [visiblePins, setVisiblePins] = useState({});
  
  const [newDoctor, setNewDoctor] = useState({
    fullName: "",
    email: "",
    phone: "",
    pin: "",
    role: "doctor",
    salaryAmount: "",
    salaryPayDay: "",
    salaryType: "fixed"
  });

  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    pin: "",
    role: "",
    salaryAmount: "",
    salaryPayDay: "",
    salaryType: "fixed"
  });

  const currentPlan = PLANS[(clinicData?.plan || "free").toLowerCase()] || PLANS.free;
  const doctorLimitReached = staff.filter(s => s.role !== 'admin').length >= currentPlan.maxDoctors;

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
    if (doctorLimitReached) return;
    if (newDoctor.pin.length !== 4) {
        alert("PIN უნდა შედგებოდეს 4 ციფრისგან");
        return;
    }
    setIsProcessing(true);

    try {
      const pinHash = await hashPin(newDoctor.pin);

      await addDoc(collection(db, "users"), {
        fullName: newDoctor.fullName,
        email: newDoctor.email,
        phone: newDoctor.phone,
        pinHash: pinHash,
        role: newDoctor.role,
        salaryAmount: newDoctor.salaryType === 'fixed' ? (Number(newDoctor.salaryAmount) || 0) : 0,
        salaryPayDay: Number(newDoctor.salaryPayDay) || 1,
        salaryType: newDoctor.salaryType || "fixed",
        clinicId: userData.clinicId,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      
      // LOG ACTIVITY
      await logActivity(userData.clinicId, activeStaff || userData || { uid: userData.uid, fullName: 'Unknown', role: 'unknown' }, 'staff_create', `დაემატა ახალი თანამშრომელი: ${newDoctor.fullName} (${newDoctor.role})`, { name: newDoctor.fullName, role: newDoctor.role });

      setShowAddModal(false);
      setNewDoctor({ fullName: "", email: "", phone: "", pin: "", role: "doctor", salaryAmount: "", salaryPayDay: "", salaryType: "fixed" });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditStaff = (member) => {
    setEditTarget(member.id);
    setEditFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      pin: "",
      role: member.role || "doctor",
      salaryAmount: member.salaryAmount || "",
      salaryPayDay: member.salaryPayDay || "",
      salaryType: member.salaryType || "fixed"
    });
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const updates = {
        fullName: editFormData.fullName,
        email: editFormData.email,
        phone: editFormData.phone,
        role: editFormData.role,
        salaryAmount: editFormData.salaryType === 'fixed' ? (Number(editFormData.salaryAmount) || 0) : 0,
        salaryPayDay: Number(editFormData.salaryPayDay) || 1,
        salaryType: editFormData.salaryType || "fixed"
      };

      if (editFormData.pin && editFormData.pin.length === 4) {
        updates.pinHash = await hashPin(editFormData.pin);
      } else if (editFormData.pin && editFormData.pin.length !== 4) {
        alert("ახალი PIN უნდა იყოს 4 ციფრიანი");
        setIsProcessing(false);
        return;
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
                onClick={() => setShowAddModal(true)}
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
                          className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all"
                          title="რედაქტირება"
                        >
                          <UserCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(member.id, member.role)}
                          className={`p-2 rounded-xl transition-all ${member.role === 'admin' ? 'hidden' : 'text-text-muted hover:text-red-500 hover:bg-red-500/10'}`}
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

                      <div className="mb-6 p-4 bg-emerald-500/10/50 rounded-2xl border border-emerald-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            {member.salaryType === 'commission' ? 'გამომუშავება' : 'ხელფასი'}
                          </span>
                          <span className="text-[11px] font-black text-emerald-700">
                            {member.salaryType === 'commission' ? 'პროცენტი' : `₾${member.salaryAmount}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-bold text-emerald-500/70 uppercase">რიცხვი</span>
                          <span className="text-[9px] font-black text-emerald-600">{member.salaryPayDay}</span>
                        </div>
                      </div>
                    <div className="pt-6 border-t border-border-main flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-text-main uppercase tracking-widest">{member.role}</span>
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
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
          <div className="bg-surface rounded-[40px] w-full max-w-sm p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-text-main italic mb-2">თანამშრომლის წაშლა</h3>
            <p className="text-xs text-text-muted font-bold leading-relaxed mb-8 uppercase tracking-widest">ეს ოპერაცია შეუქცევადია.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteTargetId(null)} className="py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest">გაუქმება</button>
              <button onClick={confirmDeleteStaff} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">წაშლა</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="bg-surface rounded-t-[28px] md:rounded-[40px] w-full max-w-md p-8 md:p-10 relative z-10 shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            {doctorLimitReached ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-brand-purple/10 text-brand-purple rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Crown size={40} />
                </div>
                <h3 className="text-2xl font-black text-text-main italic mb-4">ლიმიტი ამოწურულია</h3>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest leading-relaxed mb-8">
                   თქვენი პაკეტი გათვლილია მხოლოდ {currentPlan.maxDoctors} თანამშრომელზე.
                </p>
                <button 
                  onClick={() => navigate('/settings/billing')}
                  className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Zap size={18} className="fill-current" /> Upgrade
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddDoctor} className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-black text-text-main italic">ახალი თანამშრომელი</h3>
                   <button type="button" onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-main"><X /></button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">სრული სახელი</label>
                  <input required className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.fullName} onChange={e => setNewDoctor({...newDoctor, fullName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">PIN (4 ციფრი)</label>
                      <input required maxLength={4} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm text-center tracking-[0.5em] transition-all" value={newDoctor.pin} onChange={e => setNewDoctor({...newDoctor, pin: e.target.value.replace(/\D/g, '')})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">როლი</label>
                      <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all" value={newDoctor.role} onChange={e => setNewDoctor({...newDoctor, role: e.target.value})}>
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Reception</option>
                        <option value="accountant">Accountant</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ტელეფონი</label>
                      <input className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.phone} onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})} placeholder="599 XX XX XX" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ელ-ფოსტა</label>
                      <input type="email" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასის ტიპი</label>
                      <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all" value={newDoctor.salaryType} onChange={e => setNewDoctor({...newDoctor, salaryType: e.target.value})}>
                        <option value="fixed">ფიქსირებული</option>
                        <option value="commission">გამომუშავება</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გადახდის რიცხვი</label>
                      <input type="number" min="1" max="31" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.salaryPayDay} onChange={e => setNewDoctor({...newDoctor, salaryPayDay: e.target.value})} placeholder="1-31" />
                    </div>
                </div>
                {newDoctor.salaryType === 'fixed' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასი (₾)</label>
                    <input type="number" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.salaryAmount} onChange={e => setNewDoctor({...newDoctor, salaryAmount: e.target.value})} placeholder="0" />
                  </div>
                )}
                <button disabled={isProcessing} className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all mt-6">
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "შენახვა"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => setEditTarget(null)} />
          <div className="bg-surface rounded-t-[28px] md:rounded-[40px] w-full max-w-md p-8 md:p-10 relative z-10 shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-text-main italic">მონაცემების შეცვლა</h3>
                  <button type="button" onClick={() => setEditTarget(null)} className="text-text-muted hover:text-text-main"><X /></button>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">სრული სახელი</label>
                <input required className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.fullName} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">როლი</label>
                    <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all" value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Reception</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ტელეფონი</label>
                    <input className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ახალი PIN (4 ციფრი)</label>
                    <input maxLength={4} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm text-center tracking-[0.5em] transition-all" value={editFormData.pin} onChange={e => setEditFormData({...editFormData, pin: e.target.value.replace(/\D/g, '')})} placeholder="****" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ელ-ფოსტა</label>
                    <input type="email" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასის ტიპი</label>
                    <select className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all" value={editFormData.salaryType} onChange={e => setEditFormData({...editFormData, salaryType: e.target.value})}>
                      <option value="fixed">ფიქსირებული</option>
                      <option value="commission">გამომუშავება</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გადახდის რიცხვი</label>
                    <input type="number" min="1" max="31" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.salaryPayDay} onChange={e => setEditFormData({...editFormData, salaryPayDay: e.target.value})} />
                  </div>
              </div>
              {editFormData.salaryType === 'fixed' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ხელფასი (₾)</label>
                  <input type="number" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={editFormData.salaryAmount} onChange={e => setEditFormData({...editFormData, salaryAmount: e.target.value})} />
                </div>
              )}
              <button disabled={isProcessing} className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all mt-6">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ცვლილებების შენახვა"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Staff;