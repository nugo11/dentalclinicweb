import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db, auth } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Dashboard/Sidebar";
import TopNav from "../../components/Dashboard/TopNav";
import { 
  User, Building2, Lock, Save, Loader2, 
  CheckCircle2, Camera, Mail, Shield, Smartphone 
} from "lucide-react";

const Settings = () => {
  const { userData, clinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // State-ები ფორმისთვის
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: ""
  });
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: ""
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // მონაცემების საწყისი ჩატვირთვა
  useEffect(() => {
    if (userData) {
      setPersonalInfo({ fullName: userData.fullName || "", email: userData.email || "" });
    }
    if (clinicData) {
      setClinicInfo({ clinicName: clinicData.clinicName || "" });
    }
  }, [userData, clinicData]);

  // წვდომის შემოწმება
  if (userData && userData.role !== 'admin') {
    return (
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[32px] flex items-center justify-center mb-6">
            <Shield size={44} />
          </div>
          <h2 className="text-3xl font-black text-text-main italic">წვდომა შეზღუდულია</h2>
          <p className="text-text-muted font-bold text-sm uppercase tracking-widest mt-4 max-w-sm text-center leading-relaxed">
            ამ გვერდის მართვა შეუძლია მხოლოდ კლინიკის ადმინისტრატორს.
          </p>
        </div>
      </div>
    );
  }

  // შეტყობინების ავტომატური გაქრობა
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // პირადი მონაცემების განახლება
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: personalInfo.fullName
      });
      
      // კლინიკის მონაცემების განახლება (მხოლოდ ადმინისთვის)
      if (userData.role === 'admin' && userData.clinicId) {
        await updateDoc(doc(db, "clinics", userData.clinicId), {
          clinicName: clinicInfo.clinicName
        });
      }
      
      setMessage({ type: "success", text: "მონაცემები წარმატებით განახლდა!" });
    } catch (err) {
      setMessage({ type: "error", text: "განახლება ვერ მოხერხდა." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "პაროლები არ ემთხვევა!" });
      return;
    }
    
    setIsSaving(true);
    try {
      await updatePassword(auth.currentUser, passwords.newPassword);
      setMessage({ type: "success", text: "პაროლი წარმატებით შეიცვალა!" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: "შეცდომა! თავიდან გაიარეთ ავტორიზაცია." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>პარამეტრები — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">პარამეტრები</h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">პროფილისა და კლინიკის მართვა</p>
              </div>
              
              {message.text && (
                <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                  <CheckCircle2 size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{message.text}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8">
              
              {/* 1. ძირითადი ინფორმაცია */}
              <section className="bg-surface p-10 rounded-[48px] border border-border-main shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <User size={120} />
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="text-brand-purple" size={20} />
                    <h3 className="text-xl font-black text-text-main italic">პირადი და კლინიკის ინფორმაცია</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">სრული სახელი</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" size={18} />
                        <input 
                          type="text" 
                          className="w-full pl-14 pr-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                          value={personalInfo.fullName}
                          onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">ელ-ფოსტა (მხოლოდ ნახვა)</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input 
                          disabled
                          type="email" 
                          className="w-full pl-14 pr-6 py-4 bg-surface-soft border-2 border-transparent rounded-2xl outline-none font-bold text-sm text-text-muted cursor-not-allowed"
                          value={personalInfo.email}
                        />
                      </div>
                    </div>

                    {userData?.role === 'admin' && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">კლინიკის დასახელება</label>
                        <div className="relative group">
                          <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" size={18} />
                          <input 
                            type="text" 
                            className="w-full pl-14 pr-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                            value={clinicInfo.clinicName}
                            onChange={(e) => setClinicInfo({...clinicInfo, clinicName: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={isSaving}
                    className="flex items-center gap-3 bg-brand-deep text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} მონაცემების შენახვა
                  </button>
                </form>
              </section>

              {/* 2. უსაფრთხოება / პაროლი */}
              <section className="bg-surface p-10 rounded-[48px] border border-border-main shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <Lock size={120} />
                </div>

                <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="text-brand-purple" size={20} />
                    <h3 className="text-xl font-black text-text-main italic">უსაფრთხოება</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">ახალი პაროლი</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">გაიმეორეთ პაროლი</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isSaving}
                    className="flex items-center gap-3 bg-brand-purple text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-brand-purple/20 hover:bg-brand-deep transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    პაროლის შეცვლა
                  </button>
                </form>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default Settings;