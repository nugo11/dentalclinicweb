import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download, Smartphone, Info } from 'lucide-react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroidDevice = /Android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) return;

    // Android / Chrome "Add to Home Screen" listener
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner for iOS if not standalone
    if (isIOSDevice && !isStandalone) {
      setShowBanner(true);
    }

    // Force show banner for Android if not standalone after 3 seconds (as fallback)
    if (isAndroidDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
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
      // Fallback for Android if beforeinstallprompt didn't fire
      setShowAndroidModal(true);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Mobile Banner - Sticky Bottom */}
      <div className="fixed bottom-6 left-4 right-4 z-[60] md:hidden animate-in slide-in-from-bottom-10 duration-500">
        <div className="bg-brand-deep/95 backdrop-blur-xl border border-white/10 rounded-[28px] p-4 shadow-2xl shadow-brand-deep/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Download className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-white text-sm font-black tracking-tight leading-tight">დააინსტალირე DentalHub</h4>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">სწრაფი წვდომისთვის</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-deep transition-all active:scale-95 shadow-lg shadow-brand-purple/20"
            >
              ინსტალაცია
            </button>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowIOSModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                <button onClick={() => setShowIOSModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full"><X size={20} /></button>
              </div>

              <h3 className="text-2xl font-black text-brand-deep tracking-tighter mb-2 italic">ინსტალაცია iPhone-ზე</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">მიჰყევით ამ ნაბიჯებს DentalHub-ის დასამატებლად:</p>

              <div className="space-y-8">
                {[
                  { step: "1", text: "დააჭირეთ '...' (სამ წერტილს)", img: "/ios_app/step1.jpg" },
                  { step: "2", text: "აირჩიეთ 'Share' ღილაკი", img: "/ios_app/step2.jpg" },
                  { step: "3", text: "ჩამოსქროლეთ და აირჩიეთ 'View More'", img: "/ios_app/step3.jpg" },
                  { step: "4", text: "დააჭირეთ 'Add to Home Screen'-ს", img: "/ios_app/step4.jpg" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center">{item.step}</span>
                      <p className="text-[12px] font-black text-brand-deep uppercase tracking-tight">{item.text}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <img src={item.img} alt={`Step ${item.step}`} className="w-full h-auto" />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowIOSModal(false)} className="w-full mt-8 py-4 bg-brand-deep text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">გასაგებია</button>
            </div>
          </div>
        </div>
      )}

      {/* Android Manual Instruction Modal */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAndroidModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                <button onClick={() => setShowAndroidModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full"><X size={20} /></button>
              </div>
              <h3 className="text-2xl font-black text-brand-deep tracking-tighter mb-2 italic">ინსტალაცია Android-ზე</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">თუ ინსტალაციის ფანჯარა არ გამოჩნდა ავტომატურად:</p>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                  <p className="text-[12px] font-bold text-brand-deep uppercase">დააჭირეთ Chrome-ის მენიუს <span className="text-brand-purple">(სამ წერტილს ზედა მარჯვენა კუთხეში)</span></p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                  <p className="text-[12px] font-bold text-brand-deep uppercase">აირჩიეთ <span className="text-brand-purple">"Install app"</span> ან <span className="text-brand-purple">"Add to Home screen"</span></p>
                </div>
              </div>
              <button onClick={() => setShowAndroidModal(false)} className="w-full mt-8 py-4 bg-brand-deep text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">გასაგებია</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
