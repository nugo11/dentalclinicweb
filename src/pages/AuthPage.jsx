import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, collection, getDoc, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { 
  Activity, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, 
  Building2, ShieldCheck, ChevronLeft, User, 
  Phone, Sparkles, Rocket, Shield, Users
} from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState("credentials"); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();
  const { staffLogin, currentUser, clinicData, activeStaff } = useAuth(); 

  // --- Auto-detect if clinic is logged in but staff is not ---
  React.useEffect(() => {
    if (currentUser && !activeStaff && clinicData?.id) {
        const fetchStaff = async () => {
            const q = query(collection(db, "users"), where("clinicId", "==", clinicData.id));
            const snap = await getDocs(q);
            const staff = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setStaffList(staff);
            setAuthStep("staff_select");
        };
        fetchStaff();
    }
  }, [currentUser, activeStaff, clinicData?.id]);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // ახალი: ტელეფონის ნომერი
  const [smsStatus, setSmsStatus] = useState("idle"); // idle, loading, sent, verified
  const [showSmsModal, setShowSmsModal] = useState(false); // ახალი მოდალის სტეიტი
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [loginName, setLoginName] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState(""); // ახალი: პინის გამეორება
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  React.useEffect(() => {
    // შემოწმება localStorage-დან
    const lastSent = localStorage.getItem(`sms_cooldown_${phone}`);
    const savedOtp = localStorage.getItem(`sms_otp_${phone}`);
    
    if (savedOtp) setGeneratedOtp(savedOtp);

    if (lastSent) {
      const remaining = Math.floor((parseInt(lastSent) + 120000 - Date.now()) / 1000);
      if (remaining > 0) setResendTimer(remaining);
      else {
          localStorage.removeItem(`sms_cooldown_${phone}`);
          localStorage.removeItem(`sms_otp_${phone}`);
      }
    }

    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
            if (prev <= 1) {
                clearInterval(interval);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, phone]);

  // გასუფთავება ნაბიჯის შეცვლისას
  React.useEffect(() => {
    setPin("");
    setConfirmPin("");
    setFormErrors({});
  }, [authStep]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    
    if (isLogin) {
        if (!loginName) errors.loginName = "ჩაწერეთ კლინიკის ლოგინი";
        if (!password) errors.password = "ჩაწერეთ პაროლი";
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) errors.email = "შეიყვანეთ სწორი ელ-ფოსტა (@ და .)";
        
        const phoneRegex = /^5\d{8}$/;
        if (!phone.trim()) {
            errors.phone = "მიუთითეთ ტელეფონის ნომერი";
        } else if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
            errors.phone = "უნდა იწყებოდეს 5-ით და შეიცავდეს 9 ციფრს";
        }

        const latinRegex = /^[a-zA-Z0-9-]+$/;
        if (!loginName) {
            errors.loginName = "მიუთითეთ კლინიკის ID (ლოგინი)";
        } else if (!latinRegex.test(loginName)) {
            errors.loginName = "გამოიყენეთ მხოლოდ ლათინური ასოები და ციფრები";
        }

        if (!fullName) errors.fullName = "მიუთითეთ სახელი და გვარი";
        if (!clinicName) errors.clinicName = "მიუთითეთ კლინიკის სახელი";
        if (password !== confirmPassword) errors.confirmPassword = "პაროლები არ ემთხვევა";
        
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasLength = password.length >= 8;

        if (!hasLength || !hasNumber || !hasSpecialChar) {
            errors.password = "პაროლი არ აკმაყოფილებს უსაფრთხოების მოთხოვნებს";
        }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    
    if (isLogin) {
      setIsLoading(true);
      try {
        // 1. ვეძებთ კლინიკას loginName-ით
        const clinicQuery = query(collection(db, "clinics"), where("loginName", "==", loginName.toLowerCase()));
        const clinicSnap = await getDocs(clinicQuery);
        
        if (clinicSnap.empty) {
            setFormErrors({ loginName: "ასეთი კლინიკის ლოგინი არ არსებობს" });
            setIsLoading(false);
            return;
        }

        const clinicInfo = clinicSnap.docs[0].data();
        const ownerEmail = clinicInfo.ownerEmail; // ვინახავთ მფლობელის მეილს კლინიკის დოკუმენტში

        // 2. ვახდენთ ავტორიზაციას რეალური მეილით
        const userCredential = await signInWithEmailAndPassword(auth, ownerEmail, password);
        const uid = userCredential.user.uid;
        
        const q = query(collection(db, "users"), where("clinicId", "==", clinicSnap.docs[0].id));
        const snap = await getDocs(q);
        const staff = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStaffList(staff);
        setAuthStep("staff_select");
      } catch (err) {
        console.error(err);
        setFormErrors({ general: "ავტორიზაცია ვერ მოხერხდა. პაროლი არასწორია." });
      } finally {
        setIsLoading(false);
        // სუფთა ერორებისთვის
        setTimeout(() => setFormErrors({}), 2000);
      }
    } else {
      // რეგისტრაციისას ვამოწმებთ loginName და Phone-ის უნიკალურობას
      setIsLoading(true);
      try {
          // 1. ვამოწმებთ კლინიკის ID-ს
          const clinicQuery = query(collection(db, "clinics"), where("loginName", "==", loginName.toLowerCase()));
          const clinicSnap = await getDocs(clinicQuery);
          if (!clinicSnap.empty) {
              setFormErrors({ loginName: "ეს ლოგინი უკვე დაკავებულია" });
              setIsLoading(false);
              return;
          }

          // 2. ვამოწმებთ ტელეფონის ნომერს
          const phoneQuery = query(collection(db, "users"), where("phone", "==", phone));
          const phoneSnap = await getDocs(phoneQuery);
          if (!phoneSnap.empty) {
              setFormErrors({ phone: "ეს ტელეფონის ნომერი უკვე რეგისტრირებულია" });
              setIsLoading(false);
              return;
          }

          if (smsStatus !== "verified") {
              setIsLoading(false);
              setShowSmsModal(true);
              
              // შემოწმება უკვე ხომ არ არის ტაიმერი აქტიური
              const lastSent = localStorage.getItem(`sms_cooldown_${phone}`);
              if (lastSent) {
                  const remaining = Math.floor((parseInt(lastSent) + 120000 - Date.now()) / 1000);
                  if (remaining > 0) {
                      setSmsStatus("sent"); // თუ უკვე გაგზავნილია, გადავდივართ კოდის შეყვანაზე
                      return;
                  }
              }

              handleSendSms(); 
              return;
          }

          setAuthStep("pin");
      } catch (err) {
          console.error("Uniqueness check error:", err);
          if (err.message.includes("permissions")) {
              setFormErrors({ general: "Firebase-ის წვდომის შეცდომა (Rules update required)." });
          } else {
              setFormErrors({ general: "შეცდომა შემოწმებისას: " + (err.message || "კავშირის პრობლემა") });
          }
      } finally {
          setIsLoading(false);
      }
    }
  };

  const checkEmailUniqueness = async (emailToTest) => {
    if (!emailToTest || !emailToTest.includes("@")) return;
    const testEmail = emailToTest.toLowerCase();
    try {
      const q = query(collection(db, "users"), where("email", "==", testEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFormErrors(prev => ({ ...prev, email: "ეს ელ-ფოსტა უკვე დაკავებულია" }));
      }
    } catch (err) {
      console.error("Email check error:", err);
    }
  };

  const checkPhoneUniqueness = async (phoneToTest) => {
    if (!phoneToTest || phoneToTest.length < 9) return;
    try {
      const q = query(collection(db, "users"), where("phone", "==", phoneToTest));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFormErrors(prev => ({ ...prev, phone: "ეს ტელეფონის ნომერი უკვე რეგისტრირებულია" }));
      }
    } catch (err) {
      console.error("Phone check error:", err);
    }
  };

  const checkLoginNameUniqueness = async (loginToTest) => {
    if (!loginToTest) return;
    const testLogin = loginToTest.toLowerCase();
    try {
      const q = query(collection(db, "clinics"), where("loginName", "==", testLogin));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFormErrors(prev => ({ ...prev, loginName: "ეს სახელი უკვე დაკავებულია" }));
      }
    } catch (err) {
      console.error("Login name check error:", err);
    }
  };

  const handleStaffSelect = (staffMember) => {
    setSelectedStaff(staffMember);
    setPin("");
    setAuthStep("staff_pin");
  };

  const handleFinalAuth = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setFormErrors({ pin: "PIN უნდა იყოს 4 ციფრი" });
      return;
    }

    if (!isLogin && pin !== confirmPin) {
      setFormErrors({ pin: "PIN კოდები არ ემთხვევა" });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // ჰეშირებული პინის შედარება
        const encoder = new TextEncoder();
        const pinData = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pinHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        let isValid = false;
        if (selectedStaff.adminPinHash) {
          if (pinHash === selectedStaff.adminPinHash) isValid = true;
        } else if (selectedStaff.pinHash) {
          if (pinHash === selectedStaff.pinHash) isValid = true;
        } else if (selectedStaff.pin === pin) {
          // ძველი პინების მხარდაჭერა (დროებითი)
          isValid = true;
        }

        if (isValid) {
          const { pin, pinHash: pHash, adminPinHash, ...safeStaff } = selectedStaff;
          staffLogin(safeStaff);
          navigate("/dashboard");
        } else {
          setFormErrors({ pin: "PIN კოდი არასწორია" });
        }
      } else {
        // რეგისტრაციის ნაწილი
        const lowEmail = email.toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, lowEmail, password);
        const uid = userCredential.user.uid;
        
        const clinicsCol = collection(db, "clinics");
        const newClinicRef = doc(clinicsCol);
        const generatedClinicId = newClinicRef.id;

        await setDoc(newClinicRef, {
          clinicName,
          loginName: loginName.toLowerCase(),
          plan: "free", 
          subscriptionStatus: "active",
          ownerId: uid,
          ownerEmail: email.toLowerCase(), // ვინახავთ მეილს ლოგინისთვის
          createdAt: new Date().toISOString(),
        });

        const encoder = new TextEncoder();
        const pinData = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pinHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const newUser = {
          fullName, email: email.toLowerCase(), phone, clinicId: generatedClinicId,
          role: "admin", adminPinHash: pinHash,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", uid), newUser);
        
        // localStorage-ში შესანახად ვშლით სენსიტიურ მონაცემებს
        const { adminPinHash, ...safeUser } = newUser;
        staffLogin({ id: uid, ...safeUser });
        setAuthStep("success");
      }
    } catch (err) {
      console.error("Final auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setFormErrors({ email: "ეს ელ-ფოსტა უკვე გამოყენებულია" });
        setAuthStep("credentials");
      } else {
        setFormErrors({ general: "ავტორიზაცია ვერ მოხერხდა. " + (err.message || "") });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email || !email.includes("@")) {
      setFormErrors((prev) => ({
        ...prev,
        email: "პაროლის აღსადგენად ჩაწერეთ სწორი ელ-ფოსტა",
      }));
      setResetMessage("");
      return;
    }

    setIsLoading(true);
    setFormErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("პაროლის აღდგენის ლინკი გამოგზავნილია ელ-ფოსტაზე.");
    } catch (error) {
      console.error("Reset password error:", error);
      setFormErrors((prev) => ({
        ...prev,
        general: "პაროლის აღდგენა ვერ მოხერხდა. სცადეთ ხელახლა.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSms = async () => {
    let formattedPhone = phone.trim();
    
    // სპამის პრევენცია - შემოწმება გაგზავნამდე
    const lastSent = localStorage.getItem(`sms_cooldown_${phone}`);
    if (lastSent) {
        const remaining = Math.floor((parseInt(lastSent) + 120000 - Date.now()) / 1000);
        if (remaining > 0) {
            setResendTimer(remaining);
            setSmsStatus("sent");
            return;
        }
    }
    
    // ქართული ნომრის ვალიდაცია
    const phoneRegex = /^(?:\+?995)?(5\d{8})$/;
    const match = formattedPhone.match(phoneRegex);
    
    if (!match) {
      setFormErrors(prev => ({ ...prev, phone: "არასწორი ფორმატი. მაგ: 555123456" }));
      return;
    }
    
    const finalPhone = "995" + match[1];
    setFormErrors(prev => ({ ...prev, phone: undefined, general: undefined }));
    setSmsStatus("loading");
    
    // ვქმნით 6 ნიშნა კოდს
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    try {
      const apiKey = import.meta.env.VITE_UBILL_API_KEY;
      const response = await fetch(`/api/ubill/v1/sms/send?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandID: 2,
          numbers: [finalPhone],
          text: `AiDent kodi: ${otp}`,
          otp: true
        })
      });
      
      if (!response.ok) {
        throw new Error("SMS-ის გაგზავნა ვერ მოხერხდა API-დან");
      }

      const data = await response.json();
      if (data.statusID === 10) {
          throw new Error("გამგზავნის სახელი (Brand ID) არ არის ვერიფიცირებული UBill-ზე.");
      } else if (data.statusID !== undefined && data.statusID !== 0) {
          throw new Error(`UBill შეცდომა: ${data.message || "უცნობი შეცდომა"}`);
      }
      
      localStorage.setItem(`sms_cooldown_${phone}`, Date.now().toString());
      localStorage.setItem(`sms_otp_${phone}`, otp);
      setSmsStatus("sent");
      setResendTimer(120); // 2 წუთი
    } catch (err) {
      console.error("UBill Error:", err);
      setFormErrors({ general: "სისტემური შეცდომა SMS-ის გაგზავნისას. გადაამოწმეთ API კავშირი." });
      setSmsStatus("idle");
    }
  };

  // ძველი handleVerifyOtp ამოვიღეთ, რადგან მოდალში პირდაპირ გვიწერია ლოგიკა

  return (
    <>
      <Helmet>
        <title>{isLogin ? "ავტორიზაცია" : "რეგისტრაცია"} — AiDent</title>
      </Helmet>
      <div className="min-h-screen lg:h-screen w-full bg-surface-soft font-nino flex overflow-hidden">
      
      {/* --- მარცხენა პანელი: Modern & Sharp --- */}
      <div className={`hidden lg:flex relative w-[45%] h-screen p-20 flex-col justify-between text-white transition-all duration-1000 ease-in-out ${!isLogin ? "bg-brand-purple" : "bg-brand-deep"}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-surface/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-purple/20 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-surface/10 backdrop-blur-2xl border border-white/20 rounded-[22px] flex items-center justify-center group-hover:bg-surface group-hover:text-text-main transition-all duration-500 shadow-xl">
              <Activity size={32} />
            </div>
            <span className="text-4xl font-black italic tracking-tighter">AiDent</span>
          </Link>

          <div className="mt-32 space-y-8">
            <h1 className="text-[90px] font-black leading-[0.85] italic uppercase tracking-tighter animate-in slide-in-from-left-10 duration-1000">
              {isLogin ? "Digital \nClinic" : "Future \nReady"}
            </h1>
            <p className="text-xl text-white/50 font-medium max-w-sm leading-relaxed italic">
              მართეთ თქვენი კლინიკა ყველაზე თანამედროვე ხელოვნური ინტელექტის მხარდაჭერით.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-10 opacity-40">
          {["Encryption", "GDPR", "HIPAA"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em]">
               <Shield size={12} /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* --- მარჯვენა პანელი: White & Clean --- */}
      <div className="flex-1 min-h-screen lg:h-full flex items-center justify-center p-4 sm:p-8 bg-surface lg:bg-surface-soft overflow-y-auto">
        <div className="max-w-[520px] w-full bg-surface lg:p-14 rounded-[32px] lg:rounded-[56px] lg:shadow-[0_40px_100px_rgba(0,0,0,0.03)] transition-all py-6 sm:py-0">
          {authStep === "credentials" && (
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="lg:hidden mb-4 flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-text-main"
            >
              <ChevronLeft size={16} /> უკან
            </button>
          )}
          
          {authStep === "credentials" && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/5 text-brand-purple rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <Sparkles size={14} /> Intelligence Platform
                </div>
                <h3 className="text-3xl sm:text-5xl font-black text-text-main italic tracking-tighter mb-3">
                  {isLogin ? "ავტორიზაცია" : "რეგისტრაცია"}
                </h3>
                <p className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
                   {isLogin ? "კეთილი იყოს თქვენი მობრძანება" : "შექმენით თქვენი კლინიკის ციფრული პროფილი"}
                </p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-1 gap-4">
                    <InputField icon={Building2} placeholder="კლინიკის დასახელება" value={clinicName} onChange={setClinicName} error={formErrors.clinicName} />
                    <InputField 
                        icon={ShieldCheck} 
                        placeholder="კლინიკის ლოგინი (მაგ: myclinic)" 
                        value={loginName} 
                        onChange={(val) => {
                            setLoginName(val.toLowerCase());
                            if (val && !/^[a-zA-Z0-9-]*$/.test(val)) {
                                setFormErrors(prev => ({ ...prev, loginName: "გამოიყენეთ მხოლოდ ლათინური ასოები" }));
                            } else {
                                setFormErrors(prev => ({ ...prev, loginName: null }));
                            }
                        }} 
                        onBlur={() => checkLoginNameUniqueness(loginName)}
                        error={formErrors.loginName} 
                    />
                    <div className="flex flex-col gap-4">
                        <InputField icon={User} placeholder="სახელი და გვარი" value={fullName} onChange={setFullName} error={formErrors.fullName} />
                        <InputField 
                            icon={Phone} 
                            placeholder="ტელეფონი (მაგ: 555123456)" 
                            value={phone} 
                            onChange={(v) => { 
                                const cleaned = v.replace(/\D/g, '').slice(0, 9);
                                setPhone(cleaned);
                                setSmsStatus("idle");
                                setUserOtp("");
                                
                                if (cleaned.length > 0 && cleaned[0] !== '5') {
                                    setFormErrors(prev => ({...prev, phone: "ნომერი უნდა იწყებოდეს 5-ით"}));
                                } else if (cleaned.length === 9) {
                                    setFormErrors(prev => ({...prev, phone: undefined}));
                                } else if (formErrors.phone === "ნომერი უნდა იწყებოდეს 5-ით" && (cleaned.length === 0 || cleaned[0] === '5')) {
                                    setFormErrors(prev => ({...prev, phone: undefined}));
                                }
                            }} 
                            onBlur={() => {
                                if (phone.length > 0 && phone.length < 9) {
                                    setFormErrors(prev => ({...prev, phone: "ნომერი არასწორია (უნდა შეიცავდეს 9 ციფრს)"}));
                                } else if (phone.length === 9) {
                                    checkPhoneUniqueness(phone);
                                }
                            }}
                            error={formErrors.phone} 
                        />
                    </div>
                  </div>
                )}
                
                {isLogin ? (
                    <InputField icon={ShieldCheck} placeholder="კლინიკის ლოგინი" value={loginName} onChange={setLoginName} error={formErrors.loginName} />
                ) : (
                    <InputField 
                        icon={Mail} 
                        type="email" 
                        placeholder="ელ-ფოსტა" 
                        value={email} 
                        onChange={(val) => {
                            setEmail(val.toLowerCase());
                            if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                        }} 
                        onBlur={() => checkEmailUniqueness(email)}
                        error={formErrors.email} 
                    />
                )}

                <div className="relative">
                  <InputField icon={Lock} type={showPassword ? "text" : "password"} placeholder="პაროლი" value={password} onChange={setPassword} error={formErrors.password} />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-[26px] text-text-muted hover:text-brand-purple transition-colors outline-none">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {!isLogin && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 mt-1 mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${password.length >= 8 ? 'text-emerald-500' : 'text-text-muted'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${password.length >= 8 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-text-muted/30'}`} /> 8+ სიმბოლო
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-500' : 'text-text-muted'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-text-muted/30'}`} /> სპეც. სიმბოლო
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${/\d/.test(password) ? 'text-emerald-500' : 'text-text-muted'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${/\d/.test(password) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-text-muted/30'}`} /> ციფრი
                    </span>
                  </div>
                )}
                {!isLogin && <InputField icon={Lock} type={showPassword ? "text" : "password"} placeholder="გაიმეორეთ პაროლი" value={confirmPassword} onChange={setConfirmPassword} error={formErrors.confirmPassword} />}

                {isLogin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-purple hover:text-text-main transition-colors disabled:opacity-50"
                    >
                      პაროლის აღდგენა
                    </button>
                  </div>
                )}

                {resetMessage && (
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-600 font-black text-center uppercase tracking-tight">
                      {resetMessage}
                    </p>
                  </div>
                )}

                {formErrors.general && (
                   <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 animate-in shake duration-300">
                      <p className="text-[11px] text-red-500 font-black text-center uppercase tracking-tight">{formErrors.general}</p>
                   </div>
                )}

                <button 
                  disabled={isLoading}
                  className="w-full bg-brand-purple text-white py-5 sm:py-7 rounded-[20px] sm:rounded-[28px] font-black text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:brightness-110 transition-all shadow-2xl hover:shadow-brand-purple/60 flex items-center justify-center gap-3 group mt-8 sm:mt-10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <>
                      {isLogin ? "ავტორიზაცია" : "რეგისტრაცია"} <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setFormErrors({}); }} className="text-text-muted font-black text-[11px] uppercase tracking-widest hover:text-brand-purple transition-colors">
                  {isLogin ? "ახალი კლინიკის რეგისტრაცია" : "უკვე გაქვთ პროფილი? შესვლა"}
                </button>
              </div>
            </div>
          )}

          {authStep === "staff_select" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="mb-10">
                  <h3 className="text-3xl font-black text-text-main italic tracking-tighter mb-2">ვინ ხართ?</h3>
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">აირჩიეთ თქვენი პროფილი სამუშაოდ</p>
               </div>
               <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {staffList.map((member) => (
                    <button 
                      key={member.id}
                      onClick={() => handleStaffSelect(member)}
                      className="p-6 bg-surface-soft border-2 border-transparent hover:border-brand-purple hover:bg-surface rounded-[32px] transition-all group text-left"
                    >
                       <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-purple group-hover:text-white transition-all font-black text-xl">
                          {member.fullName ? member.fullName[0] : "?"}
                       </div>
                       <h4 className="font-black text-text-main text-sm leading-tight">{member.fullName}</h4>
                       <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">{member.role}</p>
                    </button>
                  ))}
               </div>
               <button 
                onClick={() => { auth.signOut(); setAuthStep("credentials"); }}
                className="w-full mt-8 py-5 border-2 border-dashed border-border-main text-text-muted rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:border-red-200 hover:text-red-400 transition-all"
               >
                 სხვა კლინიკა
               </button>
            </div>
          )}

          {authStep === "staff_pin" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setAuthStep("staff_select")} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-text-main">
                <ChevronLeft size={16} /> სხვა პროფილი
              </button>
              <div className="text-center mb-12">
                <div className="w-24 h-24 bg-brand-purple/10 rounded-[38px] flex items-center justify-center mx-auto mb-8 text-brand-purple font-black text-3xl">
                  {selectedStaff?.fullName ? selectedStaff.fullName[0] : "?"}
                </div>
                <h3 className="text-4xl font-black text-text-main tracking-tighter italic uppercase">შეიყვანეთ PIN</h3>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-4">{selectedStaff?.fullName}, გთხოვთ დაადასტუროთ წვდომა</p>
              </div>
              <form onSubmit={handleFinalAuth} className="space-y-10">
                <div className="flex justify-center">
                  <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="w-full max-w-64 py-5 sm:py-6 text-center text-5xl sm:text-6xl tracking-[0.35em] sm:tracking-[0.5em] pl-[0.35em] sm:pl-[0.5em] font-black text-text-main bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[28px] sm:rounded-[36px] outline-none transition-all" placeholder="••••" />
                </div>
                {formErrors.pin && <p className="text-center text-[10px] text-red-500 font-black uppercase tracking-widest">{formErrors.pin}</p>}
                <button disabled={isLoading} className="w-full bg-brand-purple text-white py-7 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "სისტემაში შესვლა"}
                </button>
              </form>
            </div>
          )}

          {authStep === "pin" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setAuthStep("credentials")} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-text-main">
                <ChevronLeft size={16} /> უკან
              </button>
              <div className="text-center mb-12">
                <div className="w-24 h-24 bg-brand-purple/10 rounded-[38px] flex items-center justify-center mx-auto mb-8 text-brand-purple">
                  <ShieldCheck size={48} />
                </div>
                <h3 className="text-4xl font-black text-text-main tracking-tighter italic uppercase">შექმენით PIN</h3>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-4">ეს არის თქვენი უსაფრთხოების გასაღები</p>
              </div>
              <form onSubmit={handleFinalAuth} className="space-y-10">
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">ახალი PIN</span>
                    <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="w-full max-w-64 py-5 text-center text-4xl tracking-[0.4em] pl-[0.4em] font-black text-text-main bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[28px] outline-none transition-all" placeholder="••••" autoComplete="new-password" inputMode="numeric" />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">გაიმეორეთ PIN</span>
                    <input type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} className="w-full max-w-64 py-5 text-center text-4xl tracking-[0.4em] pl-[0.4em] font-black text-text-main bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[28px] outline-none transition-all" placeholder="••••" autoComplete="new-password" inputMode="numeric" />
                  </div>
                </div>
                {formErrors.pin && <p className="text-center text-[10px] text-red-500 font-black uppercase tracking-widest">{formErrors.pin}</p>}
                <button disabled={isLoading} className="w-full bg-brand-purple text-white py-7 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "რეგისტრაციის დასრულება"}
                </button>
              </form>
            </div>
          )}

          {authStep === "success" && (
            <div className="animate-in zoom-in-95 duration-500 text-center py-6">
              <div className="w-28 h-28 bg-emerald-500 text-white rounded-[44px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30 animate-bounce">
                <Rocket size={56} />
              </div>
              <h3 className="text-4xl font-black text-text-main tracking-tighter italic mb-6">MABAL SERI!</h3>
              <p className="text-text-muted font-bold text-sm leading-relaxed mb-12 max-w-xs mx-auto">
                თქვენი კლინიკა დარეგისტრირდა <span className="text-brand-purple font-black">Free Plan</span>-ზე. პაკეტის გასაუმჯობესებლად დაგვიკავშირდით:
              </p>
              <div className="space-y-4 mb-12">
                <ContactCard icon={Phone} text="+995 5XX XX XX XX" />
                <ContactCard icon={Mail} text="upgrade@AiDent.ge" />
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full bg-brand-deep text-white py-7 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:bg-brand-purple transition-all shadow-xl active:scale-[0.98]">
                დაშბორდზე გადასვლა
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* --- SMS Verification Modal --- */}
    {showSmsModal && (
        <div className="fixed inset-0 bg-surface-deep/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 pb-10 sm:pb-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <div className="w-12 h-1.5 bg-border-main rounded-full mx-auto mb-6 sm:hidden" />
             <div className="text-center mb-8">
               <div className="w-20 h-20 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={40} />
               </div>
               <h3 className="text-2xl font-black italic tracking-tight text-text-main mb-2">SMS დადასტურება</h3>
               {smsStatus !== "verified" && (
                   <p className="text-text-muted text-[11px] font-bold mt-2 leading-relaxed">
                      თქვენს ნომერზე ({phone}) გაიგზავნა სარეგისტრაციო კოდი.
                   </p>
               )}
             </div>
             
             {smsStatus === "loading" && (
                <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <Loader2 className="animate-spin text-brand-purple" size={32} />
                    <p className="text-[10px] uppercase font-black tracking-widest text-text-muted">კოდი იგზავნება...</p>
                </div>
             )}

             {smsStatus === "sent" && (
                <div className="space-y-6">
                    <InputField 
                        icon={Lock} 
                        placeholder="შეიყვანეთ 6-ნიშნა კოდი" 
                        value={userOtp} 
                        onChange={setUserOtp} 
                        error={formErrors.otp}
                        maxLength={6}
                        autoFocus
                        autoComplete="one-time-code"
                        inputMode="numeric"
                    />

                    <button 
                        onClick={() => {
                            if (userOtp === generatedOtp && userOtp.length > 0) {
                                setSmsStatus("verified");
                                setFormErrors(prev => ({...prev, otp: undefined}));
                                setResendTimer(0);
                                // ვაჩვენებთ დადასტურებულს წამიერად და მერე ვხურავთ მოდალს
                                setTimeout(() => {
                                    setShowSmsModal(false);
                                    setAuthStep("pin");
                                }, 800);
                            } else {
                                setFormErrors(prev => ({...prev, otp: "კოდი არასწორია"}));
                            }
                        }}
                        className="w-full bg-brand-purple hover:bg-brand-deep text-white py-5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-brand-purple/20"
                    >
                        დადასტურება
                    </button>
                    {smsStatus === "sent" && (
                        <div className="mt-4">
                            <button 
                                type="button"
                                disabled={resendTimer > 0 || isLoading}
                                onClick={handleSendSms}
                                className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-purple transition-colors disabled:opacity-50"
                            >
                                {resendTimer > 0 
                                    ? `ხელახლა გაგზავნა (${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')})` 
                                    : "კოდის ხელახლა გაგზავნა"}
                            </button>
                        </div>
                    )}
                </div>
             )}

             {smsStatus === "verified" && (
                <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-[11px] uppercase font-black tracking-widest text-emerald-500">დადასტურებულია!</p>
                </div>
             )}
             
             {formErrors.general && (
                 <p className="text-red-500 text-center text-[10px] mt-4 font-black uppercase">{formErrors.general}</p>
             )}

             {smsStatus !== "verified" && (
                 <button 
                     onClick={() => { setShowSmsModal(false); setSmsStatus("idle"); setResendTimer(0); }}
                     className="mt-6 w-full text-center text-[10px] text-text-muted font-black uppercase hover:text-red-500 transition-colors cursor-pointer"
                 >
                    გაუქმება
                 </button>
             )}
          </div>
        </div>
      )}
    </>
  );
};

