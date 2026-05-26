import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Globe, AlertTriangle, Activity } from 'lucide-react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showChromeRequiredModal, setShowChromeRequiredModal] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [browserName, setBrowserName] = useState('');

  useEffect(() => {
    // --- Check if dismissed in this session ---
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed_session') === 'true';
    if (isDismissed) return;

    const ua = navigator.userAgent;

    // --- OS Detection ---
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroidDevice = /Android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // --- Browser Detection ---
    const isSamsungBrowser = /SamsungBrowser/i.test(ua);
    const isFirefox = /Firefox/i.test(ua) && !/Seamonkey/i.test(ua);
    const isOpera = /OPR|Opera/i.test(ua);
    const isEdge = /Edg/i.test(ua);
    const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
    const isChromeDetected = /Chrome/i.test(ua) && !/SamsungBrowser|OPR|Opera|Edg/i.test(ua);

    setIsChrome(isChromeDetected || isBrave);

    if (isSamsungBrowser) setBrowserName('Samsung Internet');
    else if (isFirefox) setBrowserName('Firefox');
    else if (isOpera) setBrowserName('Opera');
    else if (isEdge) setBrowserName('Edge');
    else if (isChromeDetected) setBrowserName('Chrome');
    else setBrowserName('');

    // --- Check if already installed ---
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    let timer;

    // --- beforeinstallprompt ---
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 2 seconds delay before showing the banner
      timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show with delay for iOS
    if (isIOSDevice && !isStandalone) {
      timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }

    // Show with delay for Android immediately
    if (isAndroidDevice && !isStandalone) {
      timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isAndroid && !isChrome && !deferredPrompt) {
      setShowChromeRequiredModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else if (isAndroid) {
      setShowAndroidModal(true);
    } else {
      alert("აპლიკაციის დასაინსტალირებლად დააჭირეთ ბრაუზერის მისამართების ზოლში განთავსებულ ინსტალაციის ღილაკს (Install icon).");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed_session', 'true');
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Custom Keyframe Styles to guarantee 100% smooth, hardware-accelerated slide-up transition */}
      <style>{`
        @keyframes slideUpBanner {
          0% {
            transform: translateY(120%) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up-custom {
          animation: slideUpBanner 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Mobile Banner - Distinct, High-Contrast Sleek Floating Card */}
      <div className="fixed bottom-6 left-4 right-4 z-[999] md:hidden animate-slide-up-custom">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-brand-purple rounded-[28px] p-5 shadow-[0_20px_50px_rgba(124,58,237,0.4)] flex flex-col gap-4">
          {/* Subtle Glow Background Accent */}
          <div className="absolute top-[-50%] left-[-20%] w-[130px] h-[130px] bg-brand-purple/20 rounded-full blur-[35px] pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-gradient-to-tr from-brand-purple to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-brand-purple/30">
                <Activity className="text-white" size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-white text-sm font-black tracking-tight leading-tight">დააინსტალირე AiDent</h4>
                <p className="text-brand-purple text-[9px] font-black uppercase tracking-widest mt-0.5">უფასო ინსტალაცია</p>
              </div>
            </div>
            
            <button 
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-white/80 text-xs font-semibold leading-relaxed relative z-10 px-1">
            მართე შენი კლინიკა უფრო სწრაფად და კომფორტულად. დაამატე ეკრანზე წამებში!
          </p>
          
          <div className="flex gap-2 relative z-10">
            <button 
              onClick={handleInstallClick}
              className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_6px_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={12} className="animate-bounce" /> ინსტალაცია
            </button>
            <button 
              onClick={handleDismiss}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              არა
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Card - Premium High-Contrast Standing Card */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-[999] w-88 flex-col gap-4 animate-slide-up-custom">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-brand-purple rounded-[32px] p-6 shadow-[0_25px_60px_rgba(124,58,237,0.4)] flex flex-col gap-3.5">
           {/* Subtle Glow Background Accent */}
           <div className="absolute top-[-30%] left-[-10%] w-[160px] h-[160px] bg-brand-purple/15 rounded-full blur-[45px] pointer-events-none" />

           {/* Header with App Icon and Info */}
           <div className="flex gap-3.5 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-tr from-brand-purple to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-purple/35 relative">
                 <Activity size={24} className="text-white animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                 <div className="flex justify-between items-start">
                   <h4 className="text-white text-base font-black tracking-tight leading-none mt-1">AiDent აპლიკაცია</h4>
                   <button 
                     onClick={handleDismiss}
                     className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                   >
                     <X size={14} />
                   </button>
                 </div>
                 <p className="text-white/60 text-[10px] font-semibold mt-1.5">კლინიკის მართვის ინოვაციური პლატფორმა</p>
              </div>
           </div>
           
           <div className="text-[11px] font-medium text-white/80 leading-relaxed relative z-10">
             დააინსტალირეთ აპლიკაცია თქვენს კომპიუტერზე უფრო სწრაფი წვდომისთვის და შეტყობინებებისთვის.
           </div>

           {/* Action Buttons */}
           <div className="flex gap-2 relative z-10">
             <button 
               onClick={handleInstallClick}
               className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_8px_24px_rgba(124,58,237,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
             >
               <Download size={12} className="animate-bounce" /> ინსტალაცია
             </button>
             <button 
               onClick={handleDismiss}
               className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
             >
               მოგვიანებით
             </button>
           </div>
        </div>
      </div>

      {/* iOS Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowIOSModal(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 pb-0 shrink-0">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                <button onClick={() => setShowIOSModal(false)} className="w-10 h-10 bg-surface-soft text-text-muted hover:text-text-muted rounded-full flex items-center justify-center transition-colors"><X size={18} /></button>
              </div>
              <h3 className="text-2xl font-black text-text-main tracking-tighter mb-2 italic">ინსტალაცია iPhone-ზე</h3>
              <p className="text-text-muted text-sm font-medium mb-6">მიჰყევით ამ ნაბიჯებს AiDent-ის დასამატებლად:</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
              <div className="space-y-8">
                {[
                  { step: "1", text: "დააჭირეთ '...' (სამ წერტილს)", img: "/ios_app/step1.jpg" },
                  { step: "2", text: "აირჩიეთ 'Share' ღილაკი", img: "/ios_app/step2.jpg" },
                  { step: "3", text: "ჩამოსქროლეთ და აირჩიეთ 'View More'", img: "/ios_app/step3.jpg" },
                  { step: "4", text: "დააჭირეთ 'Add to Home Screen'-ს", img: "/ios_app/step4.jpg" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center shrink-0">{item.step}</span>
                      <p className="text-[12px] font-black text-text-main uppercase tracking-tight">{item.text}</p>
                    </div>
                    <div className="rounded-2xl border border-border-main overflow-hidden shadow-sm">
                      <img src={item.img} alt={`Step ${item.step}`} className="w-full h-auto" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowIOSModal(false)} className="w-full mt-8 py-4 bg-brand-purple text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all">გასაგებია</button>
            </div>
          </div>
        </div>
      )}

      {/* Android Chrome Manual Instruction Modal */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAndroidModal(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                <button onClick={() => setShowAndroidModal(false)} className="w-10 h-10 bg-surface-soft text-text-muted hover:text-text-muted rounded-full flex items-center justify-center transition-colors"><X size={18} /></button>
              </div>
              <h3 className="text-2xl font-black text-text-main tracking-tighter mb-2 italic">ინსტალაცია Android-ზე</h3>
              <p className="text-text-muted text-sm font-medium mb-6">თუ ინსტალაციის ფანჯარა არ გამოჩნდა ავტომატურად:</p>
              <div className="space-y-4">
                <div className="p-4 bg-surface-soft rounded-2xl border border-border-main flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                  <p className="text-[12px] font-bold text-text-main uppercase">დააჭირეთ Chrome-ის მენიუს <span className="text-brand-purple">(⋮ სამ წერტილს ზედა მარჯვენა კუთხეში)</span></p>
                </div>
                <div className="p-4 bg-surface-soft rounded-2xl border border-border-main flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                  <p className="text-[12px] font-bold text-text-main uppercase">აირჩიეთ <span className="text-brand-purple">"მთავარ ეკრანზე დამატება"</span> ან <span className="text-brand-purple text-sm">"Add to Home Screen"</span></p>
                </div>
              </div>
              <button onClick={() => setShowAndroidModal(false)} className="w-full mt-8 py-4 bg-brand-purple text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all">გასაგებია</button>
            </div>
          </div>
        </div>
      )}

      {/* Chrome Required Modal */}
      {showChromeRequiredModal && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowChromeRequiredModal(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => setShowChromeRequiredModal(false)} className="w-10 h-10 bg-surface-soft text-text-muted hover:text-text-muted rounded-full flex items-center justify-center transition-colors"><X size={18} /></button>
              </div>
              
              <h3 className="text-2xl font-black text-text-main tracking-tighter mb-2 italic">საჭიროა Google Chrome</h3>
              <p className="text-text-muted text-sm font-medium mb-6">
                აპის დაინსტალირებისთვის საჭიროა <strong className="text-text-main">Google Chrome</strong> ბრაუზერის გამოყენება.
                {browserName && <span className="text-amber-600"> ({browserName} ბრაუზერი ამ ფუნქციას არ უჭერს მხარს)</span>}
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <Globe size={22} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-text-main uppercase mb-1">ნაბიჯი 1</p>
                      <p className="text-[11px] font-bold text-text-muted">გახსენით ეს ბმული Google Chrome-ში:</p>
                      <p className="text-[11px] font-black text-brand-purple mt-2 bg-surface px-3 py-2 rounded-xl border border-blue-500/20 break-all select-all">dentalclinicweb.vercel.app</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-surface-soft rounded-2xl border border-border-main">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <Download size={22} className="text-brand-purple" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-text-main uppercase mb-1">ნაბიჯი 2</p>
                      <p className="text-[11px] font-bold text-text-muted">Chrome-ში დააჭირეთ <span className="text-brand-purple font-black">⋮ მენიუს</span> და აირჩიეთ <span className="text-brand-purple font-black">"მთავარ ეკრანზე დამატება"</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowChromeRequiredModal(false)} className="flex-1 py-4 bg-brand-deep text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">
                  გასაგებია
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
