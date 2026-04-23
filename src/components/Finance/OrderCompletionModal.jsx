import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; // დავამატეთ auth
import {
  doc,
  updateDoc,
  collection,
  getDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  increment, // აუცილებელია ატომური ჩამოკლებისთვის
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  CreditCard,
  Receipt,
  Loader2,
  AlertTriangle,
  DollarSign,
  Users,
  Briefcase,
  FileText,
  Activity
} from "lucide-react";

const OrderCompletionModal = ({ isOpen, onClose, orderData }) => {
  const { role, activeStaff, userData } = useAuth();
  
  // ჩახურვის უფლება: ადმინს, მენეჯერს და რეგისტრატორს შეუძლიათ ყველასი. 
  // ექიმს შეუძლია მხოლოდ თავისი შეკვეთის ჩახურვა.
  // ბუღალტერი რჩება მხოლოდ ნახვის რეჟიმში.
  const canFinalize = 
    role === 'admin' || 
    role === 'manager' || 
    role === 'receptionist' || 
    (role === 'doctor' && orderData.doctorId === (activeStaff?.id || userData?.uid));

  const isReadOnly = !canFinalize;
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customService, setCustomService] = useState({ name: "", price: "" });
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // შეცდომის state
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash, card, transfer
  const [payerType, setPayerType] = useState("personal"); // personal, insurance, corporate
  const [insuranceInfo, setInsuranceInfo] = useState({ company: "", policyNum: "", approvalCode: "" });
  const [customServiceErrors, setCustomServiceErrors] = useState({ name: false, price: false });

  // 1. წამოვიღოთ სერვისების კატალოგი
  useEffect(() => {
    if (isOpen && orderData?.clinicId) {
      const q = query(
        collection(db, "services"),
        where("clinicId", "==", orderData.clinicId),
      );
      return onSnapshot(q, (snapshot) => {
        setAvailableServices(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      });
    }
  }, [isOpen, orderData]);

  // 2. სერვისების მართვა
  const addService = (service) => {
    const newService = { ...service, uniqueId: Date.now() };
    setSelectedServices([...selectedServices, newService]);
    setPaidAmount((prev) => Number(prev) + Number(service.price));
  };

  const addCustomService = () => {
    const errors = {
      name: !customService.name,
      price: !customService.price
    };

    if (errors.name || errors.price) {
      setCustomServiceErrors(errors);
      // წავშალოთ ერორები 1 წამში
      setTimeout(() => setCustomServiceErrors({ name: false, price: false }), 1000);
      return;
    }

    addService({
      name: customService.name,
      price: Number(customService.price),
    });
    setCustomService({ name: "", price: "" });
    setCustomServiceErrors({ name: false, price: false });
  };

  const removeService = (uniqueId) => {
    const serviceToRemove = selectedServices.find(
      (s) => s.uniqueId === uniqueId,
    );
    if (!serviceToRemove) return;

    setSelectedServices(
      selectedServices.filter((s) => s.uniqueId !== uniqueId),
    );
    setPaidAmount((prev) =>
      Math.max(0, Number(prev) - Number(serviceToRemove.price)),
    );
  };

  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + Number(s.price),
    0,
  );

  const handleDeleteOrder = async () => {
    if (
      window.confirm("დარწმუნებული ხართ, რომ გსურთ ამ შეკვეთის/ჯავშნის წაშლა?")
    ) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "appointments", orderData.id));
        onClose();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 3. შეკვეთის დასრულება და საწყობის ჩამოჭრა
  const handleFinalize = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("ავტორიზაცია საჭიროა");

      let totalMaterialCost = 0;

      // 1. ჯერ ამოვიღოთ ყველა მასალის ფასი საწყობიდან და დავთვალოთ ხარჯი
      for (const service of selectedServices) {
        if (service.materials && Array.isArray(service.materials)) {
          for (const mat of service.materials) {
            const matDoc = await getDoc(doc(db, "inventory", mat.id));
            if (matDoc.exists()) {
              const pricePerUnit = Number(matDoc.data().pricePerUnit || 0);
              totalMaterialCost += Number(mat.amount) * pricePerUnit;
            }
          }
        }
      }

      // 2. ჯავშნის განახლება
      const appointmentRef = doc(db, "appointments", orderData.id);
        await updateDoc(appointmentRef, {
          status: "completed_and_billed",
          billedServices: selectedServices,
          price: totalAmount,
          paidAmount: Number(paidAmount),
          materialCost: totalMaterialCost,
          paymentMethod: paymentMethod,
          payerType: payerType,
          insuranceInfo: payerType === 'insurance' ? insuranceInfo : null,
          finalizedAt: new Date().toISOString(),
        });

      // 3. საწყობის განახლება - აქ არის კრიტიკული ნაწილი!
      const inventoryUpdates = [];
      for (const service of selectedServices) {
        if (service.materials && Array.isArray(service.materials)) {
          for (const mat of service.materials) {
            // ვამოწმებთ, რომ mat.id ნამდვილად არსებობს
            if (mat.id) {
              const materialRef = doc(db, "inventory", mat.id);

              // ვიყენებთ increment-ს.
              // ყურადღება: დარწმუნდი, რომ mat.amount არის რიცხვი
              inventoryUpdates.push(
                updateDoc(materialRef, {
                  quantity: increment(-(Number(mat.amount) || 0)),
                }),
              );
              console.log(
                `გაიგზავნა მოთხოვნა: ${mat.name}-ს აკლდება ${mat.amount}`,
              );
            }
          }
        }
      }

      // ველოდებით ყველა მოთხოვნის დასრულებას
      if (inventoryUpdates.length > 0) {
        await Promise.all(inventoryUpdates);
      }

      onClose();
    } catch (err) {
      console.error("Finalize error details:", err);
      setError("საწყობის განახლებისას მოხდა შეცდომა.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        className="app-overlay fixed inset-0 bg-brand-deep/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="app-sheet bg-white rounded-t-[28px] md:rounded-[40px] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden font-nino flex flex-col max-h-[92vh] md:max-h-[90vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-brand-deep italic">
                ანგარიშსწორება
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                პაციენტი: {orderData.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* მარცხენა მხარე: სერვისების არჩევა */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                აირჩიე კატალოგიდან
              </label>
              <select
                disabled={isReadOnly}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-slate-900 border-2 border-transparent focus:border-brand-purple transition-all cursor-pointer"
                onChange={(e) => {
                  const s = availableServices.find(
                    (serv) => serv.id === e.target.value,
                  );
                  if (s) addService(s);
                  e.target.value = ""; // Reset select
                }}
              >
                <option value="">+ მომსახურების დამატება</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.price}₾
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6 bg-slate-50 rounded-[32px] space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                სხვა მომსახურება (ხელით)
              </label>
              <input
                type="text"
                placeholder="დასახელება"
                disabled={isReadOnly}
                value={customService.name}
                onChange={(e) =>
                  setCustomService({ ...customService, name: e.target.value })
                }
                className={`w-full px-4 py-3 bg-white rounded-xl outline-none text-sm font-bold border ${customServiceErrors.name ? 'border-red-500 animate-shake' : 'border-gray-100'} disabled:opacity-50`}
              />
              {!isReadOnly && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ფასი"
                    value={customService.price}
                    onChange={(e) =>
                      setCustomService({
                        ...customService,
                        price: e.target.value,
                      })
                    }
                    className={`flex-1 px-4 py-3 bg-white rounded-xl outline-none text-sm font-bold border ${customServiceErrors.price ? 'border-red-500 animate-shake' : 'border-gray-100'}`}
                  />
                  <button
                    onClick={addCustomService}
                    className="p-3 bg-brand-purple text-white rounded-xl hover:bg-brand-deep transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* მარჯვენა მხარე: კალათა */}
          <div className="flex flex-col h-full min-h-[300px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-3 italic block">
              არჩეული მომსახურებები
            </label>
            <div className="flex-1 space-y-2 mb-6">
              {selectedServices.map((s) => (
                <div
                  key={s.uniqueId}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group animate-in slide-in-from-right-2"
                >
                  <span className="text-xs font-bold text-brand-deep">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-brand-purple">
                      {s.price}₾
                    </span>
                    {!isReadOnly && (
                      <button
                        onClick={() => removeService(s.uniqueId)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {selectedServices.length === 0 && (
                <p className="text-center py-10 text-gray-300 text-[10px] uppercase font-bold italic tracking-widest">
                  ჯერ არაფერია არჩეული
                </p>
              )}
            </div>

            <div className="mt-auto bg-brand-deep p-6 rounded-[32px] text-white shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase opacity-60">
                  სულ გადასახდელი:
                </span>
                <span className="text-xl font-black">{totalAmount} ₾</span>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/10">
              <label className="text-[10px] font-black uppercase opacity-60 block mb-2">
                გადახდის მეთოდი:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'ნაღდი', icon: DollarSign },
                  { id: 'card', label: 'ბარათი', icon: CreditCard },
                  { id: 'transfer', label: 'გადმორიცხვა', icon: FileText }
                ].map(m => (
                  <button
                    key={m.id}
                    disabled={isReadOnly}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${paymentMethod === m.id ? 'bg-white text-brand-deep border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                  >
                    <m.icon size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>

              <label className="text-[10px] font-black uppercase opacity-60 block mb-2 mt-4">
                გადამხდელი:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'personal', label: 'პირადი', icon: Users },
                  { id: 'insurance', label: 'სადაზღვევო', icon: Activity },
                  { id: 'corporate', label: 'შპს / კორპ.', icon: Briefcase }
                ].map(p => (
                  <button
                    key={p.id}
                    disabled={isReadOnly}
                    onClick={() => setPayerType(p.id)}
                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${payerType === p.id ? 'bg-white text-brand-deep border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                  >
                    <p.icon size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{p.label}</span>
                  </button>
                ))}
              </div>

              {payerType === 'insurance' && (
                <div className="space-y-3 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase opacity-60 block mb-2">დაზღვევის დეტალები:</label>
                  <input 
                    type="text" 
                    placeholder="სადაზღვევო კომპანია" 
                    disabled={isReadOnly}
                    value={insuranceInfo.company} 
                    onChange={e => setInsuranceInfo({...insuranceInfo, company: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-white/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="პოლისის №" 
                      disabled={isReadOnly}
                      value={insuranceInfo.policyNum} 
                      onChange={e => setInsuranceInfo({...insuranceInfo, policyNum: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-white/20"
                    />
                    <input 
                      type="text" 
                      placeholder="დასტურის კოდი" 
                      disabled={isReadOnly}
                      value={insuranceInfo.approvalCode} 
                      onChange={e => setInsuranceInfo({...insuranceInfo, approvalCode: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-white/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-[10px] font-black uppercase opacity-60 block">
                  გადახდილი თანხა:
                </label>
                <div className="relative">
                  <CreditCard
                    className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
                    size={16}
                  />
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 outline-none font-black text-lg focus:bg-white/20 transition-all"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-8 bg-slate-50/50 border-t border-gray-50 flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="text-red-500" size={18} />
              <p className="text-[11px] font-black text-red-600 uppercase">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {!isReadOnly ? (
              <>
                <button
                  onClick={handleDeleteOrder}
                  className="p-5 bg-red-50 text-red-500 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>

                <button
                  onClick={handleFinalize}
                  disabled={loading || selectedServices.length === 0}
                  className="flex-1 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Calculator size={18} /> ვიზიტის დახურვა
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                დახურვა
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletionModal;
