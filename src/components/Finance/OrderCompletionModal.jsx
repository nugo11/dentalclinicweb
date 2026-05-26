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
  Activity,
  CheckCircle2
} from "lucide-react";
import { logActivity } from "../../utils/activityLogger";
import { sendPlannedAmbulatory, replacePlannedAmbulatory, sendCalculation } from "../../ehr-integration/ehrSoapClient";
import { validateForEHR, EHRValidationError } from "../../ehr-integration/ehrValidationGuard";
import { HeartPulse } from "lucide-react"; // HeartPulse for UI

const OrderCompletionModal = ({ isOpen, onClose, orderData }) => {
  const { role, activeStaff, userData, clinicData } = useAuth();
  
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
  const [successMsg, setSuccessMsg] = useState(null); // წარმატების შეტყობინების state
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash, card, transfer
  const [payerType, setPayerType] = useState("personal"); // personal, insurance, corporate
  const [insuranceInfo, setInsuranceInfo] = useState({ company: "", policyNum: "", approvalCode: "" });
  const [customServiceErrors, setCustomServiceErrors] = useState({ name: false, price: false });
  
  // დამატებითი მასალების State
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [selectedExtraMaterials, setSelectedExtraMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState("");

  // Common ICD-10 codes for dentistry
  const COMMON_DIAGNOSES = [
    { code: "K02.1", name: "კარიესი (Caries of dentine)" },
    { code: "K05.3", name: "ქრონიკული პერიოდონტიტი" },
    { code: "K04.0", name: "პულპიტი (Pulpitis)" },
    { code: "K00.6", name: "კბილების ამოჭრის დარღვევები" },
    { code: "K08.1", name: "კბილების დაკარგვა ტრავმის/ამოღების გამო" },
  ];

  // EHR Data
  const hasEhrCredentials = !!(clinicData?.ehrUsername && clinicData?.ehrPassword);
  const [primaryIcd10, setPrimaryIcd10] = useState("");
  const [syncEHR, setSyncEHR] = useState(hasEhrCredentials);

  // 1. წამოვიღოთ სერვისების კატალოგი
  useEffect(() => {
    if (isOpen && orderData?.clinicId) {
      // სერვისები
      const qServices = query(
        collection(db, "services"),
        where("clinicId", "==", orderData.clinicId),
      );
      const unsubServices = onSnapshot(qServices, (snapshot) => {
        setAvailableServices(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      });

      // ინვენტარი
      const qInventory = query(
        collection(db, "inventory"),
        where("clinicId", "==", orderData.clinicId)
      );
      const unsubInventory = onSnapshot(qInventory, (snapshot) => {
        setAvailableMaterials(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });

      return () => {
        unsubServices();
        unsubInventory();
      };
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
      ncsp: customService.ncsp
    });
    setCustomService({ name: "", price: "", ncsp: "" });
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

  // მასალების მართვა
  const addExtraMaterial = (mat) => {
    const existing = selectedExtraMaterials.find(m => m.id === mat.id);
    if (existing) {
      setSelectedExtraMaterials(selectedExtraMaterials.map(m => 
        m.id === mat.id ? { ...m, amount: Number(m.amount) + 1 } : m
      ));
    } else {
      setSelectedExtraMaterials([...selectedExtraMaterials, { ...mat, amount: 1 }]);
    }
  };

  const updateMaterialAmount = (id, amount) => {
    setSelectedExtraMaterials(selectedExtraMaterials.map(m => 
      m.id === id ? { ...m, amount: Number(amount) } : m
    ));
  };

  const removeExtraMaterial = (id) => {
    setSelectedExtraMaterials(selectedExtraMaterials.filter(m => m.id !== id));
  };

  const totalAmount = 
    selectedServices.reduce((sum, s) => sum + Number(s.price), 0) +
    selectedExtraMaterials.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0);

  const vatAmount = totalAmount * 0.18;

  // Sync paidAmount with totalAmount when it changes
  useEffect(() => {
    setPaidAmount(totalAmount);
  }, [totalAmount]);

  const handleDeleteOrder = async () => {
    if (
      window.confirm("დარწმუნებული ხართ, რომ გსურთ ამ შეკვეთის/ჯავშნის წაშლა?")
    ) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "appointments", orderData.id));
        
        // LOG ACTIVITY
        await logActivity(orderData.clinicId, userData || { uid: auth.currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'appointment_delete', `წაიშალა ჯავშანი: ${orderData.patientName}`, { patientId: orderData.patientId, patientName: orderData.patientName });

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

    if (syncEHR) {
      if (!primaryIcd10) {
        setError("EHR სინქრონიზაციისთვის აუცილებელია ძირითადი დიაგნოზის (ICD-10) მითითება.");
        setLoading(false);
        return;
      }
      
      const missingNcsp = selectedServices.some(s => !s.ncsp);
      if (missingNcsp) {
        setError("ზოგიერთ სერვისს აკლია NCSP კოდი. გთხოვთ შეავსოთ სინქრონიზაციისთვის.");
        setLoading(false);
        return;
      }

      if (!clinicData?.ehrUsername || !clinicData?.ehrPassword) {
        setError("EHR ავტორიზაციის მონაცემები არ არის მითითებული პარამეტრებში.");
        setLoading(false);
        return;
      }
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("ავტორიზაცია საჭიროა");

      let totalMaterialCost = 0;

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

      for (const mat of selectedExtraMaterials) {
        const matDoc = await getDoc(doc(db, "inventory", mat.id));
        if (matDoc.exists()) {
          const pricePerUnit = Number(matDoc.data().pricePerUnit || 0);
          totalMaterialCost += Number(mat.amount) * pricePerUnit;
        }
      }

      // EHR Sychronization (The 2-Step Pipeline) - BLOCKING STEP
      let newEhrId = orderData.ehrId;

      if (syncEHR) {
        // Blood Group Mapper (EHR expects 1-4 for Rh+, and -1 to -4 for Rh-)
        const mapBloodGroupToEHR = (bg) => {
          if (!bg) return 1;
          const map = {
            "O+": 1, "O-": -1,
            "A+": 2, "A-": -2,
            "B+": 3, "B-": -3,
            "AB+": 4, "AB-": -4,
            "1": 1, "2": 2, "3": 3, "4": 4 // Fallback for old AddPatient format
          };
          return map[bg] || 1;
        };

        // Fetch Patient and Doctor data
        const patientDoc = await getDoc(doc(db, "patients", orderData.patientId));
        
        const doctorIdToUse = orderData.doctorId || (role === 'doctor' ? user.uid : null);
        if (!doctorIdToUse) {
          throw new Error("ამ ვიზიტს არ ჰყავს ექიმი მიმაგრებული. გთხოვთ ჯერ მიაბათ ექიმი ჯავშანს.");
        }
        const doctorDoc = await getDoc(doc(db, "users", doctorIdToUse));
        
        if (!patientDoc.exists() || !doctorDoc.exists()) {
          throw new Error("პაციენტის ან ექიმის მონაცემები ვერ მოიძებნა EHR სინქრონიზაციისთვის.");
        }

        const patientData = patientDoc.data();
        const doctorData = doctorDoc.data();

        const formatEHRDate = (d) => {
           if (!d) return "";
           if (typeof d === 'string' && d.includes("-") && d.length === 10) return d;
           try {
             const dt = new Date(d);
             if (!isNaN(dt.getTime())) {
                const y = dt.getFullYear();
                const m = String(dt.getMonth() + 1).padStart(2, '0');
                const day = String(dt.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
             }
           } catch(e){}
           return String(d);
        };

        const patientPayload = {
          patientId: patientDoc.id,
          personalId: patientData.personalId || "",
          birthDate: formatEHRDate(patientData.birthDate),
          bloodGroupRhFactor: mapBloodGroupToEHR(patientData.bloodGroup),
          actualRegion: patientData.actualRegion || "თბილისი",
          actualResidenceAddress: patientData.actualResidenceAddress || "თბილისი",
          phone: patientData.phone || "",
          email: patientData.email || "",
          gender: patientData.gender
        };

        const doctorPayload = {
          userId: doctorDoc.id,
          personalId: doctorData.personalId || "",
          birthDate: formatEHRDate(doctorData.birthDate)
        };

        const endDateObj = new Date();
        // Default start date to 30 mins ago if not present, to ensure an interval
        let rawStartDate = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : (orderData.date ? new Date(orderData.date) : new Date(endDateObj.getTime() - 30 * 60000));
        
        // Ensure start is strictly before end
        if (isNaN(rawStartDate.getTime()) || rawStartDate.getTime() >= endDateObj.getTime()) {
           rawStartDate = new Date(endDateObj.getTime() - 30 * 60000);
        }

        const startDate = rawStartDate.toISOString().split('.')[0];
        const endDate = endDateObj.toISOString().split('.')[0];
        
        // Procedure end date must be strictly between start and end (so 1 second before end)
        const procEndDateObj = new Date(endDateObj.getTime() - 1000);
        const procedureEndDateStr = procEndDateObj.toISOString().split('.')[0];

        const proceduresPayload = selectedServices.map(s => ({
          ncsp: s.ncsp || "JDE002",
          icd10: primaryIcd10 || "K02.1",
          procedureEndDate: procedureEndDateStr,
          procedureResult: "წარმატებული",
          price: Number(s.price)
        }));

        const usedMedicalItems = selectedExtraMaterials.map(m => ({
          section: "1",
          itemId: m.itemId || "",
          itemGroupId: m.itemGroupId || "G1",
          itemDescription: m.name || "მასალა",
          itemQuantity: Number(m.amount),
          itemPrice: Number(m.pricePerUnit || 0)
        }));

        const visitPayload = {
          visitId: orderData.id,
          ehrId: orderData.ehrId,
          ehrNo: orderData.id.slice(0, 8),
          patientId: patientDoc.id,
          doctorId: doctorDoc.id,
          startDate: startDate,
          endDate: endDate,
          status: "completed",
          diagnoses: [{ icd10: primaryIcd10 || "K02.1", isPrimary: true }],
          procedures: proceduresPayload,
          prescriptions: selectedServices.filter(s => s.wasUsed === 2).map(s => ({
             drugId: s.ncsp || "0000-0000", // NCSP ველში ჩაწერილი წამლის კოდი
             icd10: primaryIcd10 || "K02.1",
             drugCount: 1,
             ds: "ანესთეზია",
             wasUsed: 2,
             price: Number(s.price)
          })),
          calculations: {
            directCosts: {
              salary: [{ section: "1", persId: doctorData.personalId || "", amount: totalAmount * 0.4 }],
              usedMedicalItems: usedMedicalItems
            }
          }
        };

        // Validate
        validateForEHR(patientPayload, doctorPayload, visitPayload, !!orderData.ehrId);

        try {
          const ehrCreds = {
            username: clinicData.ehrUsername,
            password: clinicData.ehrPassword
          };

          // Step 1: Main EHR Service
          if (!orderData.ehrId) {
             const response = await sendPlannedAmbulatory(patientPayload, doctorPayload, visitPayload, ehrCreds);
             newEhrId = response.ehrId || "EHR_" + orderData.id; 
             visitPayload.ehrId = newEhrId;
          } else {
             await replacePlannedAmbulatory(patientPayload, doctorPayload, visitPayload, ehrCreds);
          }

          // Step 2: Calculation Service
          if (newEhrId) {
             await sendCalculation(visitPayload, ehrCreds);
          }
        } catch (ehrErr) {
          const contextMsg = `გაგზავნილი მონაცემები:
ექიმი: პ/ნ ${doctorPayload.personalId}, დაბ. თარიღი: ${doctorPayload.birthDate}
პაციენტი: პ/ნ ${patientPayload.personalId}, დაბ. თარიღი: ${patientPayload.birthDate}`;
          throw new Error(`${ehrErr.message}\n\n${contextMsg}`);
        }
      }

      // 3. ჯავშნის განახლება - ONLY RUNS IF EHR SUCCEEDS
      const appointmentRef = doc(db, "appointments", orderData.id);
        await updateDoc(appointmentRef, {
          status: "completed_and_billed",
          billedServices: selectedServices,
          extraMaterials: selectedExtraMaterials,
          price: totalAmount,
          paidAmount: Number(paidAmount),
          vatAmount: vatAmount,
          materialCost: totalMaterialCost,
          paymentMethod: paymentMethod,
          payerType: payerType,
          insuranceInfo: payerType === 'insurance' ? insuranceInfo : null,
          finalizedAt: new Date().toISOString(),
          ehrId: newEhrId || null,
        });

      // 4. საწყობის განახლება - აქ არის კრიტიკული ნაწილი!
      const inventoryUpdates = [];
      
      // სერვისების მასალები
      for (const service of selectedServices) {
        if (service.materials && Array.isArray(service.materials)) {
          for (const mat of service.materials) {
            if (mat.id) {
              const materialRef = doc(db, "inventory", mat.id);
              inventoryUpdates.push(
                updateDoc(materialRef, {
                  quantity: increment(-(Number(mat.amount) || 0)),
                }),
              );
            }
          }
        }
      }

      // ექსტრა მასალები
      for (const mat of selectedExtraMaterials) {
        if (mat.id) {
          const materialRef = doc(db, "inventory", mat.id);
          inventoryUpdates.push(
            updateDoc(materialRef, {
              quantity: increment(-(Number(mat.amount) || 0)),
            }),
          );
        }
      }

      // ველოდებით ყველა მოთხოვნის დასრულებას
      if (inventoryUpdates.length > 0) {
        await Promise.all(inventoryUpdates);
      }

      // LOG ACTIVITY
      await logActivity(orderData.clinicId, userData || { uid: auth.currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'appointment_finalize', `დაიხურა ვიზიტი: ${orderData.patientName} (თანხა: ${totalAmount}₾)`, { patientId: orderData.patientId, patientName: orderData.patientName, amount: totalAmount });

      if (syncEHR) {
        setSuccessMsg("ვიზიტი წარმატებით დაიხურა და სინქრონიზდა EHR-თან!");
      } else {
        setSuccessMsg("ვიზიტი წარმატებით დაიხურა (EHR სინქრონიზაციის გარეშე).");
      }

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      console.error("Finalize error details:", err);
      if (err instanceof EHRValidationError) {
        setError(`EHR შეცდომა: ${err.message}`);
      } else {
        setError(err.message || "შეკვეთის დახურვისას მოხდა შეცდომა.");
      }
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

      <div className="app-sheet bg-surface rounded-t-[28px] md:rounded-[40px] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden font-nino flex flex-col max-h-[92vh] md:max-h-[90vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        
        {successMsg && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-text-main text-center px-6">
              {successMsg}
            </h2>
          </div>
        )}

        {/* Header */}
        <div className="p-5 md:p-8 border-b border-border-main flex items-center justify-between bg-surface-soft/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main italic">
                ანგარიშსწორება
              </h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                პაციენტი: {orderData.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:bg-surface rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* მარცხენა მხარე: სერვისების არჩევა */}
          <div className="space-y-6">
            <div className={`p-6 rounded-[32px] space-y-4 border mb-6 ${hasEhrCredentials ? 'bg-blue-500/10 border-blue-500/10' : 'bg-surface-soft border-border-main opacity-80'}`}>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-2 italic flex items-center gap-2 ${hasEhrCredentials ? 'text-blue-600' : 'text-text-muted'}`}>
                    <HeartPulse size={14} /> EHR სინქრონიზაცია
                  </label>
                  {!hasEhrCredentials && (
                    <span className="text-[10px] font-black text-red-500 ml-2 mt-1 uppercase">სინქრონიზაციისთვის დაამატეთ მონაცემები</span>
                  )}
                </div>
                <label className={`flex items-center gap-2 ${hasEhrCredentials ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={hasEhrCredentials && syncEHR} 
                    onChange={e => setSyncEHR(e.target.checked)} 
                    disabled={!hasEhrCredentials}
                    className="accent-blue-500" 
                  />
                  <span className="text-[10px] font-bold text-text-muted">ჩართვა</span>
                </label>
              </div>
              {syncEHR && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <div className="relative group">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                    <select
                      disabled={isReadOnly}
                      value={primaryIcd10}
                      onChange={(e) => setPrimaryIcd10(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 bg-surface rounded-2xl outline-none text-sm font-bold border-2 transition-all appearance-none ${!primaryIcd10 ? 'border-red-500 bg-red-50' : 'border-blue-500/20'}`}
                    >
                      <option value="">-- აირჩიე დიაგნოზი (ICD-10) --</option>
                      {COMMON_DIAGNOSES.map(d => (
                        <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                      ))}
                    </select>
                    {!primaryIcd10 && (
                      <p className="text-[9px] text-red-500 font-black uppercase mt-1 ml-2">აუცილებელია გაგზავნისთვის!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                აირჩიე კატალოგიდან
              </label>
              <select
                disabled={isReadOnly}
                className="w-full px-5 py-4 bg-surface-soft rounded-2xl outline-none font-bold text-sm text-text-main border-2 border-transparent focus:border-brand-purple transition-all cursor-pointer"
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

            <div className="p-6 bg-surface-soft rounded-[32px] space-y-4">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">
                სხვა მომსახურება (ხელით)
              </label>
              <input
                type="text"
                placeholder="დასახელება (მაგ: დამატებითი კონსულტაცია)"
                disabled={isReadOnly}
                value={customService.name}
                onChange={(e) =>
                  setCustomService({ ...customService, name: e.target.value })
                }
                className={`w-full px-4 py-3 bg-surface rounded-xl outline-none text-sm font-bold border ${customServiceErrors.name ? 'border-red-500 animate-shake' : 'border-border-main'} disabled:opacity-50`}
              />
              {!isReadOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="NCSP"
                    value={customService.ncsp || ""}
                    onChange={(e) => setCustomService({ ...customService, ncsp: e.target.value })}
                    className="w-24 px-4 py-3 bg-surface rounded-xl outline-none text-sm font-bold border border-border-main"
                  />
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
                    className={`flex-1 px-4 py-3 bg-surface rounded-xl outline-none text-sm font-bold border ${customServiceErrors.price ? 'border-red-500 animate-shake' : 'border-border-main'}`}
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

            <div className="p-6 bg-amber-500/10 rounded-[32px] space-y-4 border border-amber-500/10">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-2 italic">
                დამატებითი მასალები საწყობიდან
              </label>
              <select
                disabled={isReadOnly}
                className="w-full px-4 py-3 bg-surface rounded-xl outline-none text-sm font-bold border border-amber-500/20"
                onChange={(e) => {
                  const m = availableMaterials.find(mat => mat.id === e.target.value);
                  if (m) addExtraMaterial(m);
                  e.target.value = "";
                }}
              >
                <option value="">+ მასალის დამატება</option>
                {availableMaterials.filter(m => m.quantity > 0).map(m => (
                  <option key={m.id} value={m.id}>{m.name} (ნაშთი: {m.quantity} {m.unit})</option>
                ))}
              </select>

              <div className="space-y-2">
                {selectedExtraMaterials.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-amber-500/10">
                    <span className="text-[10px] font-bold text-text-main flex-1">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Group ID"
                        value={m.itemGroupId || ""}
                        onChange={(e) => setSelectedExtraMaterials(selectedExtraMaterials.map(mat => mat.id === m.id ? { ...mat, itemGroupId: e.target.value } : mat))}
                        className="w-20 py-1 px-2 bg-surface-soft rounded-lg text-[9px] font-bold text-center outline-none border border-border-main"
                      />
                      <span className="text-[9px] font-black text-amber-600">{(Number(m.amount) * Number(m.pricePerUnit || 0)).toFixed(2)}₾</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={m.amount}
                          onChange={(e) => updateMaterialAmount(m.id, e.target.value)}
                          className="w-12 py-1 px-2 bg-surface-soft rounded-lg text-[10px] font-black text-center outline-none border border-border-main"
                        />
                        <span className="text-[8px] text-text-muted uppercase">{m.unit}</span>
                        <button onClick={() => removeExtraMaterial(m.id)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* მარჯვენა მხარე: კალათა */}
          <div className="flex flex-col h-full min-h-[300px]">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 mb-3 italic block">
              არჩეული მომსახურებები
            </label>
            <div className="flex-1 space-y-2 mb-6">
              {selectedServices.map((s) => (
                <div
                  key={s.uniqueId}
                  className="flex items-center justify-between p-4 bg-surface border border-border-main rounded-2xl group animate-in slide-in-from-right-2"
                >
                  <span className="text-xs font-bold text-text-main">
                    {s.name}
                  </span>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-brand-purple">
                        {s.price}₾
                      </span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeService(s.uniqueId)}
                          className="text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {syncEHR && !isReadOnly && (
                       <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="text" 
                            placeholder="NCSP კოდი" 
                            value={s.ncsp || ""} 
                            onChange={(e) => setSelectedServices(selectedServices.map(ser => ser.uniqueId === s.uniqueId ? {...ser, ncsp: e.target.value} : ser))}
                            className={`w-24 py-1 px-2 rounded-lg text-[9px] font-bold text-center outline-none border-2 transition-all ${!s.ncsp ? 'border-red-400 bg-red-50' : 'bg-surface-soft border-border-main'}`}
                          />
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={s.wasUsed === 2} 
                              onChange={(e) => setSelectedServices(selectedServices.map(ser => ser.uniqueId === s.uniqueId ? {...ser, wasUsed: e.target.checked ? 2 : 1} : ser))}
                              className="accent-brand-purple"
                            />
                            <span className="text-[8px] font-bold text-text-muted">ანესთეზია</span>
                          </label>
                       </div>
                    )}
                  </div>
                </div>
              ))}
              {selectedServices.length === 0 && (
                <p className="text-center py-10 text-text-muted text-[10px] uppercase font-bold italic tracking-widest">
                  ჯერ არაფერია არჩეული
                </p>
              )}
            </div>

            <div className="mt-auto bg-brand-deep p-6 rounded-[32px] text-white shadow-xl">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[9px] font-black uppercase tracking-widest">მომსახურების ჯამი:</span>
                  <span className="text-sm font-black">{totalAmount - (selectedExtraMaterials.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0))} ₾</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[9px] font-black uppercase tracking-widest">დამატებითი მასალები:</span>
                  <span className="text-sm font-black">{selectedExtraMaterials.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0)} ₾</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-[9px] font-black uppercase tracking-widest">დღგ (18%):</span>
                  <span className="text-sm font-black">{vatAmount.toFixed(2)} ₾</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                  <span className="text-[10px] font-black uppercase opacity-60">სულ გადასახდელი:</span>
                  <span className="text-xl font-black">{totalAmount.toFixed(2)} ₾</span>
                </div>
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
                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${paymentMethod === m.id ? 'bg-surface text-text-main border-brand-purple' : 'bg-surface/5 text-white/60 border-white/10 hover:bg-surface/10'}`}
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
                    className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${payerType === p.id ? 'bg-surface text-text-main border-brand-purple' : 'bg-surface/5 text-white/60 border-white/10 hover:bg-surface/10'}`}
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
                    className="w-full bg-surface/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-surface/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="პოლისის №" 
                      disabled={isReadOnly}
                      value={insuranceInfo.policyNum} 
                      onChange={e => setInsuranceInfo({...insuranceInfo, policyNum: e.target.value})}
                      className="w-full bg-surface/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-surface/20"
                    />
                    <input 
                      type="text" 
                      placeholder="დასტურის კოდი" 
                      disabled={isReadOnly}
                      value={insuranceInfo.approvalCode} 
                      onChange={e => setInsuranceInfo({...insuranceInfo, approvalCode: e.target.value})}
                      className="w-full bg-surface/10 border border-white/20 rounded-xl py-3 px-4 outline-none text-xs font-bold text-white placeholder:text-white/30 focus:bg-surface/20"
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
                    className="w-full bg-surface/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 outline-none font-black text-lg focus:bg-surface/20 transition-all"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-8 bg-surface-soft/50 border-t border-border-main flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in">
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
                  className="p-5 bg-red-500/10 text-red-500 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
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
                className="flex-1 py-5 bg-surface-soft text-text-muted rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-surface-soft transition-all"
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
