import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Clock, Calendar, ChevronRight, Activity, Inbox, X } from 'lucide-react';

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);

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

  if (loading) return <div className="p-8 text-center text-text-muted animate-pulse font-black uppercase text-[10px]">იტვირთება...</div>;

  return (
    <div className="bg-surface rounded-[40px] p-8 border border-border-main shadow-sm relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
        <h3 className="text-xl font-black text-text-main italic tracking-tighter flex items-center gap-2">
          <Activity className="text-brand-purple" size={20} /> ვიზიტების ისტორია
        </h3>
        <span className="text-[10px] font-black text-brand-purple bg-brand-purple/10 px-3 py-1 rounded-lg uppercase tracking-widest shrink-0">სულ: {history.length}</span>
      </div>

      {/* კონტეინერი ფიქსირებული სიმაღლით და სქროლით */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {history.length > 0 ? (
          history.map((visit) => {
            const isPast = new Date(visit.start) < new Date();
            
            return (
              <div 
                key={visit.id} 
                onClick={() => setSelectedVisit(visit)}
                className="bg-surface-soft/50 border border-transparent p-4 rounded-[20px] hover:bg-surface hover:border-brand-purple/10 hover:shadow-xl transition-all group flex items-center gap-3 relative cursor-pointer"
              >
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${isPast ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600 group-hover:bg-brand-purple group-hover:text-white'}`}>
                  <Calendar size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-xs font-black text-text-main truncate group-hover:text-brand-purple transition-colors">
                      {visit.service}
                    </p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isPast ? 'დასრულებული' : 'მომავალი'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-text-muted font-bold uppercase tracking-widest flex-wrap">
                    <span>{new Date(visit.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="w-1 h-1 rounded-full bg-border-main shrink-0"></span>
                    <span>{new Date(visit.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
                    {visit.duration && (
                       <>
                          <span className="w-1 h-1 rounded-full bg-border-main shrink-0"></span>
                          <span>{visit.duration} წთ</span>
                       </>
                    )}
                  </div>
                </div>

                <ChevronRight size={18} className="text-text-muted shrink-0 group-hover:text-brand-purple group-hover:translate-x-1 transition-all" />
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
      <div className="absolute right-[-5%] bottom-[-5%] w-64 h-64 bg-surface-soft rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Visit Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => setSelectedVisit(null)} />
            <div className="bg-surface rounded-[32px] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center mb-4">
                            <Calendar size={20} />
                        </div>
                        <h3 className="text-xl font-black text-text-main italic pr-4">{selectedVisit.service}</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                            {new Date(selectedVisit.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button 
                        onClick={() => setSelectedVisit(null)}
                        className="p-2 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    <div className="bg-surface-soft p-4 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">საათი</span>
                        <span className="text-sm font-black text-text-main">
                            {new Date(selectedVisit.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {selectedVisit.duration && (
                        <div className="bg-surface-soft p-4 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">ხანგრძლივობა</span>
                            <span className="text-xs font-black text-text-main">{selectedVisit.duration} წთ</span>
                        </div>
                    )}

                    {selectedVisit.doctorName && (
                        <div className="bg-surface-soft p-4 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">ექიმი</span>
                            <span className="text-xs font-black text-text-main">{selectedVisit.doctorName}</span>
                        </div>
                    )}

                    {/* Services */}
                    {selectedVisit.billedServices?.length > 0 && (
                        <div className="bg-surface-soft p-4 rounded-2xl border border-border-main">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-3">ჩატარებული მომსახურება</span>
                            <div className="space-y-2">
                                {selectedVisit.billedServices.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-text-main font-bold">{s.name}</span>
                                        <span className="text-brand-purple font-black">{s.price} ₾</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Materials */}
                    {selectedVisit.extraMaterials?.length > 0 && (
                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-3">გახარჯული მასალები</span>
                            <div className="space-y-2">
                                {selectedVisit.extraMaterials.map((m, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-text-main font-bold">{m.name} <span className="text-text-muted ml-1">x{m.amount}</span></span>
                                        <span className="text-amber-600 font-black">{(Number(m.amount) * Number(m.pricePerUnit || 0)).toFixed(2)} ₾</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Financials */}
                    {selectedVisit.price !== undefined && (
                        <div className="bg-brand-deep p-5 rounded-2xl text-white shadow-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">ჯამური ღირებულება</span>
                                <span className="text-sm font-black">{selectedVisit.price} ₾</span>
                            </div>
                            {selectedVisit.paidAmount !== undefined && (
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">გადახდილი თანხა</span>
                                    <span className="text-sm font-black text-emerald-400">{selectedVisit.paidAmount} ₾</span>
                                </div>
                            )}
                            {selectedVisit.paymentMethod && (
                                <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">გადახდის მეთოდი</span>
                                    <span className="text-xs font-black uppercase">
                                        {selectedVisit.paymentMethod === 'cash' ? 'ნაღდი' : selectedVisit.paymentMethod === 'card' ? 'ბარათი' : selectedVisit.paymentMethod === 'transfer' ? 'გადმორიცხვა' : selectedVisit.paymentMethod}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedVisit.notes && (
                        <div className="bg-surface-soft p-4 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">შენიშვნა</span>
                            <p className="text-sm font-bold text-text-main">{selectedVisit.notes}</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setSelectedVisit(null)}
                    className="w-full mt-8 py-4 bg-surface-soft text-text-main rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-border-main transition-all cursor-pointer"
                >
                    დახურვა
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;