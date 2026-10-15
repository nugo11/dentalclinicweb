import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, ChevronRight, X, ShieldAlert, Sparkles } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const CriticalAlertsWidget = ({ role, clinicData }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useLockBodyScroll(isOpen);

  const criticalItems = [];

  // 1. Missing EHR Credentials
  if ((role === 'admin' || role === 'manager') && (!clinicData?.ehrUsername || !clinicData?.ehrPassword)) {
    criticalItems.push({
      id: 'ehr',
      title: 'EHR მონაცემები არ არის შეყვანილი!',
      desc: 'თქვენ არ გაქვთ შეყვანილი EHR მონაცემები და ვერ შეძლებთ ჯანდაცვის სამინისტროს სისტემაში (ფორმა 100) სინქრონიზაციას.',
      actionText: 'EHR ავტორიზაცია',
      path: '/settings',
      icon: AlertTriangle,
    });
  }

  // 2. Missing Phone Number
  if (role === 'admin' && clinicData?.plan !== 'free' && !clinicData?.phone) {
    criticalItems.push({
      id: 'phone',
      title: 'საკონტაქტო ნომერი არ არის დამატებული!',
      desc: 'SMS შეტყობინებების გასაგზავნად და პაციენტებთან კომუნიკაციისთვის აუცილებელია კლინიკის ოფიციალური ნომრის მითითება.',
      actionText: 'პორტფოლიოში გადასვლა',
      path: '/settings/portfolio',
      icon: Phone,
    });
  }

  if (criticalItems.length === 0) return null;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 overscroll-none touch-action-none" 
          onClick={() => setIsOpen(false)} 
        />
      )}
      <div 
        className="fixed right-4 sm:right-8 z-50 font-nino"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Floating Alert Trigger Pill */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full shadow-2xl shadow-red-600/50 border-2 border-white/25 hover:shadow-red-600/70 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-90 duration-300"
            aria-label="კრიტიკული მოთხოვნები"
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>

            <ShieldAlert size={20} className="text-white animate-pulse" />
            
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs font-black tracking-wide uppercase">
                კრიტიკული მოთხოვნა
              </span>
              <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {criticalItems.length}
              </span>
            </div>
          </button>
        )}

        {/* Expanded Critical Modal / Popover */}
        {isOpen && (
          <div className="w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] bg-surface rounded-[32px] shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] border-2 border-red-500/30 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 relative z-50">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-transparent border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-red-600 text-sm uppercase tracking-tight">
                    კრიტიკული მოთხოვნა
                  </h4>
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {criticalItems.length} აუცილებელი
                  </span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                  სისტემის სრულფასოვანი მუშაობისთვის
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-text-muted hover:text-text-main hover:bg-surface-soft rounded-xl transition-all cursor-pointer"
              title="ჩაკეცვა"
            >
              <X size={18} />
            </button>
          </div>

          {/* Alert Cards List */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {criticalItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ItemIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-black text-text-main text-xs leading-tight">
                        {item.title}
                      </h5>
                      <p className="text-[11px] font-bold text-text-muted leading-relaxed mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate(item.path);
                    }}
                    className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-red-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{item.actionText}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3.5 bg-surface-soft/60 border-t border-border-main flex items-center justify-between text-[10px] font-bold text-text-muted">
            <span>შეავსეთ მონაცემები გაფრთხილების მოსაშორებლად</span>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default CriticalAlertsWidget;
