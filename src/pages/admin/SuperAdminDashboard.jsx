import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Building2, Package, Users, Activity, KeyRound,
  Power, Search, Filter, RefreshCw, AlertTriangle, CheckCircle2,
  Lock, Unlock, ArrowUpRight, LogOut, Download, Eye, ShieldAlert,
  ChevronRight, Calendar, DollarSign, Sparkles, FileText, Smartphone,
  Info, ExternalLink, Layers, ArrowLeft, Phone, Truck, ArrowRight, TrendingDown,
  Mail, Trash2, ChevronLeft, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, SlidersHorizontal, Settings
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { SUPERADMIN_EMAIL, logAdminAudit } from "../../utils/superAdmin";
import { getRoleLabel } from "../../utils/roleUtils";
import ThemeToggle from "../../components/Common/ThemeToggle";
import ClinicStatusModal from "../../components/Admin/ClinicStatusModal";
import DoctorPinResetModal from "../../components/Admin/DoctorPinResetModal";
import ClinicDetailsModal from "../../components/Admin/ClinicDetailsModal";
import ClinicWarehouseModal from "../../components/Admin/ClinicWarehouseModal";
import ClinicDeleteModal from "../../components/Admin/ClinicDeleteModal";
import ClinicPlanModal from "../../components/Admin/ClinicPlanModal";
import { normalizePlanId } from "../../config/plans";

