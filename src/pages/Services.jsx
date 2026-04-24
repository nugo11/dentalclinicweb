import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db, auth } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { 
  Tag, Plus, Trash2, Search, Package, Lock,
  DollarSign, Loader2, Minus, Edit3 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { canAddService, PLANS } from "../config/plans";
import { logActivity } from "../utils/activityLogger";

const Services = () => {
  const { userData, clinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null); // null = ახალი, ID = რედაქტირება

  const [newService, setNewService] = useState({
    name: "",
    price: "",
    materials: []
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const clinicId = userData?.clinicId || user.uid;
    const qServices = query(collection(db, "services"), where("clinicId", "==", clinicId));
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qInv = query(collection(db, "inventory"), where("clinicId", "==", clinicId));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubServices(); unsubInv(); };
  }, [userData]);

  const currentPlanId = (clinicData?.plan || "free").toLowerCase();
  const currentPlan = PLANS[currentPlanId] || PLANS.free;
  const isLimitReached = !editingId && !canAddService(currentPlanId, services.length);

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    if (isLimitReached) return;

    try {
      const serviceData = {
        clinicId: userData?.clinicId || auth.currentUser.uid,
        name: newService.name,
        price: Number(newService.price),
        materials: newService.materials,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // რედაქტირება
        await updateDoc(doc(db, "services", editingId), serviceData);
      } else {
        // ახლის დამატება
        const docRef = await addDoc(collection(db, "services"), {
          ...serviceData,
          createdAt: serverTimestamp()
        });
        
        // LOG ACTIVITY
        await logActivity(userData?.clinicId || auth.currentUser.uid, userData, 'service_create', `დაემატა ახალი სერვისი: ${newService.name} (${newService.price}₾)`, { serviceId: docRef.id, name: newService.name, price: newService.price });
      }

      // LOG ACTIVITY FOR UPDATE
      if (editingId) {
        await logActivity(userData?.clinicId || auth.currentUser.uid, userData, 'service_update', `განახლდა სერვისი: ${newService.name} (${newService.price}₾)`, { serviceId: editingId, name: newService.name, price: newService.price });
      }

      closeModal();
    } catch (error) { 
      console.error("Error saving service:", error); 
    }
  };

  const openEditModal = (s) => {
    setEditingId(s.id);
    setNewService({
      name: s.name,
      price: s.price,
      materials: s.materials || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewService({ name: "", price: "", materials: [] });
    setSearchTerm("");
  };

  const addMaterialToService = (item) => {
    if (newService.materials.find(m => m.id === item.id)) return;
    setNewService({
      ...newService,
      materials: [...newService.materials, { 
        id: item.id, 
        name: item.name, 
        unit: item.unit, 
        pricePerUnit: item.pricePerUnit || 0, 
        amount: 1 
      }]
    });
    setSearchTerm("");
  };

  const updateMaterialAmount = (id, delta) => {
    setNewService({
      ...newService,
      materials: newService.materials.map(m => 
        m.id === id ? { ...m, amount: Number(Math.max(0.1, m.amount + delta).toFixed(2)) } : m
      )
    });
  };

  // წვდომის შემოწმება
  if (userData && userData.role !== 'admin') {
    return (
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[32px] flex items-center justify-center mb-6">
            <Lock size={44} />
          </div>
          <h2 className="text-3xl font-black text-text-main italic">წვდომა შეზღუდულია</h2>
          <p className="text-text-muted font-bold text-sm uppercase tracking-widest mt-4 max-w-sm text-center leading-relaxed">
            მომსახურების კატალოგის მართვა შეუძლია მხოლოდ კლინიკის ადმინისტრატორს.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>სერვისები — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">მომსახურების კატალოგი</h1>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">ფასები და მასალების სტანდარტები</p>
              </div>
              {isLimitReached ? (
                <div className="flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest">
                  <Lock size={16} /> ლიმიტი: {services.length}/{currentPlan.maxServices === Infinity ? "∞" : currentPlan.maxServices}
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 bg-brand-purple text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-brand-deep transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer"
                >
                  <Plus size={18} /> ახალი სერვისი
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
              {loading ? (
                <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-purple" /></div>
              ) : services.map((s) => (
                <div key={s.id} className="bg-surface p-8 rounded-[40px] border border-border-main shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-surface-soft rounded-2xl flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors">
                      <Tag size={20} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => openEditModal(s)}
                        className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm("დარწმუნებული ხართ, რომ გსურთ ამ სერვისის წაშლა?")) {
                            await deleteDoc(doc(db, "services", s.id));
                            await logActivity(userData?.clinicId || auth.currentUser.uid, userData, 'service_delete', `წაიშალა სერვისი: ${s.name}`, { serviceId: s.id, name: s.name });
                          }
                        }}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-text-main italic leading-tight mb-1 truncate">{s.name}</h3>
                  <p className="text-2xl font-black text-brand-purple mb-6">{s.price} ₾</p>

                  <div className="space-y-3 border-t border-border-main pt-5">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 italic">საჭირო მასალები:</p>
                    {s.materials?.length > 0 ? s.materials.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-surface-soft px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-text-muted truncate mr-2">{m.name}</span>
                        <span className="text-[10px] font-black text-text-main whitespace-nowrap">{m.amount} {m.unit}</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-text-muted italic font-bold">მასალები არ არის მიბმული</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New/Edit Service Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={closeModal} />
              <div className="bg-surface rounded-[48px] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 overflow-y-auto custom-scrollbar">
                  <h3 className="text-2xl font-black text-text-main italic mb-8">
                    {editingId ? "სერვისის რედაქტირება" : "ახალი მომსახურების დამატება"}
                  </h3>
                  <form onSubmit={handleSaveService} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">სერვისის დასახელება</label>
                        <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-5 py-4 outline-none font-bold text-sm transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 italic">ფასი (₾)</label>
                        <input required type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-5 py-4 outline-none font-bold text-sm transition-all" />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-brand-purple uppercase tracking-widest ml-2 italic flex items-center gap-2">
                         <Package size={14} /> მასალების მართვა
                       </label>
                       
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input 
                            type="text" 
                            placeholder="მოძებნე საწყობში..." 
                            className="w-full pl-12 pr-4 py-4 bg-surface-soft rounded-2xl outline-none font-bold text-sm border border-border-main"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <div className="absolute top-full left-0 w-full bg-surface border border-border-main shadow-xl rounded-2xl mt-2 z-50 max-h-48 overflow-y-auto p-2">
                              {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                <button key={item.id} type="button" onClick={() => addMaterialToService(item)} className="w-full px-4 py-3 text-left hover:bg-surface-soft rounded-xl flex justify-between items-center transition-colors">
                                  <span className="text-sm font-bold">{item.name}</span>
                                  <span className="text-[10px] font-black text-text-muted uppercase">{item.unit}</span>
                                </button>
                              ))}
                            </div>
                          )}
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                         {newService.materials.map(mat => (
                           <div key={mat.id} className="flex items-center justify-between p-4 bg-brand-purple/5 rounded-2xl border border-brand-purple/10">
                              <span className="font-black text-text-main text-xs">{mat.name}</span>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-surface rounded-xl px-2 py-1 shadow-sm border border-border-main">
                                  <button type="button" onClick={() => updateMaterialAmount(mat.id, -1)} className="p-1 text-text-muted hover:text-red-500 cursor-pointer"><Minus size={14}/></button>
                                  <span className="text-xs font-black w-10 text-center">{mat.amount}</span>
                                  <button type="button" onClick={() => updateMaterialAmount(mat.id, 1)} className="p-1 text-text-muted hover:text-emerald-500 cursor-pointer"><Plus size={14}/></button>
                                </div>
                                <span className="text-[10px] font-black text-text-muted uppercase w-8">{mat.unit}</span>
                                <button type="button" onClick={() => setNewService({...newService, materials: newService.materials.filter(m => m.id !== mat.id)})} className="text-red-300 hover:text-red-500 cursor-pointer"><Trash2 size={16}/></button>
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button type="button" onClick={closeModal} className="flex-1 py-5 bg-surface-soft text-text-muted rounded-[24px] font-black text-[11px] uppercase tracking-widest cursor-pointer">გაუქმება</button>
                       <button type="submit" className="flex-1 py-5 bg-brand-deep text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-deep/20 cursor-pointer">
                         {editingId ? "განახლება" : "შენახვა"}
                       </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default Services;