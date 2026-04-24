import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Wallet, Bell, CheckCircle2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../utils/activityLogger';

const SalaryReminder = ({ staff = [], paidStaffIds = [] }) => {
  const { userData, activeStaff } = useAuth();
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, member: null, amount: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().getDate();
  
  const getDaysUntil = (payDay) => {
    if (payDay === today) return 0;
    if (payDay > today) return payDay - today;
    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return (lastDayOfMonth - today) + payDay;
  };

  const allSalaries = staff
    .filter(member => (member.salaryAmount > 0 || member.salaryType === 'commission') && member.role !== 'admin')
    .map(member => {
      const payDay = Number(member.salaryPayDay) || 1;
      const daysUntil = getDaysUntil(payDay);
      const isToday = daysUntil === 0;
      const isApproaching = daysUntil > 0 && daysUntil <= 3;
      const isPaid = paidStaffIds.includes(member.id);
      
      return { ...member, payDay, daysUntil, isToday, isApproaching, isPaid };
    })
    .filter(member => !(member.isPaid && !member.isToday))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const displaySalaries = allSalaries.slice(0, 3);

  const handleStartPayment = (member) => {
    if (member.isPaid) return;
    setPaymentModal({ 
      isOpen: true, 
      member, 
      amount: member.salaryType === 'fixed' ? member.salaryAmount.toString() : "" 
    });
  };

  const handleConfirmPayment = async () => {
    const { member, amount } = paymentModal;
    if (!member) return;
    
    const amountToPay = Number(amount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("გთხოვთ შეიყვანოთ ვალიდური თანხა");
      return;
    }

    setIsProcessing(true);
    try {
      const newFinanceDoc = await addDoc(collection(db, "finance"), {
        clinicId: userData.clinicId,
        type: 'expense',
        category: 'ხელფასი',
        amount: amountToPay,
        description: `ხელფასი: ${member.fullName} (${member.salaryType === 'commission' ? 'გამომუშავება' : 'ფიქსირებული'})`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        staffId: member.id,
        paidMonth: new Date().toISOString().slice(0, 7)
      });

      // LOG ACTIVITY
      await logActivity(userData.clinicId, activeStaff || userData, 'salary_payment', `გაიცა ხელფასი: ${member.fullName} (თანხა: ${amountToPay}₾)`, { financeId: newFinanceDoc.id, staffId: member.id, amount: amountToPay });

      setPaymentModal({ isOpen: false, member: null, amount: "" });
    } catch (error) {
      console.error("Error paying salary:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (displaySalaries.length === 0) return null;

  return (
    <>
      <div className="bg-surface p-6 rounded-[32px] border border-border-dark/60 shadow-sm overflow-hidden relative group">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h3 className="font-black text-text-main uppercase tracking-tighter text-[11px] italic">ხელფასების შეხსენება</h3>
            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">მიმდინარე პერიოდი</p>
          </div>
          <div className="w-10 h-10 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center">
            <Wallet size={18} />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {displaySalaries.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between
                ${alert.isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 
                  alert.isToday ? 'bg-amber-500/10 border-amber-500/20 animate-pulse' : 'bg-surface-soft border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${alert.isPaid ? 'bg-emerald-500 text-white' : 
                    alert.isToday ? 'bg-amber-500 text-white' : 'bg-surface-soft text-text-muted'}`}>
                  {alert.isPaid ? <CheckCircle2 size={14} /> : alert.isToday ? <AlertCircle size={14} /> : <Wallet size={14} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-main uppercase">{alert.fullName}</p>
                  <p className={`text-[9px] font-bold uppercase ${alert.isPaid ? 'text-emerald-600' : 'text-text-muted'}`}>
                     {alert.isPaid ? 'გადახდილია' : 
                      alert.salaryType === 'commission' ? `გამომუშავება • ${alert.payDay} რიცხვი` : `₾${alert.salaryAmount} • ${alert.payDay} რიცხვი`}
                  </p>
                </div>
              </div>
              
              {!alert.isPaid && (
                <button 
                  onClick={() => handleStartPayment(alert)}
                  className={`p-2 rounded-xl transition-all
                    ${alert.isToday ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-surface text-text-muted hover:text-brand-purple'}`}
                >
                  <CheckCircle2 size={16} />
                </button>
              )}
              {alert.isPaid && (
                <div className="p-2 text-emerald-500">
                   <CheckCircle2 size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modern Payment Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} />
          <div className="bg-surface rounded-[40px] w-full max-w-sm p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <Wallet size={40} />
                </div>
                <h3 className="text-2xl font-black text-text-main italic tracking-tighter">ხელფასის გაცემა</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">{paymentModal.member?.fullName}</p>
             </div>

             <div className="space-y-6">
                <div className="space-y-3">
                   {paymentModal.member?.salaryType === 'fixed' && (
                     <div className="flex justify-between items-center px-4 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">ფიქსირებული ხელფასი</span>
                        <span className="text-sm font-black text-emerald-700">₾{paymentModal.member?.salaryAmount}</span>
                     </div>
                   )}
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">გადასახდელი თანხა (₾)</label>
                      <input 
                         type="number" 
                         autoFocus
                         className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-5 outline-none font-black text-xl text-text-main transition-all placeholder:text-text-muted"
                         value={paymentModal.amount}
                         onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                         placeholder="0.00"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                      onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })}
                      className="py-5 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-soft transition-all"
                   >
                      გაუქმება
                   </button>
                   <button 
                      onClick={handleConfirmPayment}
                      disabled={isProcessing}
                      className="py-5 bg-brand-deep text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-deep/20 hover:bg-black transition-all flex items-center justify-center"
                   >
                      {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "დადასტურება"}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalaryReminder;