const SuperAdminDashboard = () => {
  const { currentUser, userData, staffLogout } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'clinics' | 'inventory' | 'staff' | 'audit'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states from Firestore
  const [clinics, setClinics] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClinicFilter, setSelectedClinicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'suspended'
  const [planFilter, setPlanFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all"); // 'all' | 'low' | 'out' | 'ok'

  // Detailed Inventory Filters, Sorting & Pagination
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [inventoryPriceMin, setInventoryPriceMin] = useState("");
  const [inventoryPriceMax, setInventoryPriceMax] = useState("");
  const [inventorySortKey, setInventorySortKey] = useState("deficit"); // 'deficit' | 'name' | 'clinic' | 'category' | 'quantity' | 'price' | 'total' | 'minThreshold'
  const [inventorySortOrder, setInventorySortOrder] = useState("asc"); // 'asc' | 'desc'
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(25);

  // Modals state
  const [statusModalClinic, setStatusModalClinic] = useState(null);
  const [planModalClinic, setPlanModalClinic] = useState(null);
  const [pinResetStaff, setPinResetStaff] = useState(null);
  const [pinResetClinicName, setPinResetClinicName] = useState("");
  const [detailsModalClinic, setDetailsModalClinic] = useState(null);
  const [warehouseModalClinic, setWarehouseModalClinic] = useState(null);
  const [deleteModalClinic, setDeleteModalClinic] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Show temporary toast notification
  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Subscribe to all collections in Firestore (Real-time)
  useEffect(() => {
    setLoadingData(true);

    const unsubClinics = onSnapshot(collection(db, "clinics"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClinics(list);
    }, (err) => console.error("Clinics sub error:", err));

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    }, (err) => console.error("Users sub error:", err));

    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInventory(list);
    }, (err) => console.error("Inventory sub error:", err));

    const unsubPatients = onSnapshot(collection(db, "patients"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPatients(list);
    }, (err) => console.error("Patients sub error:", err));

    const auditQ = query(collection(db, "admin_audit_logs"), orderBy("createdAt", "desc"), limit(100));
    const unsubAudit = onSnapshot(auditQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAuditLogs(list);
      setLoadingData(false);
    }, (err) => {
      console.warn("Audit logs error (may require index):", err);
      setLoadingData(false);
    });

    return () => {
      unsubClinics();
      unsubUsers();
      unsubInventory();
      unsubPatients();
      unsubAudit();
    };
  }, []);

  // Clinics lookup map
  const clinicMap = useMemo(() => {
    const map = {};
    clinics.forEach((c) => {
      map[c.id] = c.clinicName || c.loginName || "კლინიკა";
    });
    return map;
  }, [clinics]);

  // Calculations for System Overview
  const metrics = useMemo(() => {
    const totalClinics = clinics.length;
    const activeClinics = clinics.filter((c) => (c.subscriptionStatus || "active") === "active").length;
    const suspendedClinics = totalClinics - activeClinics;

    const planStats = {
      free: clinics.filter((c) => normalizePlanId(c.plan) === "free").length,
      business: clinics.filter((c) => normalizePlanId(c.plan) === "business").length,
      custom: clinics.filter((c) => normalizePlanId(c.plan) === "custom").length,
    };

    const totalStaff = users.length;
    const totalDoctors = users.filter((u) => u.role === "doctor").length;
    
    // Check locked accounts
    const now = currentTimestamp;
    const lockedAccounts = users.filter((u) => {
      const lockUntil = u.pinLockedUntil ? new Date(u.pinLockedUntil).getTime() : 0;
      return (u.failedPinAttempts >= 4) || (lockUntil > now);
    });

    const totalPatientsCount = patients.length;
    const totalInventoryItems = inventory.length;
    const totalInventoryValue = inventory.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.pricePerUnit || 0));
    }, 0);

    const lowStockItems = inventory.filter((item) => {
      const qty = Number(item.quantity || 0);
      const min = Number(item.minThreshold || 0);
      return qty <= min && qty > 0;
    });

    const outOfStockItems = inventory.filter((item) => Number(item.quantity || 0) === 0);

    return {
      totalClinics,
      activeClinics,
      suspendedClinics,
      planStats,
      totalStaff,
      totalDoctors,
      lockedAccounts,
      totalPatientsCount,
      totalInventoryItems,
      totalInventoryValue,
      lowStockItems,
      outOfStockItems,
    };
  }, [clinics, users, inventory, patients]);

  // ტოპ 5 კომპანია ყველაზე კრიტიკული/დაბალი მარაგით (B2B მომარაგების შეთავაზებისთვის)
  const topDeficitCompanies = useMemo(() => {
    // 1. მარაგების დაჯგუფება კლინიკების მიხედვით
    const clinicInventoryMap = {};
    inventory.forEach((item) => {
      if (!item.clinicId) return;
      if (!clinicInventoryMap[item.clinicId]) {
        clinicInventoryMap[item.clinicId] = [];
      }
      clinicInventoryMap[item.clinicId].push(item);
    });

    // 2. თითოეული კლინიკის საწყობის გაანალიზება
    const scoredClinics = clinics.map((clinic) => {
      const items = clinicInventoryMap[clinic.id] || [];
      const totalItems = items.length;

      const outOfStockItems = [];
      const lowStockItems = [];
      let totalValue = 0;

      items.forEach((item) => {
        const qty = Number(item.quantity || 0);
        const min = Number(item.minThreshold || 0);
        const price = Number(item.pricePerUnit || 0);
        totalValue += qty * price;

        if (qty === 0) {
          outOfStockItems.push(item);
        } else if (qty <= min) {
          lowStockItems.push(item);
        }
      });

      // პროდუქტების სორტირება დეფიციტის მიხედვით:
      // 1) ამოწურულები (qty === 0)
      // 2) იწურება (qty <= min)
      // 3) დანარჩენები უმცირესი რაოდენობით
      const sortedItems = [...items].sort((a, b) => {
        const qtyA = Number(a.quantity || 0);
        const qtyB = Number(b.quantity || 0);
        const minA = Number(a.minThreshold || 0);
        const minB = Number(b.minThreshold || 0);

        const isOutA = qtyA === 0;
        const isOutB = qtyB === 0;
        if (isOutA && !isOutB) return -1;
        if (!isOutA && isOutB) return 1;

        const isLowA = qtyA <= minA;
        const isLowB = qtyB <= minB;
        if (isLowA && !isLowB) return -1;
        if (!isLowA && isLowB) return 1;

        if (qtyA !== qtyB) return qtyA - qtyB;
        return (qtyA - minA) - (qtyB - minB);
      });

      // ამ კონკრეტული კლინიკის ტოპ 5 ყველაზე ცოტა მარაგი
      const top5LowestItems = sortedItems.slice(0, 5).map((item) => {
        const qty = Number(item.quantity || 0);
        const min = Number(item.minThreshold || 0);
        return {
          id: item.id,
          name: item.name || "მასალა",
          quantity: qty,
          unit: item.unit || "ცალი",
          minThreshold: min,
          category: item.category || "მასალა",
          isOut: qty === 0,
          isLow: qty > 0 && qty <= min,
        };
      });

      const criticalCount = outOfStockItems.length + lowStockItems.length;

      return {
        clinic,
        totalItems,
        totalValue,
        outOfStockCount: outOfStockItems.length,
        lowStockCount: lowStockItems.length,
        criticalCount,
        top5LowestItems,
        outOfStockItems,
        lowStockItems,
      };
    });

    // 3. კომპანიების რანჟირება - პირველ ადგილზე გადის კომპანია, ვისაც ყველაზე მეტად სჭირდება მომარაგება:
    // a) ვისაც მეტი ამოწურული პოზიცია აქვს (qty === 0)
    // b) ვისაც მეტი დაბალი მარაგი აქვს (qty <= min)
    // c) კრიტიკული პოზიციების საერთო ჯამი
    // d) უმცირესი ნაშთები
    const sorted = scoredClinics.sort((a, b) => {
      if (b.outOfStockCount !== a.outOfStockCount) {
        return b.outOfStockCount - a.outOfStockCount;
      }
      if (b.lowStockCount !== a.lowStockCount) {
        return b.lowStockCount - a.lowStockCount;
      }
      if (b.criticalCount !== a.criticalCount) {
        return b.criticalCount - a.criticalCount;
      }
      // თუ ორივეს 0 დეფიციტი აქვს, უპირატესობა ეძლევა კლინიკებს, რომლებსაც რეალურად აქვთ საწყობი შევსებული
      if (b.totalItems > 0 && a.totalItems === 0) return -1;
      if (a.totalItems > 0 && b.totalItems === 0) return 1;
      return a.totalItems - b.totalItems;
    });

    return sorted.slice(0, 5);
  }, [clinics, inventory]);

  // Instant Account Unlock
  const handleInstantUnlock = async (staffMember) => {
    try {
      const userRef = doc(db, "users", staffMember.id);
      await updateDoc(userRef, {
        failedPinAttempts: 0,
        pinLockedUntil: null,
        unlockedAt: new Date().toISOString(),
        unlockedBy: currentUser?.email || SUPERADMIN_EMAIL,
      });

      await logAdminAudit({
        adminEmail: currentUser?.email || SUPERADMIN_EMAIL,
        action: "ACCOUNT_UNLOCKED",
        targetType: "user",
        targetId: staffMember.id,
        targetName: staffMember.fullName || "თანამშრომელი",
        clinicId: staffMember.clinicId,
        clinicName: clinicMap[staffMember.clinicId] || "კლინიკა",
        details: `ანგარიში მყისიერად განბლოკილია: ${staffMember.fullName} (${getRoleLabel(staffMember.role)}). PIN მცდელობები განულდა.`,
      });

      showToast(`ექიმ ${staffMember.fullName}-ს ანგარიში წარმატებით განბლოკდა!`, "success");
    } catch (err) {
      console.error("Unlock error:", err);
      showToast("განბლოკვა ვერ მოხერხდა: " + err.message, "error");
    }
  };

  // Change Clinic Subscription Plan
  const handleChangeClinicPlan = async (clinicId, newPlan, customMaxDocs) => {
    try {
      const clinicRef = doc(db, "clinics", clinicId);
      const updates = {
        plan: newPlan,
        planUpdatedAt: new Date().toISOString(),
        planUpdatedBy: currentUser?.email || SUPERADMIN_EMAIL,
      };

      if (newPlan === "custom") {
        const parsed = parseInt(customMaxDocs, 10);
        updates.customMaxDoctors = (!isNaN(parsed) && parsed > 0) ? parsed : 15;
      }

      await updateDoc(clinicRef, updates);

      const planSummary = newPlan === "custom"
        ? `CUSTOM (${updates.customMaxDoctors} ექიმის ლიმიტი)`
        : newPlan.toUpperCase();

      await logAdminAudit({
        adminEmail: currentUser?.email || SUPERADMIN_EMAIL,
        action: "PLAN_CHANGED",
        targetType: "clinic",
        targetId: clinicId,
        targetName: clinicMap[clinicId] || "კლინიკა",
        clinicId,
        clinicName: clinicMap[clinicId] || "კლინიკა",
        details: `კლინიკის ტარიფი შეიცვალა ➔ ${planSummary}`,
        metadata: { newPlan, customMaxDoctors: updates.customMaxDoctors || null },
      });

      showToast(`კლინიკის ტარიფი განახლდა: ${planSummary}`, "success");
    } catch (err) {
      console.error("Error updating plan:", err);
      showToast("ტარიფის განახლება ვერ მოხერხდა: " + err.message, "error");
    }
  };

  // Export Inventory as CSV
  const handleExportInventoryCsv = () => {
    if (inventory.length === 0) {
      showToast("საექსპორტო მონაცემები არ არის", "error");
      return;
    }

    const headers = ["კლინიკა", "დასახელება", "კატეგორია", "რაოდენობა", "ერთეული", "ფასი (₾)", "ჯამური ღირებულება (₾)", "მინ. ზღვარი", "სტატუსი"];
    const rows = filteredInventory.map((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.pricePerUnit || 0);
      const total = qty * price;
      const min = Number(item.minThreshold || 0);
      let status = "მარაგშია";
      if (qty === 0) status = "ამოიწურა";
      else if (qty <= min) status = "მცირე მარაგი";

      return [
        `"${(clinicMap[item.clinicId] || "უცნობი").replace(/"/g, '""')}"`,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${(item.category || item.itemGroupId || "").replace(/"/g, '""')}"`,
        qty,
        `"${item.unit || "ცალი"}"`,
        price,
        total,
        min,
        `"${status}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aident_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("საწყობის CSV ფაილი წარმატებით ჩამოიტვირთა", "success");
  };

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const matchSearch =
        searchQuery === "" ||
        (c.clinicName && c.clinicName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.loginName && c.loginName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.ownerEmail && c.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery));

      const status = c.subscriptionStatus || "active";
      const matchStatus = statusFilter === "all" || status === statusFilter;
      const clinicPlan = normalizePlanId(c.plan);
      const matchPlan = planFilter === "all" || clinicPlan === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [clinics, searchQuery, statusFilter, planFilter]);

  // Dynamic categories from inventory
  const inventoryCategories = useMemo(() => {
    const cats = new Set();
    inventory.forEach((i) => {
      const c = (i.category || i.itemGroupId || "").trim();
      if (c) cats.add(c);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "ka"));
  }, [inventory]);

  // Filtered & Sorted Inventory
  const filteredAndSortedInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = inventory.filter((item) => {
      // Clinic filter
      const matchClinic = selectedClinicFilter === "all" || item.clinicId === selectedClinicFilter;
      const clinicName = clinicMap[item.clinicId] || "";

      // Search filter (searches item name, category, and clinic name)
      const matchSearch =
        query === "" ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.itemGroupId && item.itemGroupId.toLowerCase().includes(query)) ||
        clinicName.toLowerCase().includes(query);

      // Stock status filter
      const qty = Number(item.quantity || 0);
      const min = Number(item.minThreshold || 0);
      let matchStock = true;
      if (stockStatusFilter === "out") {
        matchStock = qty === 0;
      } else if (stockStatusFilter === "low") {
        matchStock = qty > 0 && qty <= min;
      } else if (stockStatusFilter === "ok") {
        matchStock = qty > min;
      }

      // Category filter
      const itemCat = (item.category || item.itemGroupId || "ზოგადი").trim();
      const matchCat = inventoryCategoryFilter === "all" || itemCat === inventoryCategoryFilter;

      // Price range filter
      const price = Number(item.pricePerUnit || 0);
      const minP = inventoryPriceMin !== "" ? Number(inventoryPriceMin) : null;
      const maxP = inventoryPriceMax !== "" ? Number(inventoryPriceMax) : null;
      let matchPrice = true;
      if (minP !== null && !isNaN(minP)) {
        matchPrice = matchPrice && price >= minP;
      }
      if (maxP !== null && !isNaN(maxP)) {
        matchPrice = matchPrice && price <= maxP;
      }

      return matchClinic && matchSearch && matchStock && matchCat && matchPrice;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      const qtyA = Number(a.quantity || 0);
      const qtyB = Number(b.quantity || 0);
      const minA = Number(a.minThreshold || 0);
      const minB = Number(b.minThreshold || 0);
      const priceA = Number(a.pricePerUnit || 0);
      const priceB = Number(b.pricePerUnit || 0);
      const totalA = qtyA * priceA;
      const totalB = qtyB * priceB;

      if (inventorySortKey === "deficit") {
        // Priority: Out of stock (1) -> Low stock (2) -> In stock (3)
        const getRank = (q, m) => (q === 0 ? 1 : q <= m ? 2 : 3);
        const rankA = getRank(qtyA, minA);
        const rankB = getRank(qtyB, minB);
        if (rankA !== rankB) {
          comparison = rankA - rankB;
        } else {
          comparison = qtyA - qtyB; // lowest quantity first within same rank
        }
      } else if (inventorySortKey === "name") {
        comparison = (a.name || "").localeCompare(b.name || "", "ka");
      } else if (inventorySortKey === "clinic") {
        const cA = clinicMap[a.clinicId] || "";
        const cB = clinicMap[b.clinicId] || "";
        comparison = cA.localeCompare(cB, "ka");
      } else if (inventorySortKey === "category") {
        const catA = a.category || a.itemGroupId || "";
        const catB = b.category || b.itemGroupId || "";
        comparison = catA.localeCompare(catB, "ka");
      } else if (inventorySortKey === "quantity") {
        comparison = qtyA - qtyB;
      } else if (inventorySortKey === "price") {
        comparison = priceA - priceB;
      } else if (inventorySortKey === "total") {
        comparison = totalA - totalB;
      } else if (inventorySortKey === "minThreshold") {
        comparison = minA - minB;
      }

      return inventorySortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    inventory,
    selectedClinicFilter,
    searchQuery,
    stockStatusFilter,
    inventoryCategoryFilter,
    inventoryPriceMin,
    inventoryPriceMax,
    inventorySortKey,
    inventorySortOrder,
    clinicMap,
  ]);

  // Backward compatible alias
  const filteredInventory = filteredAndSortedInventory;

  // Pagination for inventory
  const totalInventoryPages = Math.max(1, Math.ceil(filteredAndSortedInventory.length / inventoryPageSize));
  const safeInventoryPage = Math.min(Math.max(1, inventoryPage), totalInventoryPages);
  const paginatedInventory = useMemo(() => {
    const start = (safeInventoryPage - 1) * inventoryPageSize;
    return filteredAndSortedInventory.slice(start, start + inventoryPageSize);
  }, [filteredAndSortedInventory, safeInventoryPage, inventoryPageSize]);

  const handleInventorySort = (key) => {
    if (inventorySortKey === key) {
      setInventorySortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setInventorySortKey(key);
      setInventorySortOrder("asc");
    }
    setInventoryPage(1);
  };

  const isAnyInventoryFilterActive =
    selectedClinicFilter !== "all" ||
    stockStatusFilter !== "all" ||
    inventoryCategoryFilter !== "all" ||
    inventoryPriceMin !== "" ||
    inventoryPriceMax !== "" ||
    searchQuery !== "";

  const handleResetInventoryFilters = () => {
    setSelectedClinicFilter("all");
    setStockStatusFilter("all");
    setInventoryCategoryFilter("all");
    setInventoryPriceMin("");
    setInventoryPriceMax("");
    setSearchQuery("");
    setInventorySortKey("deficit");
    setInventorySortOrder("asc");
    setInventoryPage(1);
  };

  // Filtered Staff / Doctors
  const filteredStaff = useMemo(() => {
    return users.filter((u) => {
      const matchClinic = selectedClinicFilter === "all" || u.clinicId === selectedClinicFilter;
      const matchSearch =
        searchQuery === "" ||
        (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      let matchLock = true;
      if (statusFilter === "locked") {
        const lockUntil = u.pinLockedUntil ? new Date(u.pinLockedUntil).getTime() : 0;
        matchLock = u.failedPinAttempts >= 4 || lockUntil > currentTimestamp;
      }

      return matchClinic && matchSearch && matchRole && matchLock;
    });
  }, [users, selectedClinicFilter, searchQuery, roleFilter, statusFilter, currentTimestamp]);

  return (
    <>
      <Helmet>
        <title>სუპერ ადმინი — AiDent Platform Control Center</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs text-white border ${
              toastMessage.type === "error"
                ? "bg-red-600 border-red-500 shadow-red-600/30"
                : "bg-emerald-600 border-emerald-500 shadow-emerald-600/30"
            }`}
          >
            {toastMessage.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      <div className="min-h-screen w-full bg-surface-soft font-nino flex flex-col text-text-main">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-main px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-purple-800 text-white flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight uppercase">
                  AiDent <span className="text-brand-purple">SuperAdmin</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  სისტემა აქტიურია
                </span>
              </div>
              <p className="text-[11px] text-text-muted font-bold truncate max-w-[240px] sm:max-w-none">
                ავტორიზებული: <span className="text-brand-purple font-mono font-bold">{currentUser?.email || SUPERADMIN_EMAIL}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Link
              to="/dashboard"
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-soft hover:bg-border-main border border-border-dark text-text-main text-xs font-black uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={14} />
              <span>კლინიკის პანელი</span>
            </Link>

            <button
              onClick={async () => {
                staffLogout?.();
                await auth.signOut();
                navigate("/auth");
              }}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              title="გამოსვლა"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">გამოსვლა</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-surface border-b border-border-main px-4 md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2">
            {[
              { id: "overview", label: "მიმოხილვა", icon: Activity, count: null },
              { id: "clinics", label: "კლინიკები", icon: Building2, count: clinics.length },
              { id: "inventory", label: "საწყობები", icon: Package, count: inventory.length },
              { id: "staff", label: "ექიმები & PIN", icon: KeyRound, count: metrics.lockedAccounts.length ? `${metrics.lockedAccounts.length} ბლოკი` : users.length },
              { id: "audit", label: "აუდიტის ჟურნალი", icon: ShieldAlert, count: auditLogs.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                      : "text-text-muted hover:text-text-main hover:bg-surface-soft"
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : tab.id === "staff" && metrics.lockedAccounts.length > 0
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-surface-soft text-text-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Quick Alert Banner if accounts locked */}
              {metrics.lockedAccounts.length > 0 && (
                <div className="p-4 md:p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-red-500">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        ყურადღება: {metrics.lockedAccounts.length} ექიმის ანგარიში დაბლოკილია!
                      </h4>
                      <p className="text-xs text-text-muted font-bold mt-0.5">
                        არასწორი PIN კოდის 4-ჯერ შეყვანის გამო დაცვის სისტემამ დაბლოკა წვდომა.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("staff");
                      setStatusFilter("locked");
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    დაბლოკილების ნახვა
                  </button>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Clinics KPI */}
                <div className="p-6 rounded-[28px] bg-surface border border-border-main shadow-sm relative overflow-hidden group hover:border-brand-purple/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                      კლინიკები
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-text-main tracking-tight mb-2">
                    {metrics.totalClinics}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} /> {metrics.activeClinics} აქტიური
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-red-500 flex items-center gap-1">
                      <Power size={13} /> {metrics.suspendedClinics} გათიშული
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-main flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-muted">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{metrics.planStats?.custom || 0} Custom</span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{metrics.planStats?.business || 0} Business</span>
                    <span>•</span>
                    <span className="text-slate-500 font-bold">{metrics.planStats?.free || 0} Free</span>
                  </div>
                </div>

                {/* Staff & Doctors KPI */}
                <div className="p-6 rounded-[28px] bg-surface border border-border-main shadow-sm relative overflow-hidden group hover:border-brand-purple/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                      პერსონალი & ექიმები
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-text-main tracking-tight mb-2">
                    {metrics.totalStaff}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <span>{metrics.totalDoctors} ექიმი</span>
                    <span>•</span>
                    <span className="text-amber-500 font-black">
                      {metrics.lockedAccounts.length} დაბლოკილი PIN
                    </span>
                  </div>
                </div>

                {/* Warehouse Valuation KPI */}
                <div className="p-6 rounded-[28px] bg-surface border border-border-main shadow-sm relative overflow-hidden group hover:border-brand-purple/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                      საწყობების ღირებულება
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-500 tracking-tight mb-2">
                    {metrics.totalInventoryValue.toLocaleString()} ₾
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <span>{metrics.totalInventoryItems} პროდუქტი</span>
                    <span>•</span>
                    <span className="text-red-400 font-bold">
                      {metrics.outOfStockItems.length} ამოწურული
                    </span>
                  </div>
                </div>

                {/* Patients Count KPI */}
                <div className="p-6 rounded-[28px] bg-surface border border-border-main shadow-sm relative overflow-hidden group hover:border-brand-purple/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                      პაციენტების ბაზა
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-text-main tracking-tight mb-2">
                    {metrics.totalPatientsCount}
                  </div>
                  <div className="text-xs font-bold text-text-muted">
                    კლინიკების საერთო მომხმარებლები
                  </div>
                </div>
              </div>

              {/* B2B SUPPLY OPPORTUNITY HUB: TOP 5 COMPANIES WITH LOWEST INVENTORY */}
              <div className="bg-surface rounded-[32px] p-6 md:p-8 border border-border-main shadow-sm relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider mb-2">
                      <Truck size={13} /> B2B მომარაგების რადარი
                    </div>
                    <h3 className="text-lg font-black text-text-main uppercase tracking-tight flex items-center gap-2.5">
                      <Package size={22} className="text-brand-purple" />
                      ტოპ 5 კომპანია ყველაზე დაბალი მარაგით (მიწოდების შეთავაზება)
                    </h3>
                    <p className="text-xs text-text-muted font-bold mt-1">
                      კომპანიები, რომელთაც მარაგი ამოეწურათ ან ეწურებათ. დაუკავშირდით პირდაპირ და შესთავაზეთ მარაგების შევსება.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[11px] uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {metrics.outOfStockItems.length} ამოწურული პოზიცია
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[11px] uppercase">
                      {metrics.lowStockItems.length} მცირე მარაგი
                    </span>
                    <button
                      onClick={() => {
                        setSelectedClinicFilter("all");
                        setStockStatusFilter("all");
                        setActiveTab("inventory");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-soft hover:bg-border-main border border-border-dark text-text-main font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>ყველა საწყობი</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Top 5 Companies Cards Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {topDeficitCompanies.map((company, index) => {
                    const clinic = company.clinic;
                    const isSuspended = clinic.subscriptionStatus === "suspended";

                    return (
                      <div
                        key={clinic.id}
                        className={`rounded-[28px] p-5 md:p-6 border transition-all flex flex-col justify-between hover:shadow-lg ${
                          company.outOfStockCount > 0
                            ? "bg-red-500/[0.02] border-red-500/30 hover:border-red-500/50"
                            : company.lowStockCount > 0
                            ? "bg-amber-500/[0.02] border-amber-500/30 hover:border-amber-500/50"
                            : "bg-surface-soft/40 border-border-main hover:border-brand-purple/40"
                        }`}
                      >
                        <div>
                          {/* Card Top: Rank, Name, Badges */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md ${
                                index === 0
                                  ? "bg-gradient-to-br from-red-500 to-rose-700 shadow-red-500/20"
                                  : index === 1
                                  ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20"
                                  : index === 2
                                  ? "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/20"
                                  : "bg-gradient-to-br from-brand-purple to-purple-800 shadow-brand-purple/20"
                              }`}>
                                #{index + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-base font-black text-text-main truncate">
                                  {clinic.clinicName || "კლინიკა"}
                                </h4>
                                <p className="text-xs text-text-muted font-bold font-mono truncate">
                                  @{clinic.loginName || clinic.id}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                              {company.outOfStockCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  {company.outOfStockCount} ამოწურულია
                                </span>
                              )}
                              {company.lowStockCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase">
                                  {company.lowStockCount} იწურება
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fast B2B Supply Contact Strip */}
                          <div className="p-3 bg-surface rounded-2xl border border-border-main flex flex-wrap items-center justify-between gap-2.5 mb-4 text-xs">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                              დაკავშირება მიწოდებისთვის:
                            </span>

                            <div className="flex items-center gap-2">
                              {clinic.phone ? (
                                <a
                                  href={`tel:${clinic.phone}`}
                                  className="px-3 py-1.5 rounded-xl bg-brand-purple text-white hover:brightness-110 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                                  title="პირდაპირ დარეკვა"
                                >
                                  <Phone size={12} />
                                  <span>{clinic.phone}</span>
                                </a>
                              ) : (
                                <span className="text-text-muted text-[11px] font-bold">ტელეფონი არ არის</span>
                              )}

                              {clinic.ownerEmail && (
                                <a
                                  href={`mailto:${clinic.ownerEmail}?subject=AiDent მარაგების შევსების შეთავაზება`}
                                  className="px-2.5 py-1.5 rounded-xl bg-surface-soft hover:bg-border-main border border-border-dark text-text-muted hover:text-text-main font-black text-[11px] uppercase transition-all"
                                  title="ელ-ფოსტით მიწერა"
                                >
                                  <Mail size={12} />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Top 5 Lowest Items in this clinic */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-wider px-1">
                              <span>ტოპ 5 კრიტიკული პოზიცია საწყობში</span>
                              <span>ნაშთი / ზღვარი</span>
                            </div>

                            {company.top5LowestItems.length === 0 ? (
                              <div className="p-4 bg-surface rounded-2xl border border-border-main text-center text-text-muted text-xs font-bold">
                                ამ კლინიკას საწყობში პროდუქტები ჯერ არ დაუმატებია
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {company.top5LowestItems.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                                      prod.isOut
                                        ? "bg-red-500/[0.04] border-red-500/25"
                                        : prod.isLow
                                        ? "bg-amber-500/[0.03] border-amber-500/25"
                                        : "bg-surface border-border-main"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-black text-text-main truncate text-xs">
                                          {prod.name}
                                        </span>
                                        <span className="text-[9px] text-text-muted font-bold px-1.5 py-0.2 rounded bg-surface-soft border border-border-main shrink-0">
                                          {prod.category}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-text-muted mt-0.5">
                                        მინ. ზღვარი: <strong className="text-text-main">{prod.minThreshold} {prod.unit}</strong>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className={`font-black text-sm flex items-center justify-end gap-1 ${
                                        prod.isOut ? "text-red-500" : prod.isLow ? "text-amber-500" : "text-emerald-500"
                                      }`}>
                                        {prod.isOut && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                        <span>{prod.quantity} {prod.unit}</span>
                                      </div>
                                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                                        prod.isOut ? "text-red-500" : prod.isLow ? "text-amber-500" : "text-emerald-500"
                                      }`}>
                                        {prod.isOut ? "ამოიწურა" : prod.isLow ? "კრიტიკული" : "ნორმა"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Warehouse Summary & View Full Actions */}
                        <div className="pt-3 border-t border-border-main flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="text-xs text-text-muted font-bold">
                            საწყობში: <strong className="text-text-main">{company.totalItems} პროდუქტი</strong>
                            {company.totalValue > 0 && (
                              <span className="ml-2 text-emerald-500">({company.totalValue.toLocaleString()} ₾)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick Modal View */}
                            <button
                              onClick={() => setWarehouseModalClinic(clinic)}
                              className="px-3 py-2 rounded-xl bg-surface hover:bg-border-main border border-border-dark text-text-main font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              title="მოდალში სწრაფად ნახვა"
                            >
                              <Eye size={13} />
                              <span>სწრაფი ხედი</span>
                            </button>

                            {/* View Full Warehouse Tab (Primary) */}
                            <button
                              onClick={() => {
                                setSelectedClinicFilter(clinic.id);
                                setStockStatusFilter("all");
                                setActiveTab("inventory");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-4 py-2 rounded-xl bg-brand-purple hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-brand-purple/20 transition-all cursor-pointer"
                            >
                              <Package size={14} />
                              <span>სრულად ნახვა</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {topDeficitCompanies.length === 0 && (
                  <div className="p-8 text-center bg-surface-soft/40 rounded-2xl text-text-muted">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                    <p className="font-bold text-sm text-text-main">ყველა კლინიკის მარაგი ნორმაშია!</p>
                    <p className="text-xs text-text-muted mt-0.5">ამ ეტაპზე ამოწურული ან კრიტიკული მარაგები არ ფიქსირდება.</p>
                  </div>
                )}
              </div>

              {/* Fast Clinic Status Overview Table */}
              <div className="bg-surface rounded-[32px] p-6 border border-border-main shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                      <Building2 size={20} className="text-brand-purple" />
                      კლინიკების მიმდინარე სტატუსი
                    </h3>
                    <p className="text-xs text-text-muted font-bold mt-0.5">
                      სწრაფი მართვა: ჩართვა, გათიშვა და საწყობების შემოწმება
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("clinics")}
                    className="text-xs font-black uppercase tracking-wider text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ყველას ნახვა <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-main text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <th className="py-3 px-4">კლინიკა</th>
                        <th className="py-3 px-4">სტატუსი</th>
                        <th className="py-3 px-4">ტარიფი</th>
                        <th className="py-3 px-4">ექიმები</th>
                        <th className="py-3 px-4">საწყობი</th>
                        <th className="py-3 px-4 text-right">მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main text-xs font-bold">
                      {clinics.slice(0, 5).map((clinic) => {
                        const isSuspended = clinic.subscriptionStatus === "suspended";
                        const staffCount = users.filter((u) => u.clinicId === clinic.id).length;
                        const itemsCount = inventory.filter((i) => i.clinicId === clinic.id).length;

                        return (
                          <tr key={clinic.id} className="hover:bg-surface-soft/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-black text-text-main">
                                {clinic.clinicName || "კლინიკა"}
                              </div>
                              <div className="text-[11px] text-text-muted font-mono">
                                @{clinic.loginName || clinic.id}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isSuspended
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-500" : "bg-emerald-500"}`} />
                                {isSuspended ? "გათიშული" : "აქტიური"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {(() => {
                                const p = normalizePlanId(clinic.plan);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => setPlanModalClinic(clinic)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 cursor-pointer ${
                                      p === "custom"
                                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                        : p === "business"
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                    }`}
                                    title="ტარიფის შეცვლა"
                                  >
                                    <Sparkles size={11} className={p === "custom" ? "text-purple-500" : "opacity-40"} />
                                    <span>
                                      {p === "custom"
                                        ? `CUSTOM (${clinic.customMaxDoctors ? `${clinic.customMaxDoctors} ექ.` : "15 ექ."})`
                                        : p === "business"
                                        ? "BUSINESS (6 ექ.)"
                                        : "FREE (3 ექ.)"}
                                    </span>
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="py-3.5 px-4 text-text-muted">
                              {staffCount} პერსონალი
                            </td>
                            <td className="py-3.5 px-4 text-text-muted">
                              {itemsCount} ერთეული
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => setStatusModalClinic(clinic)}
                                className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                                  isSuspended
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                    : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                }`}
                              >
                                {isSuspended ? "ჩართვა" : "გათიშვა"}
                              </button>
                              <button
                                onClick={() => setDetailsModalClinic(clinic)}
                                className="px-3 py-1.5 rounded-xl bg-surface-soft hover:bg-border-main text-text-main font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                              >
                                დეტალები
                              </button>
                              <button
                                onClick={() => setDeleteModalClinic(clinic)}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all cursor-pointer inline-flex items-center justify-center align-middle"
                                title="კლინიკის სრული წაშლა"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICS MANAGEMENT */}
          {activeTab === "clinics" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Controls bar */}
              <div className="bg-surface rounded-3xl p-5 border border-border-main shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ძიება: კლინიკის სახელი, @login, მეილი, ტელეფონი..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
                  >
                    <option value="all">ყველა სტატუსი</option>
                    <option value="active">🟢 მხოლოდ აქტიური</option>
                    <option value="suspended">🔴 მხოლოდ გათიშული</option>
                  </select>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
                  >
                    <option value="all">ყველა ტარიფი</option>
                    <option value="free">FREE (სატესტო — 3 ექიმი)</option>
                    <option value="business">BUSINESS (ბიზნესი — 6 ექიმი)</option>
                    <option value="custom">CUSTOM (სპეციალური)</option>
                  </select>
                </div>
              </div>

              {/* Clinics List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClinics.map((clinic) => {
                  const isSuspended = clinic.subscriptionStatus === "suspended";
                  const staffCount = users.filter((u) => u.clinicId === clinic.id).length;
                  const clinicItems = inventory.filter((i) => i.clinicId === clinic.id);
                  const inventoryValue = clinicItems.reduce(
                    (sum, i) => sum + (Number(i.quantity || 0) * Number(i.pricePerUnit || 0)),
                    0
                  );

                  return (
                    <div
                      key={clinic.id}
                      className={`bg-surface rounded-[32px] p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-lg ${
                        isSuspended
                          ? "border-red-500/30 bg-red-500/[0.02]"
                          : "border-border-main hover:border-brand-purple/40"
                      }`}
                    >
                      <div>
                        {/* Top info */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-base shrink-0">
                              {clinic.clinicName ? clinic.clinicName.charAt(0) : "C"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-black text-text-main truncate">
                                {clinic.clinicName || "კლინიკა"}
                              </h4>
                              <p className="text-xs text-text-muted font-bold font-mono">
                                @{clinic.loginName || clinic.id}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                              isSuspended
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            }`}
                          >
                            {isSuspended ? "გათიშული" : "აქტიური"}
                          </span>
                        </div>

                        {/* Owner & Contacts */}
                        <div className="bg-surface-soft rounded-2xl p-3.5 border border-border-main text-xs space-y-1.5 mb-4">
                          <div className="text-text-muted truncate">
                            <strong>მეილი:</strong> {clinic.ownerEmail || clinic.email || "—"}
                          </div>
                          <div className="text-text-muted truncate">
                            <strong>ტელეფონი:</strong> {clinic.phone || clinic.contactPhone || "—"}
                          </div>
                        </div>

                        {/* Clinic Stats Row */}
                        <div className="grid grid-cols-3 gap-2 text-center mb-5">
                          <div className="p-2.5 rounded-xl bg-surface-soft border border-border-main">
                            <p className="text-[9px] font-black text-text-muted uppercase">პერსონალი</p>
                            <p className="text-xs font-black text-text-main mt-0.5">{staffCount}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-soft border border-border-main">
                            <p className="text-[9px] font-black text-text-muted uppercase">საწყობი</p>
                            <p className="text-xs font-black text-text-main mt-0.5">{clinicItems.length} ერთ.</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-surface-soft border border-border-main">
                            <p className="text-[9px] font-black text-text-muted uppercase">ღირებულება</p>
                            <p className="text-xs font-black text-emerald-500 mt-0.5">{inventoryValue} ₾</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-4 border-t border-border-main space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          {/* Plan selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-text-muted uppercase">ტარიფი:</span>
                            <button
                              type="button"
                              onClick={() => setPlanModalClinic(clinic)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-sm ${
                                normalizePlanId(clinic.plan) === "custom"
                                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                  : normalizePlanId(clinic.plan) === "business"
                                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                  : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                              }`}
                              title="დააჭირეთ ტარიფისა და ექიმების ლიმიტის შესაცვლელად"
                            >
                              <span>
                                {normalizePlanId(clinic.plan) === "custom"
                                  ? `CUSTOM (${clinic.customMaxDoctors ? `${clinic.customMaxDoctors} ექ.` : "15 ექ."})`
                                  : normalizePlanId(clinic.plan) === "business"
                                  ? "BUSINESS (6 ექ.)"
                                  : "FREE (3 ექ.)"}
                              </span>
                              <Settings size={12} className="opacity-70" />
                            </button>
                          </div>

                          {/* Details button */}
                          <button
                            onClick={() => setDetailsModalClinic(clinic)}
                            className="text-xs font-black text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            სრული პროფილი <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* Action buttons grid */}
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => setStatusModalClinic(clinic)}
                            className={`py-2 px-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isSuspended
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                            }`}
                          >
                            <Power size={12} />
                            <span>{isSuspended ? "ჩართვა" : "გათიშვა"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedClinicFilter(clinic.id);
                              setActiveTab("inventory");
                            }}
                            className="py-2 px-1.5 rounded-xl bg-surface-soft hover:bg-border-main text-text-main font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Package size={12} />
                            <span>საწყობი</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedClinicFilter(clinic.id);
                              setActiveTab("staff");
                            }}
                            className="py-2 px-1.5 rounded-xl bg-surface-soft hover:bg-border-main text-text-main font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <KeyRound size={12} />
                            <span>ექიმები</span>
                          </button>

                          <button
                            onClick={() => setDeleteModalClinic(clinic)}
                            className="py-2 px-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="კლინიკის სრული წაშლა"
                          >
                            <Trash2 size={12} />
                            <span>წაშლა</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredClinics.length === 0 && (
                <div className="p-12 text-center bg-surface rounded-3xl border border-border-main text-text-muted">
                  <Building2 size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-sm">მოცემული ფილტრით კლინიკა ვერ მოიძებნა</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WAREHOUSES & DETAILED INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Comprehensive Filter Controls Bar */}
              <div className="bg-surface rounded-3xl p-5 border border-border-main shadow-sm space-y-4">
                {/* Row 1: Search, Clinic, Stock Status, Category, and CSV */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setInventoryPage(1);
                      }}
                      placeholder="პროდუქტის, კატეგორიის ან კლინიკის ძიება..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setInventoryPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Clinic Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-wider hidden sm:inline">
                      კლინიკა:
                    </span>
                    <select
                      value={selectedClinicFilter}
                      onChange={(e) => {
                        setSelectedClinicFilter(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-black focus:outline-none focus:border-brand-purple cursor-pointer max-w-[220px]"
                    >
                      <option value="all">ყველა კლინიკა ({clinics.length})</option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clinicName || c.loginName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Status Selector */}
                  <select
                    value={stockStatusFilter}
                    onChange={(e) => {
                      setStockStatusFilter(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer shrink-0"
                  >
                    <option value="all">ყველა სტატუსი</option>
                    <option value="out">🛑 ამოწურული (0)</option>
                    <option value="low">⚠️ მცირე მარაგი</option>
                    <option value="ok">✅ მარაგშია (ნორმა)</option>
                  </select>

                  {/* Category Selector */}
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => {
                      setInventoryCategoryFilter(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer shrink-0"
                  >
                    <option value="all">ყველა კატეგორია ({inventoryCategories.length})</option>
                    {inventoryCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportInventoryCsv}
                    className="px-4 py-2.5 rounded-2xl bg-surface-soft hover:bg-border-main border border-border-dark text-text-main text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    title="ფილტრის შედეგების CSV ექსპორტი"
                  >
                    <Download size={15} />
                    <span>CSV ({filteredAndSortedInventory.length})</span>
                  </button>
                </div>

                {/* Row 2: Price Range, Sorting Selector & Reset */}
                <div className="pt-3 border-t border-border-main flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Price Range Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-wider">
                      ფასი (₾):
                    </span>
                    <input
                      type="number"
                      placeholder="მინ"
                      value={inventoryPriceMin}
                      onChange={(e) => {
                        setInventoryPriceMin(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="w-20 px-3 py-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main font-bold focus:outline-none focus:border-brand-purple text-xs"
                    />
                    <span className="text-text-muted font-bold">—</span>
                    <input
                      type="number"
                      placeholder="მაქს"
                      value={inventoryPriceMax}
                      onChange={(e) => {
                        setInventoryPriceMax(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="w-20 px-3 py-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main font-bold focus:outline-none focus:border-brand-purple text-xs"
                    />
                  </div>

                  {/* Quick Sort Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-wider hidden sm:inline">
                      სორტირება:
                    </span>
                    <select
                      value={inventorySortKey}
                      onChange={(e) => {
                        setInventorySortKey(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main font-bold focus:outline-none focus:border-brand-purple text-xs cursor-pointer"
                    >
                      <option value="deficit">⚠️ დეფიციტით (კრიტიკული პირველი)</option>
                      <option value="name">დასახელებით (A-Z)</option>
                      <option value="clinic">კლინიკით</option>
                      <option value="category">კატეგორიით</option>
                      <option value="quantity">რაოდენობით</option>
                      <option value="price">ერთეულის ფასით</option>
                      <option value="total">ჯამური ღირებულებით</option>
                    </select>

                    <button
                      onClick={() => setInventorySortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                      className="p-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main hover:text-brand-purple transition-all cursor-pointer"
                      title={inventorySortOrder === "asc" ? "ზრდადი მიმდევრობა" : "კლებადი მიმდევრობა"}
                    >
                      {inventorySortOrder === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                    </button>
                  </div>

                  {/* Reset Filters & Page Size */}
                  <div className="flex items-center gap-3 ml-auto">
                    {isAnyInventoryFilterActive && (
                      <button
                        onClick={handleResetInventoryFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>გასუფთავება</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-text-muted uppercase tracking-wider">
                        გვერდზე:
                      </span>
                      <select
                        value={inventoryPageSize}
                        onChange={(e) => {
                          setInventoryPageSize(Number(e.target.value));
                          setInventoryPage(1);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-surface-soft border border-border-dark text-text-main font-black focus:outline-none focus:border-brand-purple text-xs cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouse Table Card */}
              <div className="bg-surface rounded-[32px] border border-border-main shadow-sm overflow-hidden">
                {/* Table Header Summary */}
                <div className="p-5 border-b border-border-main flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-soft/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
                        საწყობის დეტალური სია ({filteredAndSortedInventory.length} პროდუქტი)
                      </h3>
                      <p className="text-xs text-text-muted font-bold mt-0.5">
                        ჯამური ღირებულება:{" "}
                        <span className="text-emerald-500 font-black">
                          {filteredAndSortedInventory
                            .reduce((s, i) => s + Number(i.quantity || 0) * Number(i.pricePerUnit || 0), 0)
                            .toLocaleString()}{" "}
                          ₾
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-surface-soft border border-border-main text-[11px] font-black text-text-muted">
                      სულ: {filteredAndSortedInventory.length}
                    </span>
                    {filteredAndSortedInventory.filter((i) => Number(i.quantity || 0) === 0).length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-black text-red-500">
                        🛑 ამოწურული: {filteredAndSortedInventory.filter((i) => Number(i.quantity || 0) === 0).length}
                      </span>
                    )}
                    {filteredAndSortedInventory.filter((i) => {
                      const q = Number(i.quantity || 0);
                      const m = Number(i.minThreshold || 0);
                      return q > 0 && q <= m;
                    }).length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-black text-amber-500">
                        ⚠️ მცირე: {
                          filteredAndSortedInventory.filter((i) => {
                            const q = Number(i.quantity || 0);
                            const m = Number(i.minThreshold || 0);
                            return q > 0 && q <= m;
                          }).length
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Table with Clickable Sort Headers */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-main bg-surface-soft/40 text-[10px] font-black text-text-muted uppercase tracking-widest select-none">
                        <th
                          onClick={() => handleInventorySort("clinic")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>კლინიკა</span>
                            {inventorySortKey === "clinic" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("name")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>პროდუქტის დასახელება</span>
                            {inventorySortKey === "name" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("category")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>კატეგორია</span>
                            {inventorySortKey === "category" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("quantity")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>რაოდენობა</span>
                            {inventorySortKey === "quantity" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("price")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>ფასი / ერთ.</span>
                            {inventorySortKey === "price" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("total")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>ჯამური ფასი</span>
                            {inventorySortKey === "total" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("minThreshold")}
                          className="py-3 px-5 cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>მინ. ზღვარი</span>
                            {inventorySortKey === "minThreshold" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>

                        <th
                          onClick={() => handleInventorySort("deficit")}
                          className="py-3 px-5 text-right cursor-pointer hover:text-brand-purple transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>სტატუსი</span>
                            {inventorySortKey === "deficit" ? (
                              inventorySortOrder === "asc" ? <ArrowUp size={12} className="text-brand-purple" /> : <ArrowDown size={12} className="text-brand-purple" />
                            ) : (
                              <ArrowUpDown size={11} className="opacity-40" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main text-xs font-bold">
                      {paginatedInventory.map((item) => {
                        const qty = Number(item.quantity || 0);
                        const price = Number(item.pricePerUnit || 0);
                        const total = qty * price;
                        const min = Number(item.minThreshold || 0);
                        const isOut = qty === 0;
                        const isLow = qty <= min && !isOut;

                        const matchedClinic = clinics.find((c) => c.id === item.clinicId);

                        return (
                          <tr key={item.id} className="hover:bg-surface-soft/60 transition-colors">
                            <td className="py-3.5 px-5">
                              {matchedClinic ? (
                                <button
                                  onClick={() => setWarehouseModalClinic(matchedClinic)}
                                  className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border-main font-black text-[11px] text-brand-purple hover:bg-brand-purple/10 transition-colors cursor-pointer text-left"
                                  title="კლინიკის საწყობის გახსნა"
                                >
                                  {clinicMap[item.clinicId] || "უცნობი"}
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border-main font-black text-[11px] text-brand-purple">
                                  {clinicMap[item.clinicId] || "უცნობი"}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 font-black text-text-main">
                              {item.name}
                            </td>
                            <td className="py-3.5 px-5 text-text-muted">
                              <span className="px-2 py-0.5 rounded-md bg-surface-soft border border-border-main text-[10px] font-black uppercase">
                                {item.category || item.itemGroupId || "ზოგადი"}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-mono">
                              <span
                                className={
                                  isOut
                                    ? "text-red-500 font-black"
                                    : isLow
                                    ? "text-amber-500 font-black"
                                    : "text-text-main"
                                }
                              >
                                {qty} {item.unit || "ცალი"}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-mono text-text-muted">
                              {price} ₾
                            </td>
                            <td className="py-3.5 px-5 font-mono text-emerald-500 font-black">
                              {total.toLocaleString()} ₾
                            </td>
                            <td className="py-3.5 px-5 font-mono text-text-muted">
                              {min}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isOut
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : isLow
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                }`}
                              >
                                {isOut ? "ამოიწურა" : isLow ? "მცირე მარაგი" : "მარაგშია"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {filteredAndSortedInventory.length === 0 && (
                  <div className="p-12 text-center text-text-muted space-y-3">
                    <Package size={36} className="mx-auto opacity-30" />
                    <p className="font-bold text-sm">მოცემული ფილტრებით პროდუქტები ვერ მოიძებნა</p>
                    {isAnyInventoryFilterActive && (
                      <button
                        onClick={handleResetInventoryFilters}
                        className="px-4 py-2 rounded-xl bg-brand-purple text-white font-black text-xs uppercase tracking-wider hover:bg-brand-purple/90 transition-all cursor-pointer"
                      >
                        ფილტრების გასუფთავება
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination Footer */}
                {filteredAndSortedInventory.length > 0 && (
                  <div className="p-4 border-t border-border-main bg-surface-soft/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Range Info */}
                    <div className="text-xs text-text-muted font-bold">
                      ნაჩვენებია{" "}
                      <span className="text-text-main font-black">
                        {(safeInventoryPage - 1) * inventoryPageSize + 1} -{" "}
                        {Math.min(safeInventoryPage * inventoryPageSize, filteredAndSortedInventory.length)}
                      </span>{" "}
                      / სულ{" "}
                      <span className="text-text-main font-black">{filteredAndSortedInventory.length}</span> პროდუქტი
                      {totalInventoryPages > 1 && (
                        <span className="ml-2 text-text-muted">
                          (გვერდი {safeInventoryPage} / {totalInventoryPages})
                        </span>
                      )}
                    </div>

                    {/* Pagination Buttons */}
                    {totalInventoryPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        {/* First Page */}
                        <button
                          onClick={() => setInventoryPage(1)}
                          disabled={safeInventoryPage === 1}
                          className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="პირველი გვერდი"
                        >
                          <ChevronsLeft size={16} />
                        </button>

                        {/* Prev Page */}
                        <button
                          onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                          disabled={safeInventoryPage === 1}
                          className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="წინა გვერდი"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: totalInventoryPages }, (_, i) => i + 1)
                          .filter((pageNum) => {
                            if (totalInventoryPages <= 7) return true;
                            if (pageNum === 1 || pageNum === totalInventoryPages) return true;
                            return Math.abs(pageNum - safeInventoryPage) <= 1;
                          })
                          .reduce((acc, pageNum, idx, arr) => {
                            if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                              acc.push(-idx); // placeholder for ellipsis
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
                            const isActive = pageNum === safeInventoryPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setInventoryPage(pageNum)}
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

                        {/* Next Page */}
                        <button
                          onClick={() => setInventoryPage((p) => Math.min(totalInventoryPages, p + 1))}
                          disabled={safeInventoryPage === totalInventoryPages}
                          className="p-2 rounded-xl border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="შემდეგი გვერდი"
                        >
                          <ChevronRight size={16} />
                        </button>

                        {/* Last Page */}
                        <button
                          onClick={() => setInventoryPage(totalInventoryPages)}
                          disabled={safeInventoryPage === totalInventoryPages}
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
          )}

          {/* TAB 4: DOCTORS & STAFF / PIN RESET */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Controls bar */}
              <div className="bg-surface rounded-3xl p-5 border border-border-main shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ექიმის ძიება სახელით, ტელეფონით ან მეილით..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedClinicFilter}
                    onChange={(e) => setSelectedClinicFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-black focus:outline-none focus:border-brand-purple cursor-pointer max-w-[200px]"
                  >
                    <option value="all">ყველა კლინიკა</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clinicName || c.loginName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
                  >
                    <option value="all">ყველა როლი</option>
                    <option value="doctor">ექიმი</option>
                    <option value="admin">ადმინისტრატორი</option>
                    <option value="manager">მენეჯერი</option>
                    <option value="receptionist">რეგისტრატორი</option>
                    <option value="accountant">ბუღალტერი</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
                  >
                    <option value="all">ყველა სტატუსი</option>
                    <option value="locked">🔒 მხოლოდ დაბლოკილი</option>
                  </select>
                </div>
              </div>

              {/* Staff Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStaff.map((staff) => {
                  const now = currentTimestamp;
                  const lockUntil = staff.pinLockedUntil ? new Date(staff.pinLockedUntil).getTime() : 0;
                  const isLocked = (staff.failedPinAttempts >= 4) || (lockUntil > now);
                  const clinicName = clinicMap[staff.clinicId] || "კლინიკა";

                  return (
                    <div
                      key={staff.id}
                      className={`bg-surface rounded-[32px] p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-lg ${
                        isLocked
                          ? "border-red-500/40 bg-red-500/[0.03]"
                          : "border-border-main hover:border-brand-purple/40"
                      }`}
                    >
                      <div>
                        {/* Top Profile Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                                isLocked
                                  ? "bg-red-500/10 text-red-500 border border-red-500/30"
                                  : "bg-brand-purple/10 text-brand-purple"
                              }`}
                            >
                              {staff.fullName ? staff.fullName.charAt(0) : "D"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-text-main truncate">
                                {staff.fullName || "თანამშრომელი"}
                              </h4>
                              <p className="text-[11px] text-brand-purple font-black uppercase tracking-wider">
                                {getRoleLabel(staff.role)}
                              </p>
                            </div>
                          </div>

                          {isLocked ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1 shrink-0">
                              <Lock size={11} /> დაბლოკილი
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={11} /> აქტიური
                            </span>
                          )}
                        </div>

                        {/* Clinic Tag */}
                        <div className="mb-4">
                          <span className="px-3 py-1 rounded-xl bg-surface-soft border border-border-main text-xs font-black text-text-main inline-block">
                            🏥 {clinicName}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="bg-surface-soft rounded-2xl p-3.5 border border-border-main text-xs space-y-1.5 mb-4">
                          <div className="text-text-muted truncate">
                            <strong>ტელეფონი:</strong> {staff.phone || "—"}
                          </div>
                          <div className="text-text-muted truncate">
                            <strong>ელ-ფოსტა:</strong> {staff.email || "—"}
                          </div>
                          <div className="text-text-muted">
                            <strong>არასწორი მცდელობები:</strong>{" "}
                            <span className={staff.failedPinAttempts > 0 ? "text-red-500 font-black" : "text-text-main"}>
                              {staff.failedPinAttempts || 0} / 4
                            </span>
                          </div>
                        </div>

                        {/* Lock banner if locked */}
                        {isLocked && (
                          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold flex items-center gap-2">
                            <ShieldAlert size={16} className="shrink-0" />
                            <span>
                              ანგარიში დაბლოკილია ბრუტფორსის მცდელობების გამო.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-4 border-t border-border-main flex items-center gap-2">
                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => handleInstantUnlock(staff)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 border border-amber-500/20 font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Unlock size={14} /> განბლოკვა
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setPinResetStaff(staff);
                            setPinResetClinicName(clinicName);
                          }}
                          className={`py-2.5 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                            isLocked
                              ? "flex-1 bg-brand-purple text-white hover:bg-brand-purple/90"
                              : "w-full bg-brand-purple text-white hover:bg-brand-purple/90"
                          }`}
                        >
                          <KeyRound size={14} />
                          <span>PIN-ის დარესეტება</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStaff.length === 0 && (
                <div className="p-12 text-center bg-surface rounded-3xl border border-border-main text-text-muted">
                  <Users size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-sm">თანამშრომელი ვერ მოიძებნა</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-surface rounded-[32px] p-6 border border-border-main shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                      <ShieldAlert size={20} className="text-brand-purple" />
                      სუპერ ადმინის აუდიტის ჟურნალი
                    </h3>
                    <p className="text-xs text-text-muted font-bold mt-0.5">
                      ყველა შესრულებული მოქმედება (კლინიკის სტატუსი, PIN დარესეტება, განბლოკვა) უსაფრთხოდ ინახება
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-surface-soft border border-border-main text-xs font-mono font-bold text-text-muted">
                    სულ: {auditLogs.length} ჩანაწერი
                  </span>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const formattedDate = log.createdAt
                      ? new Date(log.createdAt).toLocaleString("ka-GE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "—";

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-surface-soft border border-border-main flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 mt-0.5">
                            <Activity size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-text-main uppercase tracking-tight">
                                {log.action}
                              </span>
                              {log.clinicName && (
                                <span className="px-2 py-0.5 rounded-md bg-surface border border-border-main text-[10px] font-bold text-brand-purple">
                                  {log.clinicName}
                                </span>
                              )}
                            </div>
                            <p className="text-text-muted font-bold mt-1">
                              {log.details}
                            </p>
                          </div>
                        </div>

                        <div className="text-right sm:text-right text-[11px] font-mono text-text-muted shrink-0">
                          <div>{formattedDate}</div>
                          <div className="text-[10px] text-brand-purple font-bold">
                            {log.adminEmail}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {auditLogs.length === 0 && (
                    <div className="p-8 text-center text-text-muted font-bold text-xs">
                      აუდიტის ჩანაწერები ჯერ არ არის
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MODALS */}
        {/* 1. Clinic Status Toggle Modal */}
        <ClinicStatusModal
          clinic={statusModalClinic}
          isOpen={Boolean(statusModalClinic)}
          onClose={() => setStatusModalClinic(null)}
          adminEmail={currentUser?.email || SUPERADMIN_EMAIL}
          onSuccess={(newStatus) => {
            showToast(
              newStatus === "suspended"
                ? "კლინიკა წარმატებით გაითიშა!"
                : "კლინიკა წარმატებით გააქტიურდა!",
              "success"
            );
          }}
        />

        {/* 2. Doctor PIN Reset Modal */}
        <DoctorPinResetModal
          staff={pinResetStaff}
          clinicName={pinResetClinicName}
          isOpen={Boolean(pinResetStaff)}
          onClose={() => setPinResetStaff(null)}
          adminEmail={currentUser?.email || SUPERADMIN_EMAIL}
          onSuccess={(staffId, newPin) => {
            showToast(`ექიმის ახალი PIN კოდია: ${newPin}`, "success");
          }}
        />

        {/* 3. Clinic Details Modal */}
        <ClinicDetailsModal
          clinic={detailsModalClinic}
          staffList={users}
          inventoryItems={inventory}
          isOpen={Boolean(detailsModalClinic)}
          onClose={() => setDetailsModalClinic(null)}
          onToggleStatus={(clinic) => setStatusModalClinic(clinic)}
          onSelectStaffPin={(staff, cName) => {
            setPinResetStaff(staff);
            setPinResetClinicName(cName);
          }}
          onSelectClinicInventory={(clinicId) => {
            setSelectedClinicFilter(clinicId);
            setActiveTab("inventory");
          }}
          onDeleteClinic={(clinic) => setDeleteModalClinic(clinic)}
          onChangePlan={(clinic) => setPlanModalClinic(clinic)}
        />

        {/* 4. Company Full Warehouse Quick Modal */}
        {warehouseModalClinic && (
          <ClinicWarehouseModal
            clinic={warehouseModalClinic}
            items={inventory}
            isOpen={Boolean(warehouseModalClinic)}
            onClose={() => setWarehouseModalClinic(null)}
            onGoToFullInventory={(clinicId) => {
              setSelectedClinicFilter(clinicId);
              setStockStatusFilter("all");
              setActiveTab("inventory");
            }}
          />
        )}

        {/* 5. Complete Cascade Deletion Modal */}
        <ClinicDeleteModal
          clinic={deleteModalClinic}
          isOpen={Boolean(deleteModalClinic)}
          onClose={() => setDeleteModalClinic(null)}
          superAdminEmail={currentUser?.email || SUPERADMIN_EMAIL}
          onSuccess={(res) => {
            if (res.authDeleted) {
              showToast("კლინიკა და მისი ყველა მონაცემი წარმატებით წაიშალა ბაზიდანაც და Auth-იდანაც!", "success");
            } else {
              showToast("კლინიკის ყველა ჩანაწერი (100%) წარმატებით წაიშალა ბაზიდან!", "success");
            }
          }}
        />

        {/* 6. Clinic Plan Management Modal */}
        <ClinicPlanModal
          clinic={planModalClinic}
          isOpen={Boolean(planModalClinic)}
          onClose={() => setPlanModalClinic(null)}
          adminEmail={currentUser?.email || SUPERADMIN_EMAIL}
          onSuccess={(newPlan, customMaxDocs) => {
            showToast(
              `კლინიკის ტარიფი წარმატებით განახლდა (${newPlan.toUpperCase()}${customMaxDocs ? `, ${customMaxDocs} ექიმის ლიმიტით` : ""})`,
              "success"
            );
          }}
        />
      </div>
    </>
  );
};

export default SuperAdminDashboard;
