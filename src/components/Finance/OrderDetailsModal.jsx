import { 
  X, Receipt, User, Stethoscope, Calendar, CreditCard, 
  Printer, CheckCircle2, ShieldCheck, Tag, FileText, 
  Layers, Package, AlertCircle 
} from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const OrderDetailsModal = ({ isOpen, onClose, order, onPrint, isPrinting }) => {
  useLockBodyScroll(isOpen);

  if (!isOpen || !order) return null;

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
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-text-main italic tracking-tight">
                  შეკვეთის დეტალები
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  დასრულებული
                </span>
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

            <div className="pt-3 border-t border-border-main flex justify-between items-center">
              <span className="font-black text-xs uppercase tracking-wider text-text-main">
                სულ გადახდილი თანხა:
              </span>
              <span className="text-2xl font-black text-brand-purple italic tracking-tight">
                {Number(order.price || 0).toFixed(2)} ₾
              </span>
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
