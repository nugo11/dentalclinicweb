import React, { useState, useEffect } from "react";
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

const Staff = () => {
  const { userData, clinicData } = useAuth();
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
    pin: "", // დავამატეთ PIN
    role: "doctor" 
  });

  const currentPlan = PLANS[(clinicData?.plan || "free").toLowerCase()] || PLANS.free;
  // Admin-ი ასევე staff-ზეა, ამიტომ > (და არა >=) — Solo-ზე 1 ექიმი ემატება
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

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (doctorLimitReached) return;
    if (newDoctor.pin.length !== 4) {
        alert("PIN უნდა შედგებოდეს 4 ციფრისგან");
        return;
    }
    setIsProcessing(true);

    try {
      const encoder = new TextEncoder();
      const pinData = encoder.encode(newDoctor.pin);
      const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      await addDoc(collection(db, "users"), {
        fullName: newDoctor.fullName,
        email: newDoctor.email,
        pinHash: pinHash, // ინახება მხოლოდ ჰაში
        role: newDoctor.role,
        clinicId: userData.clinicId,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      setShowAddModal(false);
      setNewDoctor({ fullName: "", email: "", pin: "", role: "doctor" });
    } catch (error) {
      console.error("Error:", error);
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
      await deleteDoc(doc(db, "users", deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const togglePinVisibility = (id) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-black text-brand-deep italic tracking-tighter">პერსონალის მართვა</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 italic">
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
                  <div key={member.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                    
                    <button 
                      onClick={() => handleDeleteStaff(member.id, member.role)}
                      className={`absolute top-6 right-6 p-2 rounded-xl transition-all ${member.role === 'admin' ? 'hidden' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 border ${member.role === 'admin' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-brand-purple border-slate-100'}`}>
                      {member.role === 'admin' ? <Crown size={28} /> : member.fullName ? member.fullName[0] : "?"}
                    </div>

                    <h3 className="text-lg font-black text-brand-deep italic leading-tight mb-1">{member.fullName}</h3>
                    <div className="flex items-center justify-between text-gray-400 mb-6">
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={12} />
                        <span className="text-[10px] font-bold truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <Shield size={10} className="text-brand-purple" />
                        <span className="text-[9px] font-black text-brand-deep tracking-widest uppercase">
                          SECURED
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-50">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">დაშვების დონე</label>
                      <select 
                        disabled={member.role === 'admin'}
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer
                          ${member.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-brand-deep border-transparent hover:border-brand-purple/30'}`}
                      >
                        <option value="admin">Administrator (ადმინი)</option>
                        <option value="manager">Manager (მენეჯერი)</option>
                        <option value="doctor">Doctor (ექიმი)</option>
                        <option value="receptionist">Reception (რეგისტრატორი)</option>
                        <option value="accountant">Accountant (ბუღალტერი)</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {deleteTargetId && (
        <div style={{position:'fixed',inset:0,zIndex:110,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)'}} onClick={() => setDeleteTargetId(null)} />
          <div className="bg-white rounded-[40px] w-full max-sm:w-full p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-brand-deep italic mb-2">თანამშრომლის წაშლა</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed mb-8 uppercase tracking-widest">
              ეს ოპერაცია შეუქცევადია.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteTargetId(null)} className="py-4 bg-slate-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">გაუქმება</button>
              <button onClick={confirmDeleteStaff} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">წაშლა</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAddModal(false)} />
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            {doctorLimitReached ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-brand-purple/10 text-brand-purple rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Crown size={40} />
                </div>
                <h3 className="text-2xl font-black text-brand-deep italic mb-4">ლიმიტი ამოწურულია</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                   თქვენი პაკეტი გათვლილია მხოლოდ {currentPlan.maxDoctors} თანამშრომელზე.
                </p>
                <button 
                  onClick={() => navigate('/settings/billing')}
                  className="w-full py-5 bg-brand-purple text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-brand-deep transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Zap size={18} className="fill-current" /> Upgrade
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddDoctor} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-2xl font-black text-brand-deep italic">ახალი თანამშრომელი</h3>
                   <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-300 hover:text-brand-deep"><X /></button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">სრული სახელი</label>
                  <input required className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.fullName} onChange={e => setNewDoctor({...newDoctor, fullName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">PIN (4 ციფრი)</label>
                      <input required maxLength={4} className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm text-center tracking-[0.5em] transition-all" value={newDoctor.pin} onChange={e => setNewDoctor({...newDoctor, pin: e.target.value.replace(/\D/g, '')})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">როლი</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-black text-[10px] uppercase tracking-widest appearance-none transition-all"
                        value={newDoctor.role}
                        onChange={e => setNewDoctor({...newDoctor, role: e.target.value})}
                      >
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Reception</option>
                        <option value="accountant">Accountant</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">ელ-ფოსტა (სურვილისამებრ)</label>
                  <input type="email" className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-4 outline-none font-bold text-sm transition-all" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} />
                </div>
                <button disabled={isProcessing} className="w-full py-5 bg-brand-deep text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all mt-6 active:scale-95">
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "შენახვა"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;