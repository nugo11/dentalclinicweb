import React from 'react';
import { ChevronRight, Clock, FileText, Printer, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentTreatments = ({ appointments = [] }) => {
  const navigate = useNavigate();

  // ვიღებთ ბოლო 5 დასრულებულ და ჩახურულ ჩანაწერს
  const archived = appointments
    .filter(apt => apt.status === 'completed_and_billed')
    .sort((a, b) => new Date(b.finalizedAt || b.createdAt || 0) - new Date(a.finalizedAt || a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="bg-surface p-5 rounded-[32px] border border-border-dark/60 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="font-black text-text-main uppercase tracking-tighter text-[11px] italic">არქივი</h3>
          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">ბოლო 5 ინვოისი</p>
        </div>
        <button 
          onClick={() => navigate('/archive')}
          className="p-1.5 hover:bg-surface-soft rounded-xl text-brand-purple transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {archived.length > 0 ? (
          archived.map((apt) => (
            <div 
              key={apt.id} 
              className="flex items-center gap-3 p-2.5 rounded-2xl border border-transparent hover:border-brand-purple/10 hover:bg-surface-soft/50 transition-all cursor-pointer group"
              onClick={() => navigate('/archive')}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-text-main truncate uppercase tracking-tight">
                  {apt.patientName}
                </p>
                <div className="flex items-center gap-2 text-[8px] font-bold text-text-muted">
                  <span>{new Date(apt.finalizedAt || apt.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })}</span>
                  <span className="w-1 h-1 bg-surface-soft rounded-full"></span>
                  <span className="text-brand-purple">₾{apt.price}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/archive'); }}
                  className="p-2 bg-surface-soft text-text-muted hover:text-blue-500 rounded-lg transition-all"
                  title="ჩამოტვირთვა"
                >
                  <FileText size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/archive'); }}
                  className="p-2 bg-surface-soft text-text-muted hover:text-brand-purple rounded-lg transition-all"
                  title="ბეჭდვა"
                >
                  <Printer size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-[9px] font-bold text-text-muted uppercase">არქივი ცარიელია</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/archive')}
        className="w-full mt-4 py-3 bg-surface-soft hover:bg-brand-purple hover:text-white rounded-xl text-[9px] font-black text-text-muted uppercase tracking-widest transition-all"
      >
        სრული რეესტრი
      </button>
    </div>
  );
};

export default RecentTreatments;
