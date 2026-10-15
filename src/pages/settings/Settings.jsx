import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db, auth } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Dashboard/Sidebar";
import TopNav from "../../components/Dashboard/TopNav";
import { 
  User, Building2, Lock, Save, Loader2, 
  CheckCircle2, Camera, Mail, Shield, Smartphone, Activity, AlertTriangle
} from "lucide-react";

const Settings = () => {
  const { userData, clinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [passwordErrors, setPasswordErrors] = useState({});

  // State-ები ფორმისთვის
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: ""
  });
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: "",
    ehrUsername: "",
    ehrPassword: ""
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // მონაცემების საწყისი ჩატვირთვა
  useEffect(() => {
    if (userData) {
      setPersonalInfo({ fullName: userData.fullName || "", email: userData.email || "" });
    }
    if (clinicData) {
      setClinicInfo({ 
        clinicName: clinicData.clinicName || "",
        ehrUsername: clinicData.ehrUsername || "",
        ehrPassword: clinicData.ehrPassword || ""
      });
    }
  }, [userData, clinicData]);

  // წვდომის შემოწმება
  if (userData && userData.role !== 'admin' && userData.role !== 'manager') {
    return (
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[32px] flex items-center justify-center mb-6">
            <Shield size={44} />
          </div>
          <h2 className="text-3xl font-black text-text-main italic">წვდომა შეზღუდულია</h2>
          <p className="text-text-muted font-bold text-sm uppercase tracking-widest mt-4 max-w-sm text-center leading-relaxed">
            ამ გვერდის მართვა შეუძლია მხოლოდ კლინიკის ადმინისტრატორს ან მენეჯერს.
          </p>
        </div>
      </div>
    );
  }

  // შეტყობინების ავტომატური გაქრობა
  useEffect(() => {
    if (profileMessage.text) {
      const timer = setTimeout(() => setProfileMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (passwordMessage.text) {
      const timer = setTimeout(() => setPasswordMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ type: "", text: "" });
    try {
      // პირადი მონაცემების განახლება
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: personalInfo.fullName
      });
      
      // კლინიკის მონაცემების განახლება (ადმინისთვის და მენეჯერისთვის)
      if ((userData.role === 'admin' || userData.role === 'manager') && userData.clinicId) {
        const clinicUpdates = {};
        if (userData.role === 'admin') {
          clinicUpdates.clinicName = clinicInfo.clinicName;
        }
        clinicUpdates.ehrUsername = clinicInfo.ehrUsername;
        clinicUpdates.ehrPassword = clinicInfo.ehrPassword;
        
        await updateDoc(doc(db, "clinics", userData.clinicId), clinicUpdates);
      }
      
      setProfileMessage({ type: "success", text: "მონაცემები წარმატებით განახლდა!" });
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileMessage({ type: "error", text: "განახლება ვერ მოხერხდა." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordMessage({ type: "", text: "" });

    const errors = {};
    if (!passwords.currentPassword) {
      errors.currentPassword = "შეიყვანეთ მიმდინარე (ძველი) პაროლი!";
    }
    if (!passwords.newPassword) {
      errors.newPassword = "შეიყვანეთ ახალი პაროლი!";
    } else if (passwords.newPassword.length < 6) {
      errors.newPassword = "ახალი პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს!";
    }
    if (!passwords.confirmPassword) {
      errors.confirmPassword = "გაიმეორეთ ახალი პაროლი!";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = "პაროლები არ ემთხვევა!";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setPasswordMessage({ type: "error", text: Object.values(errors)[0] });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const user = auth.currentUser;
      const email = user?.email || userData?.email || personalInfo.email;
      if (!user || !email) {
        throw new Error("მომხმარებლის ელ-ფოსტა ვერ მოიძებნა.");
      }

      const credential = EmailAuthProvider.credential(email, passwords.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.newPassword);

      setPasswordMessage({ type: "success", text: "პაროლი წარმატებით შეიცვალა!" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
    } catch (err) {
      console.error("Password update error:", err);
      const code = err.code || "";
      if (
        code === "auth/wrong-password" || 
        code === "auth/invalid-credential" || 
        code === "auth/invalid-login-credentials"
      ) {
        setPasswordErrors({ currentPassword: "მიმდინარე (ძველი) პაროლი არასწორია!" });
        setPasswordMessage({ type: "error", text: "მიმდინარე (ძველი) პაროლი არასწორია!" });
      } else if (code === "auth/weak-password") {
        setPasswordErrors({ newPassword: "პაროლი ძალიან სუსტია" });
        setPasswordMessage({ type: "error", text: "ახალი პაროლი ძალიან სუსტია (მინიმუმ 6 სიმბოლო)!" });
      } else if (code === "auth/too-many-requests") {
        setPasswordMessage({ type: "error", text: "ძალიან ბევრი მცდელობა. გთხოვთ სცადოთ მოგვიანებით." });
      } else if (code === "auth/requires-recent-login") {
        setPasswordMessage({ type: "error", text: "უსაფრთხოებისთვის გთხოვთ ხელახლა გაიაროთ ავტორიზაცია." });
      } else {
        setPasswordMessage({ type: "error", text: err.message || "შეცდომა პაროლის შეცვლისას!" });
      }
    } finally {
      setIsChangingPassword(false);
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

                  <div className="pt-6 border-t border-border-main space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="text-brand-purple" size={20} />
                      <h3 className="text-lg font-black text-text-main italic">EHR ინტეგრაცია</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">EHR მომხმარებელი</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                          value={clinicInfo.ehrUsername}
                          onChange={(e) => setClinicInfo({...clinicInfo, ehrUsername: e.target.value})}
                          placeholder="შეიყვანეთ ლოგინი ან მეილი"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">EHR პაროლი</label>
                        <input 
                          type="password" 
                          className="w-full px-6 py-4 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl outline-none font-bold text-sm transition-all"
                          value={clinicInfo.ehrPassword}
                          onChange={(e) => setClinicInfo({...clinicInfo, ehrPassword: e.target.value})}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {profileMessage.text && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border ${
                      profileMessage.type === "success" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : "bg-red-500/10 border-red-500/20 text-red-500"
                    }`}>
                      {profileMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <span className="text-xs font-black uppercase tracking-wider">{profileMessage.text}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-3 bg-brand-purple hover:bg-brand-purple/90 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} მონაცემების შენახვა
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

                  <div className="space-y-6">
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center justify-between ml-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">მიმდინარე პაროლი (ძველი)</label>
                        {passwordErrors.currentPassword && (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-tight animate-in fade-in">
                            {passwordErrors.currentPassword}
                          </span>
                        )}
                      </div>
                      <input 
                        type="password" 
                        required
                        className={`w-full px-6 py-4 bg-surface-soft border-2 rounded-2xl outline-none font-bold text-sm transition-all text-text-main ${
                          passwordErrors.currentPassword 
                            ? "border-red-500 bg-red-500/10 animate-shake" 
                            : "border-transparent focus:border-brand-purple"
                        }`}
                        value={passwords.currentPassword}
                        onChange={(e) => {
                          setPasswords({...passwords, currentPassword: e.target.value});
                          if (passwordErrors.currentPassword) {
                            setPasswordErrors(prev => ({...prev, currentPassword: null}));
                          }
                        }}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-4">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">ახალი პაროლი</label>
                          {passwordErrors.newPassword && (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-tight animate-in fade-in">
                              {passwordErrors.newPassword}
                            </span>
                          )}
                        </div>
                        <input 
                          type="password" 
                          required
                          className={`w-full px-6 py-4 bg-surface-soft border-2 rounded-2xl outline-none font-bold text-sm transition-all text-text-main ${
                            passwordErrors.newPassword 
                              ? "border-red-500 bg-red-500/10 animate-shake" 
                              : "border-transparent focus:border-brand-purple"
                          }`}
                          value={passwords.newPassword}
                          onChange={(e) => {
                            setPasswords({...passwords, newPassword: e.target.value});
                            if (passwordErrors.newPassword) {
                              setPasswordErrors(prev => ({...prev, newPassword: null}));
                            }
                          }}
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-4">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">გაიმეორეთ ახალი პაროლი</label>
                          {passwordErrors.confirmPassword && (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-tight animate-in fade-in">
                              {passwordErrors.confirmPassword}
                            </span>
                          )}
                        </div>
                        <input 
                          type="password" 
                          required
                          className={`w-full px-6 py-4 bg-surface-soft border-2 rounded-2xl outline-none font-bold text-sm transition-all text-text-main ${
                            passwordErrors.confirmPassword 
                              ? "border-red-500 bg-red-500/10 animate-shake" 
                              : "border-transparent focus:border-brand-purple"
                          }`}
                          value={passwords.confirmPassword}
                          onChange={(e) => {
                            setPasswords({...passwords, confirmPassword: e.target.value});
                            if (passwordErrors.confirmPassword) {
                              setPasswordErrors(prev => ({...prev, confirmPassword: null}));
                            }
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline Password Alert Banner */}
                  {passwordMessage.text && (
                    <div 
                      className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border ${
                        passwordMessage.type === "success" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                          : "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}
                    >
                      {passwordMessage.type === "success" ? (
                        <CheckCircle2 size={18} className="shrink-0" />
                      ) : (
                        <AlertTriangle size={18} className="shrink-0" />
                      )}
                      <span className="text-xs font-black uppercase tracking-wider">{passwordMessage.text}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex items-center gap-3 bg-brand-purple text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-brand-purple/20 hover:bg-brand-deep transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : null}
                    <span>პაროლის შეცვლა</span>
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