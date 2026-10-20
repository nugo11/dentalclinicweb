import React, { useState, useEffect, useMemo } from "react";
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
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import { scrollToFirstError } from "../utils/scrollHelper";
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
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Filter,
} from "lucide-react";

const Inventory = () => {
  const { currentUser, clinicData, userData, role, activeStaff } = useAuth();
  
  // წვდომის შეზღუდვა
  const isAdminOrManager = role === 'admin' || role === 'manager';
  const isReadOnly = !isAdminOrManager;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState("ყველა");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'low' | 'ok' | 'out'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("deficit"); // 'deficit' | 'name' | 'quantity' | 'pricePerUnit' | 'total'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useLockBodyScroll(isModalOpen || !!deleteTargetId);

  // ფორმის State
  const [formData, setFormData] = useState({
    name: "",
    category: "consumable",
    quantity: "",
    unit: "ცალი",
    minThreshold: "",
    pricePerUnit: "",
    itemGroupId: "G1", // Default to G1 (Consumables)
  });

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "inventory"),
      where("clinicId", "==", userData.clinicId),
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
  }, [userData?.clinicId]);

  // ლიმიტის შემოწმება (მხოლოდ ახალი ნივთის დამატებისას)
  const isLimitReached = !editingItem && !canAddInventoryItem(clinicData?.plan, items.length);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser || isReadOnly) return;

    // 1. ვალიდაცია
    let errors = {};
    if (!formData.name?.trim()) errors.name = "მიუთითეთ დასახელება";
    if (formData.quantity === "" || formData.quantity === null || formData.quantity === undefined) {
      errors.quantity = "მიუთითეთ რაოდენობა";
    } else if (Number(formData.quantity) < 0) {
      errors.quantity = "რაოდენობა არ შეიძლება იყოს უარყოფითი";
    }
    if (formData.pricePerUnit === "" || formData.pricePerUnit === null || formData.pricePerUnit === undefined) {
      errors.pricePerUnit = "მიუთითეთ ფასი";
    } else if (Number(formData.pricePerUnit) < 0) {
      errors.pricePerUnit = "ფასი არ შეიძლება იყოს უარყოფითი";
    }
    if (formData.minThreshold !== "" && Number(formData.minThreshold) < 0) {
      errors.minThreshold = "მინ. ზღვარი არ შეიძლება იყოს უარყოფითი";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollToFirstError('.app-sheet');
      return;
    }

    const effectiveClinicId = userData?.clinicId;
    if (!effectiveClinicId) {
      setFormErrors({ general: "კლინიკის იდენტიფიკატორი ვერ მოიძებნა." });
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
        name: formData.name.trim(),
        clinicId: effectiveClinicId,
        quantity: Math.max(0, Number(formData.quantity)),
        minThreshold: Math.max(0, Number(formData.minThreshold || 0)),
        pricePerUnit: Math.max(0, Number(formData.pricePerUnit)),
        itemGroupId: formData.itemGroupId || "G1",
        updatedAt: new Date().toISOString(),
      });

      // LOG ACTIVITY
      const action = editingItem ? 'inventory_update' : 'inventory_create';
      const details = editingItem 
        ? `განახლდა მარაგი: ${formData.name.trim()} (რაოდენობა: ${formData.quantity} ${formData.unit})`
        : `დაემატა ახალი მარაგი: ${formData.name.trim()} (რაოდენობა: ${formData.quantity} ${formData.unit})`;
      
      await logActivity(effectiveClinicId, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, action, details, { itemId: docId, name: formData.name.trim() });

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
      itemGroupId: item.itemGroupId || "G1",
    });
    setIsModalOpen(true);
  };

  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const result = items.filter((item) => {
      // 1. Category
      const matchCategory = filter === "ყველა" || item.category === filter;

      // 2. Search
      const matchSearch =
        q === "" ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q));

      // 3. Status
      const qty = Number(item.quantity || 0);
      const min = Number(item.minThreshold || 0);
      let matchStatus = true;
      if (statusFilter === "out") {
        matchStatus = qty === 0;
      } else if (statusFilter === "low") {
        matchStatus = qty > 0 && qty <= min;
      } else if (statusFilter === "ok") {
        matchStatus = qty > min;
      }

      return matchCategory && matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      let comparison = 0;
      const qtyA = Number(a.quantity || 0);
      const qtyB = Number(b.quantity || 0);
      const minA = Number(a.minThreshold || 0);
      const minB = Number(b.minThreshold || 0);
      const priceA = Number(a.pricePerUnit || 0);
      const priceB = Number(b.pricePerUnit || 0);
      const totalA = qtyA * priceA;
      const totalB = qtyB * priceB;

      if (sortKey === "deficit") {
        const getRank = (q, m) => (q === 0 ? 1 : q <= m ? 2 : 3);
        const rankA = getRank(qtyA, minA);
        const rankB = getRank(qtyB, minB);
        if (rankA !== rankB) {
          comparison = rankA - rankB;
        } else {
          comparison = qtyA - qtyB;
        }
      } else if (sortKey === "name") {
        comparison = (a.name || "").localeCompare(b.name || "", "ka");
      } else if (sortKey === "quantity") {
        comparison = qtyA - qtyB;
      } else if (sortKey === "pricePerUnit") {
        comparison = priceA - priceB;
      } else if (sortKey === "total") {
        comparison = totalA - totalB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, filter, searchQuery, statusFilter, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, safePage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const isFilterActive = filter !== "ყველა" || statusFilter !== "all" || searchQuery !== "";

  const handleResetFilters = () => {
    setFilter("ყველა");
    setStatusFilter("all");
    setSearchQuery("");
    setSortKey("deficit");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const lowStockItems = items.filter((i) => i.quantity <= i.minThreshold);

  return (
    <>
      <Helmet>
        <title>საწყობი — AiDent</title>
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
                      setFormData({ name: "", category: "consumable", quantity: "", unit: "ცალი", minThreshold: "", pricePerUnit: "", itemGroupId: "G1" });
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

            {/* Advanced Filters & Search Bar */}
            <div className="bg-surface rounded-3xl p-5 border border-border-main shadow-sm space-y-4">
              {/* Row 1: Search & Categories */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="მასალის ძებნა დასახელებით ან ერთეულით..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: "ყველა", label: "ყველა მასალა" },
                    { id: "consumable", label: "📦 სახარჯი" },
                    { id: "medicine", label: "💊 მედიკამენტი" },
                    { id: "instrument", label: "🛠️ ინსტრუმენტი" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFilter(cat.id);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        filter === cat.id
                          ? "bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                          : "bg-surface-soft text-text-muted hover:text-text-main border border-border-dark"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Status Filter & Pagination Size */}
              <div className="pt-3 border-t border-border-main flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                    სტატუსი:
                  </span>
                  {[
                    { id: "all", label: "ყველა" },
                    { id: "out", label: "🛑 ამოწურული" },
                    { id: "low", label: "⚠️ შევსება" },
                    { id: "ok", label: "✅ ნორმა" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setStatusFilter(st.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        statusFilter === st.id
                          ? "bg-text-main text-surface shadow-sm"
                          : "bg-surface-soft text-text-muted hover:text-text-main"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  {isFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ml-1"
                    >
                      <RotateCcw size={11} />
                      <span>გასუფთავება</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                      გვერდზე:
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main font-black focus:outline-none focus:border-brand-purple text-xs cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-[40px] border border-border-main shadow-sm overflow-hidden min-h-[400px]">
              <div className="p-6 md:p-8 border-b border-border-main flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-text-main italic">აქტიური მარაგები</h3>
                  <p className="text-xs text-text-muted font-bold mt-0.5">
                    ნაპოვნია {filteredAndSortedItems.length} მასალა
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft/50 text-[10px] font-black uppercase text-text-muted tracking-widest select-none">
                      <th
                        onClick={() => handleSort("name")}
                        className="px-4 py-5 md:p-6 cursor-pointer hover:text-brand-purple transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>დასახელება / კატეგორია</span>
                          {sortKey === "name" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort("quantity")}
                        className="px-4 py-5 md:p-6 cursor-pointer hover:text-brand-purple transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>რაოდენობა</span>
                          {sortKey === "quantity" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort("pricePerUnit")}
                        className="px-4 py-5 md:p-6 hidden sm:table-cell cursor-pointer hover:text-brand-purple transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>ერთეულის ფასი</span>
                          {sortKey === "pricePerUnit" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort("total")}
                        className="px-4 py-5 md:p-6 hidden md:table-cell cursor-pointer hover:text-brand-purple transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>ჯამური ღირებულება</span>
                          {sortKey === "total" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort("deficit")}
                        className="px-4 py-5 md:p-6 cursor-pointer hover:text-brand-purple transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>სტატუსი</span>
                          {sortKey === "deficit" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </div>
                      </th>

                      <th className="px-4 py-5 md:p-6 text-right">მართვა</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="p-20 text-center">
                          <Loader2 className="animate-spin mx-auto text-brand-purple" />
                        </td>
                      </tr>
                    ) : paginatedItems.length > 0 ? (
                      paginatedItems.map((item) => {
                        const qty = Number(item.quantity || 0);
                        const min = Number(item.minThreshold || 0);
                        const price = Number(item.pricePerUnit || 0);
                        const total = qty * price;
                        const isOut = qty === 0;
                        const isLow = qty <= min && !isOut;

                        return (
                          <tr key={item.id} className="group hover:bg-surface-soft/50 transition-all">
                            <td className="px-4 py-5 md:p-6">
                              <h5 className="font-bold text-text-main text-sm">{item.name}</h5>
                              <p className="text-[9px] text-text-muted uppercase font-black tracking-tighter mt-0.5">
                                {item.category === "consumable"
                                  ? "სახარჯი"
                                  : item.category === "medicine"
                                  ? "მედიკამენტი"
                                  : item.category === "instrument"
                                  ? "ინსტრუმენტი"
                                  : item.category}
                              </p>
                            </td>
                            <td className="px-4 py-5 md:p-6 font-black text-base md:text-lg">
                              <div className="inline-flex items-baseline gap-1.5">
                                <span className={isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-text-main"}>
                                  {qty}
                                </span>
                                <span className="text-[10px] text-text-muted uppercase font-bold">{item.unit}</span>
                              </div>
                            </td>
                            <td className="px-4 py-5 md:p-6 font-bold text-text-main text-sm hidden sm:table-cell">
                              {price} ₾
                            </td>
                            <td className="px-4 py-5 md:p-6 font-mono text-emerald-500 font-black text-sm hidden md:table-cell">
                              {total.toLocaleString()} ₾
                            </td>
                            <td className="px-4 py-5 md:p-6">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                  isOut
                                    ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                    : isLow
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                }`}
                              >
                                {isOut ? "ამოიწურა" : isLow ? "შევსება" : "ნორმა"}
                              </span>
                            </td>
                            <td className="px-4 py-5 md:p-6 text-right">
                              {!isReadOnly && (
                                <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-2 md:p-3 text-text-muted hover:text-brand-purple bg-surface-soft hover:bg-surface border border-border-main hover:border-brand-purple/20 rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="რედაქტირება"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 md:p-3 text-text-muted hover:text-red-500 bg-surface-soft hover:bg-surface border border-border-main hover:border-red-200 rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="წაშლა"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-20 text-center text-text-muted font-bold uppercase text-[10px]">
                          მასალები ვერ მოიძებნა
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {filteredAndSortedItems.length > 0 && (
                <div className="p-5 border-t border-border-main bg-surface-soft/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-text-muted font-bold">
                    ნაჩვენებია{" "}
                    <span className="text-text-main font-black">
                      {(safePage - 1) * pageSize + 1} -{" "}
                      {Math.min(safePage * pageSize, filteredAndSortedItems.length)}
                    </span>{" "}
                    / სულ <span className="text-text-main font-black">{filteredAndSortedItems.length}</span> მასალა
                    {totalPages > 1 && (
                      <span className="ml-2 text-text-muted">
                        (გვერდი {safePage} / {totalPages})
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={safePage === 1}
                        className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="პირველი გვერდი"
                      >
                        <ChevronsLeft size={16} />
                      </button>

                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="წინა გვერდი"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((pageNum) => {
                          if (totalPages <= 7) return true;
                          if (pageNum === 1 || pageNum === totalPages) return true;
                          return Math.abs(pageNum - safePage) <= 1;
                        })
                        .reduce((acc, pageNum, idx, arr) => {
                          if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                            acc.push(-idx);
                          }
                          acc.push(pageNum);
                          return acc;
                        }, [])
                        .map((pageNum, idx) => {
                          if (pageNum < 0) {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-text-muted font-bold">
                                ...
                              </span>
                            );
                          }
                          const isActive = pageNum === safePage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                isActive
                                  ? "bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                                  : "bg-surface hover:bg-surface-soft text-text-main border border-border-dark"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="შემდეგი გვერდი"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="ბოლო გვერდი"
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
              <div className="app-overlay fixed inset-0 touch-none" onClick={() => setIsModalOpen(false)} onTouchMove={(e) => e.preventDefault()} />
              <div className="app-sheet bg-surface rounded-t-[32px] md:rounded-[40px] w-full max-w-lg p-6 md:p-10 relative z-10 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] overscroll-contain custom-scrollbar">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden" />
                <div className="mb-8 text-center">
                  <h3 className="text-2xl font-black text-text-main italic tracking-tighter">{editingItem ? "მასალის რედაქტირება" : "ახალი მასალა"}</h3>
                  {formErrors.general && <p className="text-[11px] text-red-500 font-black uppercase mt-2">{formErrors.general}</p>}
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <InputField required icon={Box} placeholder="დასახელება" label="მასალის სახელი" value={formData.name} onChange={(val) => {
                        setFormData({ ...formData, name: val });
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                      }} error={formErrors.name} />
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
                    <InputField required icon={TrendingDown} type="number" min="0" step="any" label="რაოდენობა" value={formData.quantity} onChange={(val) => {
                      setFormData({ ...formData, quantity: val });
                      if (formErrors.quantity) setFormErrors(prev => ({ ...prev, quantity: undefined }));
                    }} error={formErrors.quantity} />
                    <InputField icon={AlertCircle} type="number" min="0" step="any" label="მინ. ზღვარი" value={formData.minThreshold} onChange={(val) => {
                      setFormData({ ...formData, minThreshold: val });
                      if (formErrors.minThreshold) setFormErrors(prev => ({ ...prev, minThreshold: undefined }));
                    }} error={formErrors.minThreshold} />
                    <div className="col-span-2">
                      <InputField required icon={TrendingDown} type="number" min="0" step="0.01" label="ერთეულის ფასი (₾)" value={formData.pricePerUnit} onChange={(val) => {
                        setFormData({ ...formData, pricePerUnit: val });
                        if (formErrors.pricePerUnit) setFormErrors(prev => ({ ...prev, pricePerUnit: undefined }));
                      }} error={formErrors.pricePerUnit} />
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] ml-5 mb-2 block flex items-center gap-2">
                         <PackageSearch size={14} /> EHR Group ID
                       </label>
                       <select value={formData.itemGroupId} onChange={(e) => setFormData({ ...formData, itemGroupId: e.target.value })} className="w-full bg-amber-50/30 border-2 border-amber-100 focus:border-amber-500 rounded-[22px] px-6 py-4 outline-none font-bold text-sm text-text-main appearance-none transition-all">
                         <option value="G1">G1 - სახარჯი მასალები</option>
                         <option value="G2">G2 - მედიკამენტები</option>
                         <option value="G3">G3 - სადეზინფექციო</option>
                       </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-surface-soft text-text-muted border border-border-main rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all hover:bg-surface hover:text-text-main">გაუქმება</button>
                    <button type="submit" className="flex-1 py-5 bg-brand-purple text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all">შენახვა</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

          {deleteTargetId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="app-overlay fixed inset-0 touch-none" onClick={() => setDeleteTargetId(null)} onTouchMove={(e) => e.preventDefault()} />
              <div className="app-sheet bg-surface rounded-[40px] w-full max-w-sm p-10 relative z-10 text-center animate-in zoom-in-95 duration-200">
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

const InputField = ({ icon: Icon, label, error, required, value, onChange, ...props }) => (
  <div className="space-y-1 w-full" data-error={Boolean(error)}>
    <label className="text-[10px] font-black text-text-main/40 uppercase tracking-[0.2em] ml-5 mb-2 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className={`relative border-2 rounded-[22px] transition-all duration-300 ${error ? "border-red-500 bg-red-500/10 animate-shake" : "border-transparent bg-surface-soft focus-within:border-brand-purple focus-within:bg-surface focus-within:shadow-lg focus-within:shadow-brand-purple/5"}`}>
      <Icon className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500" : "text-text-muted group-focus-within:text-brand-purple"}`} size={18} />
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        data-error={Boolean(error)}
        aria-invalid={Boolean(error)}
        {...props} 
        className="w-full pl-14 pr-6 py-4 bg-transparent outline-none font-bold text-sm text-text-main placeholder:text-text-muted" 
      />
    </div>
    {error && <p className="text-[10px] text-red-600 font-black ml-6 uppercase tracking-widest">{error}</p>}
  </div>
);

export default Inventory;