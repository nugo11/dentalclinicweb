import React, { useState, useMemo } from "react";
import { 
  X, Package, Search, Phone, Mail, AlertTriangle, 
  CheckCircle2, DollarSign, Download, ArrowRight, Building2,
  AlertOctagon, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RotateCcw
} from "lucide-react";

const ClinicWarehouseModal = ({ 
  clinic, 
  items = [], 
  isOpen, 
  onClose, 
  onGoToFullInventory 
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'out' | 'low' | 'ok'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState("deficit"); // 'deficit' | 'name' | 'category' | 'quantity' | 'minThreshold' | 'price' | 'total'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination and search when clinic changes
  React.useEffect(() => {
    if (clinic?.id) {
      setCurrentPage(1);
      setSearch("");
      setStatusFilter("all");
      setCategoryFilter("all");
    }
  }, [clinic?.id]);

  const clinicId = clinic?.id;
  const clinicItems = useMemo(() => {
    if (!clinicId) return [];
    return items.filter((i) => i.clinicId === clinicId);
  }, [items, clinicId]);

  // Available categories in this clinic's inventory
  const categories = useMemo(() => {
    const set = new Set();
    clinicItems.forEach((item) => {
      const c = (item.category || item.itemGroupId || "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ka"));
  }, [clinicItems]);

  // Quick stats for this clinic
  const stats = useMemo(() => {
    let outCount = 0;
    let lowCount = 0;
    let totalValue = 0;

    clinicItems.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const min = Number(item.minThreshold || 0);
      const price = Number(item.pricePerUnit || 0);
      totalValue += qty * price;

      if (qty === 0) outCount++;
      else if (qty <= min) lowCount++;
    });

    return {
      total: clinicItems.length,
      outCount,
      lowCount,
      totalValue,
    };
  }, [clinicItems]);

  // Filtered and sorted list
  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = clinicItems.filter((item) => {
      const matchSearch =
        q === "" ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

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

      const itemCat = (item.category || item.itemGroupId || "").trim();
      const matchCat = categoryFilter === "all" || itemCat === categoryFilter;

      return matchSearch && matchStatus && matchCat;
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
      } else if (sortKey === "category") {
        comparison = (a.category || "").localeCompare(b.category || "", "ka");
      } else if (sortKey === "quantity") {
        comparison = qtyA - qtyB;
      } else if (sortKey === "minThreshold") {
        comparison = minA - minB;
      } else if (sortKey === "price") {
        comparison = priceA - priceB;
      } else if (sortKey === "total") {
        comparison = totalA - totalB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [clinicItems, search, statusFilter, categoryFilter, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, safePage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const isFilterActive = search !== "" || statusFilter !== "all" || categoryFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortKey("deficit");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  if (!isOpen || !clinic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-nino">
      <div className="max-w-4xl w-full max-h-[90vh] bg-surface rounded-[36px] shadow-2xl border border-border-main flex flex-col overflow-hidden text-text-main">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border-main flex items-center justify-between shrink-0 bg-surface-soft/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-purple-800 text-white flex items-center justify-center shadow-lg shadow-brand-purple/20 shrink-0">
              <Package size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-text-main tracking-tight">
                  {clinic.clinicName || "კლინიკის"} საწყობი
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple font-black text-[10px] uppercase">
                  @{clinic.loginName || clinic.id}
                </span>
                {stats.outCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {stats.outCount} ამოწურულია
                  </span>
                )}
                {stats.lowCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase">
                    {stats.lowCount} იწურება
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted font-bold mt-1">
                სრული საწყობის ინვენტარიზაცია და მარაგების შევსების შეთავაზება
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Contact & Metrics Strip */}
        <div className="p-4 md:p-5 bg-surface border-b border-border-main grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 bg-surface-soft rounded-2xl border border-border-main text-center">
            <span className="text-[10px] font-black text-text-muted uppercase">სულ პროდუქცია</span>
            <p className="text-base font-black text-text-main mt-0.5">{stats.total} ერთეული</p>
          </div>
          <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/20 text-center">
            <span className="text-[10px] font-black text-red-500 uppercase">ამოწურული (0)</span>
            <p className="text-base font-black text-red-500 mt-0.5">{stats.outCount} პოზიცია</p>
          </div>
          <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-center">
            <span className="text-[10px] font-black text-amber-500 uppercase">მცირე მარაგი</span>
            <p className="text-base font-black text-amber-500 mt-0.5">{stats.lowCount} პოზიცია</p>
          </div>
          <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center">
            <span className="text-[10px] font-black text-emerald-600 uppercase">საწყობის ღირებულება</span>
            <p className="text-base font-black text-emerald-600 mt-0.5">{stats.totalValue.toLocaleString()} ₾</p>
          </div>
        </div>

        {/* Contact Clinic Quick Bar */}
        {(clinic.phone || clinic.ownerEmail) && (
          <div className="px-6 py-3 bg-brand-purple/5 border-b border-border-main flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-text-muted font-bold">
              <span className="text-[11px] font-black text-brand-purple uppercase tracking-wider">
                მომარაგების შეთავაზება:
              </span>
              <span>დაუკავშირდით კლინიკას მარაგის შესავსებად</span>
            </div>
            <div className="flex items-center gap-2">
              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-brand-purple text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all"
                >
                  <Phone size={13} />
                  <span>დარეკვა: {clinic.phone}</span>
                </a>
              )}
              {clinic.ownerEmail && (
                <a
                  href={`mailto:${clinic.ownerEmail}?subject=AiDent მარაგების შევსების შეთავაზება`}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border-dark text-text-main font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-surface-soft transition-all"
                >
                  <Mail size={13} />
                  <span>მეილი</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Detailed Filter & Search Bar */}
        <div className="p-4 border-b border-border-main flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-surface">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="პროდუქტის ძებნა ამ კლინიკის საწყობში..."
              className="w-full pl-10 pr-3 py-2 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple cursor-pointer shrink-0"
            >
              <option value="all">ყველა კატეგორია</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-brand-purple text-white shadow-sm"
                  : "bg-surface-soft text-text-muted hover:text-text-main"
              }`}
            >
              ყველა ({clinicItems.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("out");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === "out"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              }`}
            >
              ამოწურული ({stats.outCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter("low");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === "low"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              }`}
            >
              მცირე ({stats.lowCount})
            </button>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="p-1.5 rounded-xl bg-surface-soft hover:bg-border-main text-text-muted hover:text-text-main transition-colors cursor-pointer"
                title="ფილტრის გასუფთავება"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Products Table */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {filteredAndSorted.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Package size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">პროდუქცია ვერ მოიძებნა</p>
              {clinicItems.length === 0 ? (
                <p className="text-xs text-text-muted mt-1">ამ კლინიკას საწყობში პროდუქტი ჯერ არ დაუმატებია</p>
              ) : isFilterActive ? (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-brand-purple text-white font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
                >
                  ფილტრის გასუფთავება
                </button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-main text-[10px] font-black text-text-muted uppercase tracking-widest select-none">
                    <th
                      onClick={() => handleSort("name")}
                      className="py-3 px-3 cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>დასახელება</span>
                        {sortKey === "name" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("category")}
                      className="py-3 px-3 cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>კატეგორია</span>
                        {sortKey === "category" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("quantity")}
                      className="py-3 px-3 text-center cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>ნაშთი</span>
                        {sortKey === "quantity" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("minThreshold")}
                      className="py-3 px-3 text-center cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>მინ. ზღვარი</span>
                        {sortKey === "minThreshold" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("price")}
                      className="py-3 px-3 cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>ერთ. ფასი</span>
                        {sortKey === "price" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("total")}
                      className="py-3 px-3 cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>ჯამური ფასი</span>
                        {sortKey === "total" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("deficit")}
                      className="py-3 px-3 text-right cursor-pointer hover:text-brand-purple transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>სტატუსი</span>
                        {sortKey === "deficit" ? (
                          sortOrder === "asc" ? <ArrowUp size={11} className="text-brand-purple" /> : <ArrowDown size={11} className="text-brand-purple" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main text-xs font-bold">
                  {paginatedItems.map((item) => {
                    const qty = Number(item.quantity || 0);
                    const min = Number(item.minThreshold || 0);
                    const price = Number(item.pricePerUnit || 0);
                    const total = qty * price;

                    const isOut = qty === 0;
                    const isLow = qty > 0 && qty <= min;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-surface-soft/60 transition-colors ${
                          isOut ? "bg-red-500/[0.03]" : isLow ? "bg-amber-500/[0.02]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-black text-text-main">{item.name}</div>
                          <div className="text-[10px] text-text-muted">ერთეული: {item.unit || "ცალი"}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-surface-soft border border-border-main text-text-muted text-[10px] font-black uppercase">
                            {item.category || item.itemGroupId || "მასალა"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`text-sm font-black ${
                            isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-text-main"
                          }`}>
                            {qty} {item.unit || "ცალი"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-text-muted">
                          {min} {item.unit || "ცალი"}
                        </td>
                        <td className="py-3.5 px-3 text-text-muted">
                          {price > 0 ? `${price} ₾` : "—"}
                        </td>
                        <td className="py-3.5 px-3 font-black text-emerald-500">
                          {total > 0 ? `${total.toLocaleString()} ₾` : "0 ₾"}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOut
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : isLow
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isOut ? "bg-red-500 animate-pulse" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            {isOut ? "ამოიწურა" : isLow ? "მცირე მარაგი" : "მარაგშია"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination Controls */}
        <div className="p-4 md:p-5 border-t border-border-main flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-surface-soft/40">
          <div className="flex items-center gap-3 text-xs text-text-muted font-bold">
            <span>
              ნაჩვენებია <strong className="text-text-main">{filteredAndSorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredAndSorted.length)}</strong> / სულ <strong className="text-text-main">{filteredAndSorted.length}</strong>
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1 rounded-lg border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="წინა გვერდი"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-black px-1.5">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1 rounded-lg border border-border-dark bg-surface hover:bg-surface-soft text-text-main disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="შემდეგი გვერდი"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface border border-border-dark text-text-muted hover:text-text-main font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              დახურვა
            </button>

            <button
              onClick={() => {
                onClose();
                onGoToFullInventory?.(clinic.id);
              }}
              className="px-4 py-2 rounded-xl bg-brand-purple hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-purple/20"
            >
              <Package size={14} />
              <span>საწყობის სრულ სიაზე გადასვლა</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicWarehouseModal;
