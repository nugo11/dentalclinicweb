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
  const [applyVat, setApplyVat] = useState(false);
  
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
    if (isOpen) {
      setApplyVat(Boolean(orderData?.applyVat || (orderData?.vatAmount && orderData.vatAmount > 0)));
    }
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

  const servicesTotal = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const materialsTotal = selectedExtraMaterials.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0);
  const subTotal = servicesTotal + materialsTotal;

  const vatAmount = applyVat ? subTotal * 0.18 : 0;
  const totalAmount = subTotal + vatAmount;

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
          applyVat: applyVat,
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
        className="app-overlay fixed inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="app-sheet bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-700/80 rounded-t-[28px] md:rounded-[36px] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden font-nino flex flex-col max-h-[92vh] md:max-h-[90vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        
        {successMsg && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center px-6">
              {successMsg}
            </h2>
          </div>
        )}

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">
                ანგარიშსწორება
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-extrabold uppercase tracking-wider mt-0.5">
                პაციენტი: <span className="text-slate-900 dark:text-white font-black">{orderData.patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-white dark:bg-[#111726]">
          {/* მარცხენა მხარე: სერვისების არჩევა */}
          <div className="space-y-6">
            <div className={`p-5 rounded-[28px] space-y-3.5 border transition-all ${
              hasEhrCredentials 
                ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-500/30 shadow-sm' 
                : 'bg-slate-100/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/70 opacity-80'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <label className={`text-[11px] font-extrabold uppercase tracking-wider ml-1 italic flex items-center gap-2 ${
                    hasEhrCredentials ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    <HeartPulse size={15} /> EHR სინქრონიზაცია
                  </label>
                  {!hasEhrCredentials && (
                    <span className="text-[10px] font-bold text-red-500 dark:text-red-400 ml-1 mt-0.5 uppercase">სინქრონიზაციისთვის დაამატეთ მონაცემები</span>
                  )}
                </div>
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  hasEhrCredentials 
                    ? 'bg-blue-100/80 border-blue-300 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20 dark:text-blue-300 cursor-pointer' 
                    : 'border-transparent cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-500'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={hasEhrCredentials && syncEHR} 
                    onChange={e => setSyncEHR(e.target.checked)} 
                    disabled={!hasEhrCredentials}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer" 
                  />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">ჩართვა</span>
                </label>
              </div>
              {syncEHR && (
                <div className="space-y-3 pt-2 border-t border-blue-200 dark:border-blue-500/20 animate-in slide-in-from-top-2">
                  <div className="relative group">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400" size={16} />
                    <select
                      disabled={isReadOnly}
                      value={primaryIcd10}
                      onChange={(e) => setPrimaryIcd10(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all appearance-none ${
                        !primaryIcd10 
                          ? 'border-red-400 dark:border-red-500/80 focus:ring-2 focus:ring-red-500/30' 
                          : 'border-blue-300 dark:border-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300">-- აირჩიე დიაგნოზი (ICD-10) --</option>
                      {COMMON_DIAGNOSES.map(d => (
                        <option key={d.code} value={d.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{d.code} - {d.name}</option>
                      ))}
                    </select>
                    {!primaryIcd10 && (
                      <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase mt-1.5 ml-2">აუცილებელია გაგზავნისთვის!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-1 italic block">
                აირჩიე კატალოგიდან
              </label>
              <select
                disabled={isReadOnly}
                className="w-full px-5 py-4 bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all cursor-pointer shadow-sm"
                onChange={(e) => {
                  const s = availableServices.find(
                    (serv) => serv.id === e.target.value,
                  );
                  if (s) addService(s);
                  e.target.value = ""; // Reset select
                }}
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300">+ მომსახურების დამატება</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s.name} — {s.price}₾
                  </option>
                ))}
              </select>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-[28px] space-y-3.5 shadow-sm">
              <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-1 italic block">
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
                className={`w-full px-4 py-3.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none text-sm font-bold border transition-all ${
                  customServiceErrors.name 
                    ? 'border-red-500 animate-shake focus:ring-2 focus:ring-red-500/20' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20'
                } disabled:opacity-50 shadow-sm`}
              />
              {!isReadOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="NCSP"
                    value={customService.ncsp || ""}
                    onChange={(e) => setCustomService({ ...customService, ncsp: e.target.value })}
                    className="w-24 px-4 py-3 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none text-sm font-bold border border-slate-300 dark:border-slate-700 focus:border-brand-purple transition-all shadow-sm"
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
                    className={`flex-1 px-4 py-3 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none text-sm font-bold border transition-all ${
                      customServiceErrors.price 
                        ? 'border-red-500 animate-shake focus:ring-2 focus:ring-red-500/20' 
                        : 'border-slate-300 dark:border-slate-700 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20'
                    } shadow-sm`}
                  />
                  <button
                    onClick={addCustomService}
                    className="px-4 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl shadow-md shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 bg-amber-50/70 dark:bg-amber-950/20 rounded-[28px] space-y-3.5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
              <label className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider ml-1 italic block">
                დამატებითი მასალები საწყობიდან
              </label>
              <select
                disabled={isReadOnly}
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/30 focus:border-amber-500 dark:focus:border-amber-400 text-slate-900 dark:text-white rounded-xl outline-none text-sm font-bold transition-all cursor-pointer shadow-sm"
                onChange={(e) => {
                  const m = availableMaterials.find(mat => mat.id === e.target.value);
                  if (m) addExtraMaterial(m);
                  e.target.value = "";
                }}
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300">+ მასალის დამატება</option>
                {availableMaterials.filter(m => m.quantity > 0).map(m => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{m.name} (ნაშთი: {m.quantity} {m.unit})</option>
                ))}
              </select>

              <div className="space-y-2">
                {selectedExtraMaterials.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-500/20 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex-1">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Group ID"
                        value={m.itemGroupId || ""}
                        onChange={(e) => setSelectedExtraMaterials(selectedExtraMaterials.map(mat => mat.id === m.id ? { ...mat, itemGroupId: e.target.value } : mat))}
                        className="w-20 py-1 px-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-[10px] font-bold text-center outline-none border border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{(Number(m.amount) * Number(m.pricePerUnit || 0)).toFixed(2)}₾</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={m.amount}
                          onChange={(e) => updateMaterialAmount(m.id, e.target.value)}
                          className="w-12 py-1 px-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-[11px] font-black text-center outline-none border border-slate-300 dark:border-slate-700"
                        />
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">{m.unit}</span>
                        <button onClick={() => removeExtraMaterial(m.id)} className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* მარჯვენა მხარე: კალათა და ანგარიშსწორება */}
          <div className="flex flex-col space-y-6">
            <div>
              <div className="flex items-center justify-between ml-1 mb-2.5">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider italic block">
                  არჩეული მომსახურებები
                </label>
                {selectedServices.length > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                    {selectedServices.length} {selectedServices.length === 1 ? 'სერვისი' : 'სერვისი'}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {selectedServices.map((s) => (
                  <div
                    key={s.uniqueId}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-slate-300 dark:border-slate-700/80 dark:hover:border-slate-600 rounded-2xl group animate-in slide-in-from-right-2 shadow-sm transition-all"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </span>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-brand-purple bg-brand-purple/10 dark:bg-brand-purple/15 px-2.5 py-1 rounded-lg border border-brand-purple/20 dark:border-brand-purple/30">
                          {s.price} ₾
                        </span>
                        {!isReadOnly && (
                          <button
                            onClick={() => removeService(s.uniqueId)}
                            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      {syncEHR && !isReadOnly && (
                         <div className="flex items-center gap-2 mt-0.5">
                            <input 
                              type="text" 
                              placeholder="NCSP კოდი" 
                              value={s.ncsp || ""} 
                              onChange={(e) => setSelectedServices(selectedServices.map(ser => ser.uniqueId === s.uniqueId ? {...ser, ncsp: e.target.value} : ser))}
                              className={`w-24 py-1 px-2 rounded-lg text-[9px] font-bold text-center outline-none border-2 transition-all ${
                                !s.ncsp 
                                  ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-white' 
                                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                              }`}
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={s.wasUsed === 2} 
                                onChange={(e) => setSelectedServices(selectedServices.map(ser => ser.uniqueId === s.uniqueId ? {...ser, wasUsed: e.target.checked ? 2 : 1} : ser))}
                                className="w-3.5 h-3.5 accent-brand-purple rounded"
                              />
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">ანესთეზია</span>
                            </label>
                         </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedServices.length === 0 && (
                  <div className="py-6 px-4 text-center text-slate-400 text-xs uppercase font-extrabold italic tracking-wider bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50">
                    ჯერ არაფერია არჩეული
                  </div>
                )}
              </div>
            </div>

            {/* შეჯამება და გადახდის პარამეტრები */}
            <div className="bg-slate-50/90 dark:bg-[#0d1222] border border-slate-200/90 dark:border-slate-700/90 rounded-[28px] p-5 md:p-6 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">მომსახურების ჯამი:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{servicesTotal.toFixed(2)} ₾</span>
                </div>
                {materialsTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">დამატებითი მასალები:</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">{materialsTotal.toFixed(2)} ₾</span>
                  </div>
                )}

                {/* დღგ-ს არჩევა */}
                <label className={`flex items-center justify-between cursor-pointer select-none group p-3.5 rounded-2xl border transition-all ${
                  applyVat 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apply-vat-toggle"
                      disabled={isReadOnly}
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      დაიბეგროს დღგ-ით (18%)
                    </span>
                  </div>
                  <span className={`text-sm font-black transition-colors ${applyVat ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400 dark:text-slate-400'}`}>
                    {applyVat ? `+${vatAmount.toFixed(2)} ₾` : '0.00 ₾'}
                  </span>
                </label>

                <div className="flex justify-between items-center p-3.5 bg-amber-500/15 dark:bg-gradient-to-r dark:from-amber-500/15 dark:to-amber-500/5 border border-amber-400/50 dark:border-amber-500/30 rounded-2xl shadow-sm">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">სულ გადასახდელი:</span>
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">{totalAmount.toFixed(2)} ₾</span>
                </div>
              </div>

              {/* გადახდის მეთოდი */}
              <div className="space-y-2.5 pt-3.5 border-t border-slate-200 dark:border-slate-700/80">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  გადახდის მეთოდი:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'cash', label: 'ნაღდი', icon: DollarSign },
                    { id: 'card', label: 'ბარათი', icon: CreditCard },
                    { id: 'transfer', label: 'გადმორიცხვა', icon: FileText }
                  ].map(m => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`py-3.5 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-brand-purple to-indigo-600 text-white border-brand-purple shadow-md shadow-brand-purple/40 ring-2 ring-brand-purple/40 scale-[1.02]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-700/80 dark:hover:text-white dark:hover:border-slate-600 shadow-sm'
                        }`}
                      >
                        <m.icon size={16} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-300'} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* გადამხდელი */}
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block pt-2">
                  გადამხდელი:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'personal', label: 'პირადი', icon: Users },
                    { id: 'insurance', label: 'სადაზღვევო', icon: Activity },
                    { id: 'corporate', label: 'შპს / კორპ.', icon: Briefcase }
                  ].map(p => {
                    const isSelected = payerType === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setPayerType(p.id)}
                        className={`py-3.5 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-brand-purple to-indigo-600 text-white border-brand-purple shadow-md shadow-brand-purple/40 ring-2 ring-brand-purple/40 scale-[1.02]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-700/80 dark:hover:text-white dark:hover:border-slate-600 shadow-sm'
                        }`}
                      >
                        <p.icon size={16} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-300'} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* დაზღვევა */}
                {payerType === 'insurance' && (
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 animate-in slide-in-from-top-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">დაზღვევის დეტალები:</label>
                    <input 
                      type="text" 
                      placeholder="სადაზღვევო კომპანია" 
                      disabled={isReadOnly}
                      value={insuranceInfo.company} 
                      onChange={e => setInsuranceInfo({...insuranceInfo, company: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 outline-none text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="პოლისის №" 
                        disabled={isReadOnly}
                        value={insuranceInfo.policyNum} 
                        onChange={e => setInsuranceInfo({...insuranceInfo, policyNum: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 outline-none text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="დასტურის კოდი" 
                        disabled={isReadOnly}
                        value={insuranceInfo.approvalCode} 
                        onChange={e => setInsuranceInfo({...insuranceInfo, approvalCode: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 outline-none text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* გადახდილი თანხა */}
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/80">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    გადახდილი თანხა:
                  </label>
                  <div className="relative">
                    <CreditCard
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-purple"
                      size={18}
                    />
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30 rounded-2xl py-3.5 pl-11 pr-4 outline-none font-black text-xl text-slate-900 dark:text-white shadow-inner transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700/80 flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="text-red-500 dark:text-red-400" size={18} />
              <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {!isReadOnly ? (
              <>
                <button
                  onClick={handleDeleteOrder}
                  title="შეკვეთის წაშლა"
                  className="p-5 bg-red-50 text-red-600 hover:text-white hover:bg-red-500 dark:bg-red-500/15 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/20 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={20} />
                </button>

                <button
                  onClick={handleFinalize}
                  disabled={loading || selectedServices.length === 0}
                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex justify-center items-center gap-3 disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Calculator size={20} /> ვიზიტის დახურვა
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
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
