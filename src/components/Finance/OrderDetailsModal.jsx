import React, { useState, useEffect } from 'react';
import { 
  X, Receipt, User, Stethoscope, Calendar, CreditCard, 
  Printer, CheckCircle2, ShieldCheck, Tag, FileText, 
  Layers, Package, AlertCircle, Loader2 
} from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../utils/activityLogger';

const OrderDetailsModal = ({ isOpen, onClose, order, onPrint, isPrinting, onOrderUpdated }) => {
  useLockBodyScroll(isOpen);
  const { userData, activeStaff } = useAuth();

  const [isRepaying, setIsRepaying] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("cash");
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  useEffect(() => {
    if (order?.debtAmount) {
      setRepayAmount(Number(order.debtAmount).toFixed(2));
    }
    setIsRepaying(false);
  }, [order?.id, order?.debtAmount]);

  if (!isOpen || !order) return null;

  const handleConfirmRepayment = async () => {
    const payVal = parseFloat(repayAmount);
    const currentDebt = Number(order.debtAmount || 0);
    if (isNaN(payVal) || payVal <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი თანხა");
      return;
    }
    if (payVal > currentDebt) {
      alert(`თანხა არ უნდა აღემატებოდეს დარჩენილ ვალს (${currentDebt.toFixed(2)} ₾)`);
      return;
    }

    setIsSubmittingRepay(true);
    try {
      const newPaidAmount = Number(order.paidAmount || 0) + payVal;
      const newDebtAmount = Math.max(0, currentDebt - payVal);

      const appointmentRef = doc(db, "appointments", order.id);
      await updateDoc(appointmentRef, {
        paidAmount: newPaidAmount,
        debtAmount: newDebtAmount,
        lastDebtRepayment: {
          amount: payVal,
          method: repayMethod,
          date: new Date().toISOString()
        }
      });

      await logActivity(
        order.clinicId || userData?.clinicId,
        activeStaff || userData,
        'debt_repayment',
        `დაიფარა ვალი: ${order.patientName} (${payVal}₾, დარჩა: ${newDebtAmount.toFixed(2)}₾)`,
        { appointmentId: order.id, repaidAmount: payVal, remainingDebt: newDebtAmount }
      );

      setIsRepaying(false);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, paidAmount: newPaidAmount, debtAmount: newDebtAmount });
      }
    } catch (err) {
      console.error("Error updating debt:", err);
      alert("დაფიქსირდა შეცდომა ვალის დაფარვისას");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const servicesAmount = order.billedServices?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0;
  const materialsAmount = order.extraMaterials?.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0) || 0;
  const vatAmount = Number(order.vatAmount || 0);

  const paymentMethodLabels = {
    cash: '💵 ნაღდი ანგარიშსწორება',
    card: '💳 საბანკო ბარათი',
    transfer: '🏦 საბანკო გადარიცხვა'
  };

  const payerTypeLabels = {
    personal: 'პერსონალური (პირადი)',
    insurance: 'სადაზღვევო კომპანია',
    corporate: 'კორპორატიული'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-nino overscroll-none">
      <div 
        className="app-overlay fixed inset-0 touch-none" 
        onClick={onClose} 
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true" 
      />

      <div className="app-sheet relative w-full max-w-2xl bg-surface rounded-[28px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200 overscroll-contain">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-surface-soft/60 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shadow-xs">
              <Receipt size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-text-main italic tracking-tight">
                  შეკვეთის დეტალები
                </h3>
                {Number(order.debtAmount || 0) > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    ვალი: {Number(order.debtAmount).toFixed(2)} ₾
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    სრულად გადახდილი
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mt-1">
                #ORD-{order.id?.slice(-8).toUpperCase()} • {order.finalizedAt ? new Date(order.finalizedAt).toLocaleDateString("ka-GE", { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-text-muted hover:text-text-main hover:bg-surface rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          
          {/* Patient & Doctor Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-soft rounded-2xl border border-border-main space-y-1">
              <div className="flex items-center gap-2 text-text-muted">
                <User size={14} className="text-brand-purple" />
                <span className="text-[10px] font-black uppercase tracking-widest">პაციენტი</span>
              </div>
              <p className="text-sm font-black text-text-main">{order.patientName || "უცნობი"}</p>
              {order.personalId && (
                <p className="text-[10px] font-bold text-text-muted uppercase">პ/ნ: {order.personalId}</p>
              )}
            </div>

            <div className="p-4 bg-surface-soft rounded-2xl border border-border-main space-y-1">
              <div className="flex items-center gap-2 text-text-muted">
                <Stethoscope size={14} className="text-brand-purple" />
                <span className="text-[10px] font-black uppercase tracking-widest">ექიმი</span>
              </div>
              <p className="text-sm font-black text-text-main">{order.doctorName || "ექიმი"}</p>
              {order.ehrId && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md mt-0.5">
                  <ShieldCheck size={11} /> EHR ID: #{order.ehrId}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method & Payer Type */}
          <div className="p-4 bg-surface-soft rounded-2xl border border-border-main grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                გადახდის მეთოდი
              </p>
              <span className="inline-block px-3 py-1.5 bg-surface text-brand-purple font-black text-xs rounded-xl border border-border-main shadow-xs">
                {paymentMethodLabels[order.paymentMethod] || order.paymentMethod || 'უცნობი'}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                გადამხდელის ტიპი
              </p>
              <span className="inline-block px-3 py-1.5 bg-surface text-text-main font-black text-xs rounded-xl border border-border-main shadow-xs">
                {payerTypeLabels[order.payerType] || order.payerType || 'პერსონალური'}
              </span>
              {order.insuranceInfo && (
                <p className="text-[10px] font-bold text-text-muted mt-1">
                  კომპანია: {order.insuranceInfo.provider || order.insuranceInfo.name || "---"}
                </p>
              )}
            </div>
          </div>

          {/* Billed Services Table */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} className="text-brand-purple" />
              ჩატარებული მომსახურებები ({order.billedServices?.length || 0})
            </p>
            
            <div className="bg-surface rounded-2xl border border-border-main overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-soft/60 border-b border-border-main">
                  <tr>
                    <th className="py-3 px-4 text-[10px] font-black text-text-muted uppercase tracking-wider">მომსახურება</th>
                    <th className="py-3 px-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">ფასი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {order.billedServices && order.billedServices.length > 0 ? (
                    order.billedServices.map((service, idx) => (
                      <tr key={idx} className="hover:bg-surface-soft/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-text-main">
                          {service.name}
                        </td>
                        <td className="py-3.5 px-4 font-black text-text-main text-right">
                          {Number(service.price || 0).toFixed(2)} ₾
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-4 px-4 text-center text-text-muted italic text-[11px]">
                        მომსახურებები მითითებული არ არის
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extra Materials (if any) */}
          {order.extraMaterials && order.extraMaterials.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-brand-purple" />
                დამატებითი მასალები ({order.extraMaterials.length})
              </p>
              
              <div className="bg-surface rounded-2xl border border-border-main overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft/60 border-b border-border-main">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-black text-text-muted uppercase tracking-wider">მასალა</th>
                      <th className="py-2.5 px-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-center">რაოდ.</th>
                      <th className="py-2.5 px-4 text-[10px] font-black text-text-muted uppercase tracking-wider text-right">ჯამი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {order.extraMaterials.map((mat, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-bold text-text-main">{mat.name}</td>
                        <td className="py-3 px-4 text-center text-text-muted font-bold">{mat.amount} {mat.unit || ''}</td>
                        <td className="py-3 px-4 font-black text-text-main text-right">
                          {(Number(mat.amount) * Number(mat.pricePerUnit || 0)).toFixed(2)} ₾
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Breakdown Card */}
          <div className="p-5 bg-gradient-to-br from-surface to-surface-soft rounded-2xl border border-border-main space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted font-bold">მომსახურების ჯამი:</span>
              <span className="font-black text-text-main">{servicesAmount.toFixed(2)} ₾</span>
            </div>

            {materialsAmount > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-bold">დამატებითი მასალები:</span>
                <span className="font-black text-text-main">{materialsAmount.toFixed(2)} ₾</span>
              </div>
            )}

            {vatAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-500 font-bold">
                <span>დღგ (18%):</span>
                <span className="font-black">{vatAmount.toFixed(2)} ₾</span>
              </div>
            )}

            <div className="pt-3 border-t border-border-main space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-text-muted">სულ გადასახდელი:</span>
                <span className="font-black text-text-main text-sm">{Number(order.price || 0).toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-emerald-600 dark:text-emerald-400">ფაქტობრივად გადახდილი:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {Number(order.paidAmount !== undefined ? order.paidAmount : order.price || 0).toFixed(2)} ₾
                </span>
              </div>
              {Number(order.debtAmount || 0) > 0 && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-red-600 uppercase tracking-wider">
                      დარჩენილი ვალი:
                    </span>
                    <span className="text-base font-black text-red-600">
                      {Number(order.debtAmount).toFixed(2)} ₾
                    </span>
                  </div>

                  {!isRepaying ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRepayAmount(Number(order.debtAmount || 0).toFixed(2));
                        setIsRepaying(true);
                      }}
                      className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/20 active:scale-95"
                    >
                      <CreditCard size={14} />
                      <span>ვალის დაფარვა / თანხის შეტანა</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-surface rounded-xl border border-border-main space-y-3 animate-in fade-in duration-200">
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        თანხის შეტანა ვალის დასაფარად
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-text-muted uppercase">თანხა (₾)</label>
                          <input
                            type="number"
                            min="0.01"
                            max={Number(order.debtAmount)}
                            step="0.01"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-soft border border-border-main rounded-xl text-xs font-black text-text-main outline-none focus:border-brand-purple"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-text-muted uppercase">მეთოდი</label>
                          <select
                            value={repayMethod}
                            onChange={(e) => setRepayMethod(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-soft border border-border-main rounded-xl text-xs font-bold text-text-main outline-none focus:border-brand-purple cursor-pointer"
                          >
                            <option value="cash">💵 ნაღდი</option>
                            <option value="card">💳 ბარათი</option>
                            <option value="transfer">🏦 გადარიცხვა</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRepaying(false)}
                          disabled={isSubmittingRepay}
                          className="flex-1 py-2 bg-surface-soft text-text-muted hover:text-text-main rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                        >
                          გაუქმება
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmRepayment}
                          disabled={isSubmittingRepay || !repayAmount || Number(repayAmount) <= 0}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingRepay ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          <span>{isSubmittingRepay ? "მუშავდება..." : "დადასტურება"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes if any */}
          {(order.treatmentNotes || order.notes || order.comment) && (
            <div className="p-4 bg-surface-soft rounded-2xl border border-border-main space-y-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                შენიშვნა / კომენტარი
              </p>
              <p className="text-xs text-text-main font-bold leading-relaxed">
                {order.treatmentNotes || order.notes || order.comment}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] bg-surface-soft/60 border-t border-border-main flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-surface hover:bg-surface-soft border border-border-main rounded-xl text-xs font-black uppercase tracking-wider text-text-muted hover:text-text-main transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            დახურვა
          </button>

          <button
            disabled={isPrinting}
            onClick={() => onPrint(order)}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-deep text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg shadow-brand-purple/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Printer size={16} />
            <span>ინვოისის ბეჭდვა</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsModal;
