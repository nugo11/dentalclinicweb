import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import {
  Archive,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
  Printer,
  FileText,
  FileDown,
  Plus,
  Loader2
} from "lucide-react";
import { generateInvoice } from "../utils/generateInvoice";
import { generateFinancialReport } from "../utils/generateFinancialReport";

const OrderArchive = () => {
  const { userData, clinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [archiveData, setArchiveData] = useState([]);
  
  // ფილტრების State
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMethod, setFilterMethod] = useState("all"); // all, cash, card, transfer
  const [filterPayerType, setFilterPayerType] = useState("all"); // all, personal, insurance, corporate
  
  // პაგინაციის State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // რამდენი ჩანაწერი გამოჩნდეს 1 გვერდზე

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", userData.clinicId),
      where("status", "==", "completed_and_billed")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // ვასორტირებთ თარიღით კლებადობით (უახლესი ზემოთ)
      const sortedData = data.sort((a, b) => new Date(b.finalizedAt) - new Date(a.finalizedAt));
      setArchiveData(sortedData);
    });

    return () => unsubscribe();
  }, [userData]);

  const [printingId, setPrintingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrintOrder = async (order) => {
    setPrintingId(order.id);
    let personalId = "";
    if (order.patientId) {
      try {
        const pDoc = await getDoc(doc(db, "patients", order.patientId));
        if (pDoc.exists()) personalId = pDoc.data().personalId || "";
      } catch (e) { console.error(e); }
    }

    await generateInvoice({ ...order, personalId }, clinicData);
    setPrintingId(null);
  };

  // 1. ფილტრაციის ლოგიკა (Search & Date Range)
  const filteredData = useMemo(() => {
    return archiveData.filter(order => {
      const matchName = order.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchMethod = filterMethod === "all" || (order.paymentMethod && order.paymentMethod === filterMethod);
      const matchPayer = filterPayerType === "all" || (order.payerType && order.payerType === filterPayerType);

      let matchDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.finalizedAt).getTime();
        const start = dateFrom ? new Date(dateFrom).getTime() : 0;
        const end = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity;
        matchDate = orderDate >= start && orderDate <= end;
      }

      return matchName && matchDate && matchMethod && matchPayer;
    });
  }, [archiveData, searchTerm, dateFrom, dateTo, filterMethod, filterPayerType]);

  // 2. პაგინაციის (გვერდების) ლოგიკა
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // 3. ექსპორტის ფუნქცია
  const handleExportReport = () => {
    handlePrintOrder(currentItems[0]); // Placeholder for generic print
  };

  // თუ ფილტრი შეიცვალა, ვბრუნდებით პირველ გვერდზე
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, filterMethod, filterPayerType]);

  return (
    <>
      <Helmet>
        <title>შეკვეთების არქივი — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8 pb-10">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center">
                <Archive size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">
                  შეკვეთების არქივი
                </h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                  ისტორია: {filteredData.length} დასრულებული ვიზიტი
                </p>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-surface p-4 sm:p-6 rounded-[32px] border border-border-main shadow-sm space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Search */}
                <div className="lg:col-span-5 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="text" 
                    placeholder="ძებნა პაციენტის სახელით..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-soft pl-12 pr-4 py-3.5 rounded-2xl outline-none font-bold text-sm focus:ring-4 ring-brand-purple/5 transition-all border border-transparent focus:border-brand-purple"
                  />
                </div>

                {/* Selects */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                  <select 
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="bg-surface-soft px-4 py-3.5 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest border border-transparent focus:border-brand-purple text-text-muted cursor-pointer"
                  >
                    <option value="all">ყველა მეთოდი</option>
                    <option value="cash">💵 ნაღდი</option>
                    <option value="card">💳 ბარათი</option>
                    <option value="transfer">🏦 გადმორიცხვა</option>
                  </select>

                  <select 
                    value={filterPayerType}
                    onChange={(e) => setFilterPayerType(e.target.value)}
                    className="bg-surface-soft px-4 py-3.5 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest border border-transparent focus:border-brand-purple text-text-muted cursor-pointer"
                  >
                    <option value="all">ყველა ტიპი</option>
                    <option value="personal">პერსონალური</option>
                    <option value="insurance">სადაზღვევო</option>
                    <option value="corporate">კორპორატიული</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-border-main/50">
                {/* Date Filters */}
                <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input 
                      type="date" 
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-surface-soft pl-12 pr-4 py-3.5 rounded-2xl outline-none text-xs font-bold border border-transparent focus:border-brand-purple text-text-muted"
                    />
                  </div>
                  <span className="text-text-muted hidden sm:block font-black opacity-30">—</span>
                  <div className="relative w-full">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input 
                      type="date" 
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full bg-surface-soft pl-12 pr-4 py-3.5 rounded-2xl outline-none text-xs font-bold border border-transparent focus:border-brand-purple text-text-muted"
                    />
                  </div>
                </div>

                {/* Export Button */}
                <div className="lg:col-span-4">
                  <button 
                    disabled={isExporting}
                    onClick={async () => {
                      setIsExporting(true);
                      await generateFinancialReport(filteredData, dateFrom, dateTo, clinicData);
                      setIsExporting(false);
                    }}
                    className="w-full px-6 py-4 bg-brand-purple text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-deep transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-purple/20 disabled:opacity-50 active:scale-95"
                  >
                    {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />} 
                    ექსპორტი (PDF)
                  </button>
                </div>
              </div>
            </div>

            {/* Archive Table */}
            <div className="bg-surface rounded-[32px] border border-border-main shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft/50 border-b border-border-main">
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">პაციენტი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">ჩატარებული მომსახურება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">გადახდის მეთოდი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">თარიღი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">ღირებულება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest text-right">ინვოისი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {currentItems.length > 0 ? (
                      currentItems.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-soft/50 transition-colors group">
                          <td className="p-6">
                            <span className="font-bold text-text-main text-sm">{order.patientName}</span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-wrap gap-1">
                              {order.billedServices?.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 bg-surface-soft text-text-muted rounded-md text-[9px] font-black uppercase tracking-widest">
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                               {order.paymentMethod ? (
                                 <span className="px-2 py-1 bg-brand-purple/5 text-brand-purple rounded-md text-[9px] font-black uppercase tracking-widest inline-block w-fit">
                                   {order.paymentMethod === 'cash' ? '💵 ნაღდი' : order.paymentMethod === 'card' ? '💳 ბარათი' : '🏦 გადმორიცხვა'}
                                 </span>
                               ) : (
                                 <span className="text-[9px] text-text-muted font-bold uppercase italic">მეთოდი უცნობია</span>
                               )}
                               
                               {order.payerType ? (
                                 <span className="text-[8px] text-text-muted font-bold uppercase tracking-tighter ml-1">
                                   {order.payerType === 'personal' ? 'პერსონალური' : order.payerType === 'insurance' ? 'სადაზღვევო' : 'კორპორატიული'}
                                 </span>
                               ) : (
                                 <span className="text-[8px] text-text-muted font-bold uppercase tracking-tighter ml-1 italic">ტიპი უცნობია</span>
                               )}
                            </div>
                          </td>
                          <td className="p-6 text-[11px] font-bold text-text-muted italic">
                            {order.finalizedAt ? new Date(order.finalizedAt).toLocaleDateString("ka-GE", { year: 'numeric', month: 'numeric', day: 'numeric' }) : "—"}
                          </td>
                          <td className="p-6 font-black text-brand-purple">
                            {order.price} ₾
                          </td>
                          <td className="p-6 text-right">
                             <div className="flex justify-end items-center gap-2">
                                <button
                                  disabled={printingId === order.id}
                                  onClick={() => handlePrintOrder(order)}
                                  className="p-3 text-text-muted hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                  title="ბეჭდვა"
                                >
                                  {printingId === order.id ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                                </button>
                                <button
                                  disabled={printingId === order.id}
                                  onClick={() => handlePrintOrder(order)}
                                  className="p-3 text-text-muted hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                  title="PDF ჩამოტვირთვა"
                                >
                                  {printingId === order.id ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-20 text-center text-text-muted">
                          <Receipt size={40} className="mx-auto mb-4 opacity-50" />
                          <p className="font-black text-[10px] uppercase tracking-widest">ჩანაწერები არ მოიძებნა</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-border-main bg-surface-soft/30 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    ნაჩვენებია {(currentPage - 1) * itemsPerPage + 1}-დან {Math.min(currentPage * itemsPerPage, filteredData.length)} მდე (სულ {filteredData.length})
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border-main text-text-muted hover:bg-surface-soft hover:text-brand-purple disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="h-10 px-4 flex items-center justify-center rounded-xl bg-surface border border-border-main font-black text-xs text-text-main">
                      {currentPage} / {totalPages}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border-main text-text-muted hover:bg-surface-soft hover:text-brand-purple disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default OrderArchive;