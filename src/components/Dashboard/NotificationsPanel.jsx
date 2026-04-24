import React from 'react';
import { Bell, Clock, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';

const notifications = [
  { 
    id: 1, 
    type: 'alert', 
    title: 'მარაგი იწურება', 
    desc: 'სტომატოლოგიური მასალების მარაგი (A2) 15%-ზე ნაკლებია.', 
    time: '10 წთ წინ',
    icon: AlertCircle,
    color: 'text-amber-500 bg-amber-500/10'
  },
  { 
    id: 2, 
    type: 'success', 
    title: 'გადახდა დადასტურდა', 
    desc: 'პაციენტმა ლევან კაპანაძემ დაფარა ვიზიტის ღირებულება.', 
    time: '45 წთ წინ',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  { 
    id: 3, 
    type: 'message', 
    title: 'ახალი შეტყობინება', 
    desc: 'ექ. ანა გთხოვთ გადახედოთ რენტგენის სურათს.', 
    time: '2 სთ წინ',
    icon: MessageSquare,
    color: 'text-blue-500 bg-blue-500/10'
  }
];

const NotificationsPanel = () => {
  return (
    <div className="bg-surface rounded-[40px] p-8 border border-border-main shadow-sm flex flex-col h-[450px]">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-purple/10 rounded-xl flex items-center justify-center text-brand-purple">
            <Bell size={20} />
          </div>
          <h3 className="text-xl font-black text-text-main italic">შეტყობინებები</h3>
        </div>
        <span className="bg-sale-red text-white text-[9px] font-black px-2 py-1 rounded-lg animate-pulse uppercase">3 ახალი</span>
      </div>

      {/* სკროლირებადი ნაწილი */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {notifications.map((note) => (
          <div key={note.id} className="p-5 rounded-[28px] border border-border-main hover:border-brand-purple/20 hover:bg-surface-soft transition-all group cursor-pointer">
            <div className="flex gap-4">
              <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${note.color}`}>
                <note.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-black text-text-main text-sm truncate">{note.title}</h4>
                  <span className="text-[9px] font-bold text-text-muted uppercase flex items-center gap-1">
                    <Clock size={10} /> {note.time}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted font-medium leading-relaxed line-clamp-2">
                  {note.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-border-main text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:border-brand-purple hover:text-brand-purple transition-all shrink-0">
        ყველას ნახვა
      </button>
    </div>
  );
};

export default NotificationsPanel;