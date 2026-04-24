import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download, Smartphone, Info } from 'lucide-react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) return;

    // Android / Chrome "Add to Home Screen" listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    });

    // Show banner for iOS if not standalone
    if (isIOSDevice && !isStandalone) {
      setShowBanner(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      setShowBanner(false);
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
          <div 
            className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowIOSModal(false)}
          />
          
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <button 
                  onClick={() => setShowIOSModal(false)}
                  className="p-2 bg-slate-50 text-slate-400 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-brand-deep tracking-tighter mb-4 italic">ინსტალაცია iPhone-ზე</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                DentalHub-ის აპლიკაციად დასამატებლად მიჰყევით ამ მარტივ ნაბიჯებს:
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all">
                    <Share size={20} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-deep uppercase tracking-tight">
                    1. დააჭირეთ <span className="text-brand-purple">"Share"</span> ღილაკს ბრაუზერში
                  </p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all">
                    <PlusSquare size={20} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-deep uppercase tracking-tight">
                    2. აირჩიეთ <span className="text-brand-purple">"Add to Home Screen"</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all">
                    <Info size={20} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-deep uppercase tracking-tight">
                    3. დააჭირეთ <span className="text-brand-purple">"Add"</span> ზედა კუთხეში
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-10 py-4 bg-brand-deep text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-purple transition-all active:scale-95 shadow-xl shadow-brand-deep/20"
              >
                გასაგებია
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
