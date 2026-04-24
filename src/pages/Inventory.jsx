import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { useAuth } from "../context/AuthContext"; 
import { canAddInventoryItem } from "../config/plans"; 
import { logActivity } from "../utils/activityLogger";
import {
  PackageSearch,
  Plus,
  AlertCircle,
  TrendingDown,
  Box,
  Edit3,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react";

const Inventory = () => {
  const { currentUser, clinicData, userData, role, activeStaff } = useAuth();
  
  // წვდომის შეზღუდვა
  const isAccountant = role === 'accountant';
  const isDoctor = role === 'doctor';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  const isReadOnly = isAccountant || isDoctor;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState("ყველა");
  const [formErrors, setFormErrors] = useState({});
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // ფორმის State
  const [formData, setFormData] = useState({
    name: "",
    category: "consumable",
    quantity: "",
    unit: "ცალი",
    minThreshold: "",
    pricePerUnit: "",
  });

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "inventory"),
      where("clinicId", "==", userData?.clinicId || currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(inventoryData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clinicData, userData, currentUser]);

  // ლიმიტის შემოწმება (მხოლოდ ახალი ნივთის დამატებისას)
  const isLimitReached = !editingItem && !canAddInventoryItem(clinicData?.plan, items.length);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // 1. ვალიდაცია
    let errors = {};
    if (!formData.name) errors.name = "მიუთითეთ დასახელება";
    if (!formData.quantity) errors.quantity = "მიუთითეთ რაოდენობა";
    if (!formData.pricePerUnit) errors.pricePerUnit = "მიუთითეთ ფასი";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 2. ლიმიტის შემოწმება
    if (!editingItem && !canAddInventoryItem(clinicData?.plan, items.length)) {
      setFormErrors({ general: "ლიმიტი ამოწურულია. გადადით პრემიუმ პაკეტზე." });
      return;
    }

    const docId = editingItem ? editingItem.id : doc(collection(db, "inventory")).id;

    try {
      await setDoc(doc(db, "inventory", docId), {
        ...formData,
        clinicId: userData?.clinicId || currentUser.uid,
        quantity: Number(formData.quantity),
        minThreshold: Number(formData.minThreshold || 0),
        pricePerUnit: Number(formData.pricePerUnit),
        updatedAt: new Date().toISOString(),
      });

      // LOG ACTIVITY
      const action = editingItem ? 'inventory_update' : 'inventory_create';
      const details = editingItem 
        ? `განახლდა მარაგი: ${formData.name} (რაოდენობა: ${formData.quantity} ${formData.unit})`
        : `დაემატა ახალი მარაგი: ${formData.name} (რაოდენობა: ${formData.quantity} ${formData.unit})`;
      
      await logActivity(userData?.clinicId || currentUser.uid, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, action, details, { itemId: docId, name: formData.name });

      setIsModalOpen(false);
      setEditingItem(null);
      setFormErrors({});
      setFormData({ name: "", category: "consumable", quantity: "", unit: "ცალი", minThreshold: "", pricePerUnit: "" });
    } catch (err) {
      setFormErrors({ general: "შენახვა ვერ მოხერხდა." });
    }
  };

  const handleDelete = async (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      const itemToDelete = items.find(i => i.id === deleteTargetId);
      await deleteDoc(doc(db, "inventory", deleteTargetId));
      
      // LOG ACTIVITY
      if (itemToDelete) {
        await logActivity(userData?.clinicId || currentUser.uid, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'inventory_delete', `წაიშალა მარაგი: ${itemToDelete.name}`, { itemId: deleteTargetId, name: itemToDelete.name });
      }

      setDeleteTargetId(null);
    }
  };

  const openEditModal = (item) => {
    setFormErrors({});
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "consumable",
      quantity: item.quantity || "",
      unit: item.unit || "ცალი",
      minThreshold: item.minThreshold || "",
      pricePerUnit: item.pricePerUnit || "",
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter((item) => {
    if (filter === "ყველა") return true;
    return item.category === filter;
  });

  const lowStockItems = items.filter((i) => i.quantity <= i.minThreshold);

  return (
    <>
      <Helmet>
        <title>საწყობი — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
            
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">
                  საწყობი და მარაგები
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                    მასალების ავტომატური აღრიცხვა
                  </p>
                  {clinicData?.plan === "free" && (
                    <span className="text-[9px] bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full font-black uppercase">
                      Free: {items.length}/10
                    </span>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                isLimitReached ? (
                  <Link
                    to="/settings/billing"
                    className="flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer animate-pulse"
                  >
                    <Lock size={18} /> ლიმიტი შევსებულია
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setFormErrors({});
                      setFormData({ name: "", category: "consumable", quantity: "", unit: "ცალი", minThreshold: "", pricePerUnit: "" });
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-brand-purple text-white px-6 py-4 rounded-2xl shadow-lg shadow-brand-purple/20 hover:bg-brand-deep transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer"
                  >
                    <Plus size={18} /> ახალი ნივთი
                  </button>
                )
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="სულ დასახელება" amount={items.length} icon={Box} color="text-brand-purple" bg="bg-brand-purple/5" />
              <StatCard title="კრიტიკული მარაგი" amount={lowStockItems.length} icon={AlertCircle} color="text-red-500" bg="bg-red-500/10" alert={lowStockItems.length > 0} />
              <StatCard title="მარაგების ღირებულება" amount={`${items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0).toLocaleString()} ₾`} icon={TrendingDown} color="text-emerald-500" bg="bg-emerald-500/10" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
              {["ყველა", "consumable", "medicine", "instrument"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                    filter === cat ? "bg-brand-purple text-white shadow-lg" : "bg-surface text-text-muted border border-border-main hover:bg-surface-soft"
                  }`}
                >
                  {cat === "ყველა" ? "ყველა მასალა" : cat === "consumable" ? "სახარჯი" : cat === "medicine" ? "მედიკამენტები" : "ინსტრუმენტები"}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-surface rounded-[40px] border border-border-main shadow-sm overflow-hidden min-h-[400px]">
              <div className="p-8 border-b border-border-main">
                <h3 className="text-xl font-black text-text-main italic">აქტიური მარაგები</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft/50 text-[10px] font-black uppercase text-text-muted tracking-widest">
                      <th className="px-4 py-6 md:p-6">დასახელება / კატეგორია</th>
                      <th className="px-4 py-6 md:p-6">რაოდენობა</th>
                      <th className="px-4 py-6 md:p-6 hidden sm:table-cell">ერთეულის ფასი</th>
                      <th className="px-4 py-6 md:p-6">სტატუსი</th>
                      <th className="px-4 py-6 md:p-6 text-right">მართვა</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {loading ? (
                      <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-purple" /></td></tr>
                    ) : filteredItems.length > 0 ? (
                      filteredItems.map((item) => {
                        const isLow = item.quantity <= item.minThreshold;
                        return (
                          <tr key={item.id} className="group hover:bg-surface-soft/50 transition-all">
                            <td className="px-4 py-6 md:p-6">
                              <h5 className="font-bold text-text-main text-sm">{item.name}</h5>
                              <p className="text-[9px] text-text-muted uppercase font-black tracking-tighter mt-0.5">
                                {item.category === "consumable" ? "სახარჯი" : item.category === "medicine" ? "მედიკამენტი" : "ინსტრუმენტი"}
                              </p>
                            </td>
                            <td className="px-4 py-6 md:p-6 font-black text-base md:text-lg">
                              <span className={isLow ? "text-red-500" : "text-text-main"}>{item.quantity}</span>
                              <span className="text-[10px] text-text-muted ml-1 uppercase">{item.unit}</span>
                            </td>
                            <td className="px-4 py-6 md:p-6 font-bold text-text-main text-sm hidden sm:table-cell">{item.pricePerUnit} ₾</td>
                            <td className="px-4 py-6 md:p-6">
                              <span className={`inline-flex px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isLow ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"}`}>
                                {isLow ? "შევსება" : "ნორმა"}
                              </span>
                            </td>
                            <td className="px-4 py-6 md:p-6 text-right">
                              {!isReadOnly && (
                                <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditModal(item)} className="p-2 md:p-3 text-text-muted hover:text-brand-purple bg-surface-soft hover:bg-surface border border-border-main hover:border-brand-purple/20 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                                  <button onClick={() => handleDelete(item.id)} className="p-2 md:p-3 text-text-muted hover:text-red-500 bg-surface-soft hover:bg-surface border border-border-main hover:border-red-200 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="5" className="p-20 text-center text-text-muted font-bold uppercase text-[10px]">ნივთები არ მოიძებნა</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <div className="bg-surface rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <div className="mb-8 text-center">
                  <h3 className="text-2xl font-black text-text-main italic tracking-tighter">{editingItem ? "მასალის რედაქტირება" : "ახალი მასალა"}</h3>
                  {formErrors.general && <p className="text-[11px] text-red-500 font-black uppercase mt-2">{formErrors.general}</p>}
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <InputField icon={Box} placeholder="დასახელება" label="მასალის სახელი" value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} error={formErrors.name} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-main/40 uppercase tracking-[0.2em] ml-5 mb-2 block">ტიპი</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[22px] px-6 py-4 outline-none font-bold text-sm text-text-main appearance-none transition-all">
                        <option value="consumable">📦 სახარჯი</option>
                        <option value="medicine">💊 მედიკამენტი</option>
                        <option value="instrument">🛠️ ინსტრუმენტი</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-main/40 uppercase tracking-[0.2em] ml-5 mb-2 block">ზომის ერთეული</label>
                      <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[22px] px-6 py-4 outline-none font-bold text-sm text-text-main appearance-none transition-all">
                        <option value="ცალი">ცალი</option>
                        <option value="გრამი">გრამი (გ)</option>
                        <option value="მლ">მილილიტრი (მლ)</option>
                        <option value="კოლოფი">კოლოფი</option>
                      </select>
                    </div>
                    <InputField icon={TrendingDown} type="number" label="რაოდენობა" value={formData.quantity} onChange={(val) => setFormData({ ...formData, quantity: val })} error={formErrors.quantity} />
                    <InputField icon={AlertCircle} type="number" label="მინ. ზღვარი" value={formData.minThreshold} onChange={(val) => setFormData({ ...formData, minThreshold: val })} />
                    <div className="col-span-2">
                      <InputField icon={TrendingDown} type="number" step="0.01" label="ერთეულის ფასი (₾)" value={formData.pricePerUnit} onChange={(val) => setFormData({ ...formData, pricePerUnit: val })} error={formErrors.pricePerUnit} />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-surface-soft text-text-muted rounded-[24px] font-black text-[11px] uppercase tracking-widest">გაუქმება</button>
                    <button type="submit" className="flex-1 py-5 bg-brand-deep text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl">შენახვა</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

          {deleteTargetId && (
            <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
              <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(4px)'}} onClick={() => setDeleteTargetId(null)} />
              <div className="bg-surface rounded-[40px] w-full max-w-sm p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-text-main italic mb-2">ნივთის წაშლა</h3>
                <p className="text-xs text-text-muted font-bold leading-relaxed mb-8 uppercase tracking-widest">
                  ეს ნივთი სამუდამოდ წაიშლება საწყობიდან.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setDeleteTargetId(null)} className="py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest">გაუქმება</button>
                  <button onClick={confirmDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">წაშლა</button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
    </>
  );
};

// დამხმარე კომპონენტები
const StatCard = ({ title, amount, icon: Icon, color, bg, alert }) => (
  <div className={`bg-surface p-8 rounded-[32px] border ${alert ? "border-red-200 shadow-red-500/10 shadow-lg" : "border-border-main shadow-sm"} flex items-center gap-6`}>
    <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center shrink-0`}><Icon size={28} /></div>
    <div>
      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-2xl font-black text-text-main italic">{amount}</p>
    </div>
  </div>
);

const InputField = ({ icon: Icon, label, error, value, onChange, ...props }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] font-black text-text-main/40 uppercase tracking-[0.2em] ml-5 mb-2 block">{label}</label>
    <div className={`relative border-2 rounded-[22px] transition-all duration-300 ${error ? "border-red-500 bg-red-500/10" : "border-transparent bg-surface-soft focus-within:border-brand-purple focus-within:bg-surface focus-within:shadow-lg focus-within:shadow-brand-purple/5"}`}>
      <Icon className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500" : "text-text-muted group-focus-within:text-brand-purple"}`} size={18} />
      <input value={value} onChange={(e) => onChange(e.target.value)} {...props} className="w-full pl-14 pr-6 py-4 bg-transparent outline-none font-bold text-sm text-text-main placeholder:text-text-muted" />
    </div>
    {error && <p className="text-[10px] text-red-600 font-black ml-6 uppercase tracking-widest">{error}</p>}
  </div>
);

export default Inventory;