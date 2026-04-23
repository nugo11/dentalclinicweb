import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Clock, Calendar, ChevronRight, Activity, Inbox } from 'lucide-react';

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", patientId)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // სორტირება კლიენტის მხარეს ინდექსის შეცდომის თავიდან ასაცილებლად
      const sorted = data.sort((a, b) => new Date(b.start) - new Date(a.start));
      setHistory(sorted);
      setLoading(false);
    }, (error) => {
      console.error("PatientHistory error:", error);
      setLoading(false);
    });
  }, [patientId]);

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse font-black uppercase text-[10px]">იტვირთება...</div>;

  return (
    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-2xl font-black text-brand-deep italic tracking-tighter flex items-center gap-3">
          <Activity className="text-brand-purple" size={24} /> ვიზიტების ისტორია
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">სულ: {history.length}</span>
        </div>
      </div>

      {/* კონტეინერი ფიქსირებული სიმაღლით და სქროლით */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
        {history.length > 0 ? (
          history.map((visit) => {
            const isPast = new Date(visit.start) < new Date();
            
            return (
              <div 
                key={visit.id} 
                className="bg-slate-50/50 border border-transparent p-6 rounded-[28px] hover:bg-white hover:border-brand-purple/10 hover:shadow-xl transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 group-hover:bg-brand-purple group-hover:text-white'}`}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-brand-deep tracking-tight group-hover:text-brand-purple transition-colors">
                        {visit.service}
                      </p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isPast ? 'დასრულებული' : 'მომავალი'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(visit.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="font-black text-xs text-brand-deep uppercase italic">
                      {new Date(visit.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                       {visit.duration} წუთი
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-200 group-hover:text-brand-purple group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center opacity-20">
             <Inbox size={48} className="mx-auto mb-4" />
             <p className="font-black text-xs uppercase tracking-widest">ისტორია ცარიელია</p>
          </div>
        )}
      </div>

      {/* დეკორატიული ფონი, რომ სქროლი ლამაზად ჩანდეს */}
      <div className="absolute right-[-5%] bottom-[-5%] w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
    </div>
  );
};

export default PatientHistory;