// --- დამხმარე კომპონენტები ---

const InputField = ({ icon: Icon, error, value, onChange, onBlur, ...props }) => (
  <div className="space-y-1 w-full group">
    <div className={`relative border-2 rounded-[26px] transition-all duration-300 ${
      error ? "border-red-500 bg-red-500/10 animate-shake" : "border-transparent bg-surface-soft focus-within:border-brand-purple focus-within:bg-surface focus-within:shadow-lg focus-within:shadow-brand-purple/5"
    }`}>
      <Icon className={`absolute left-7 top-1/2 -translate-y-1/2 transition-colors ${
        error ? "text-red-500" : "text-text-muted group-focus-within:text-brand-purple"
      }`} size={20} />
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        {...props} 
        className="w-full pl-16 pr-8 py-5 sm:py-6 bg-transparent outline-none font-bold text-base sm:text-sm text-text-main placeholder:text-text-muted transition-all" 
      />
    </div>
    {error && (
      <p className="text-[10px] text-red-600 font-black ml-7 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    )}
  </div>
);

const ContactCard = ({ icon: Icon, text }) => (
  <div className="p-6 bg-surface-soft rounded-[28px] flex items-center gap-5 border border-border-main hover:bg-surface hover:border-brand-purple/20 transition-all cursor-default">
    <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-brand-purple shadow-sm">
      <Icon size={22} />
    </div>
    <span className="font-black text-text-main text-sm">{text}</span>
  </div>
);

export default AuthPage;