import React from 'react';
import { ChevronRight, Clock, User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentTreatments = ({ appointments = [] }) => {
  const navigate = useNavigate();

  // ვიღებთ ბოლო 4 ჩანაწერს
  const recent = appointments
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-brand-deep uppercase tracking-tighter text-sm">ბოლო ვიზიტები</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ბოლო აქტივობები</p>
        </div>
        <button 
          onClick={() => navigate('/treatments')}
          className="p-2 hover:bg-slate-50 rounded-xl text-brand-purple transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {recent.length > 0 ? (
          recent.map((apt) => (
            <div 
              key={apt.id} 
              className="flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/patients/${apt.patientId}`)}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all">
                <Activity size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-brand-deep truncate uppercase tracking-tight">
                  {apt.patientName || "უცნობი პაციენტი"}
                </p>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                  <Clock size={10} />
                  <span>{apt.time || "12:00"}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="truncate">{apt.treatment || "კონსულტაცია"}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
              <Activity size={24} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">ვიზიტები არ მოიძებნა</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/treatments')}
        className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-brand-purple hover:text-brand-purple transition-all"
      >
        ყველა ჩანაწერის ნახვა
      </button>
    </div>
  );
};

export default RecentTreatments;
