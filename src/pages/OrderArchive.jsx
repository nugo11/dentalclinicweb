import React, { useState, useEffect, useMemo } from "react";
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
  Plus
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

  const handlePrintOrder = async (order) => {
    let personalId = "";
    if (order.patientId) {
      try {
        const pDoc = await getDoc(doc(db, "patients", order.patientId));
        if (pDoc.exists()) personalId = pDoc.data().personalId || "";
      } catch (e) { console.error(e); }
    }

    generateInvoice({ ...order, personalId }, clinicData);
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
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
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
                <h1 className="text-3xl font-black text-brand-deep italic tracking-tighter">
                  შეკვეთების არქივი
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  ისტორია: {filteredData.length} დასრულებული ვიზიტი
                </p>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ძებნა პაციენტის სახელით..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 pl-12 pr-4 py-3 rounded-xl outline-none font-bold text-sm focus:ring-2 ring-brand-purple/20 transition-all border border-transparent focus:border-brand-purple"
                />
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select 
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="bg-slate-50 px-4 py-3 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest border border-transparent focus:border-brand-purple text-gray-500 cursor-pointer"
                >
                  <option value="all">ყველა მეთოდი</option>
                  <option value="cash">💵 ნაღდი</option>
                  <option value="card">💳 ბარათი</option>
                  <option value="transfer">🏦 გადმორიცხვა</option>
                </select>

                <select 
                  value={filterPayerType}
                  onChange={(e) => setFilterPayerType(e.target.value)}
                  className="bg-slate-50 px-4 py-3 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest border border-transparent focus:border-brand-purple text-gray-500 cursor-pointer"
                >
                  <option value="all">ყველა ტიპი</option>
                  <option value="personal">პერსონალური</option>
                  <option value="insurance">სადაზღვევო</option>
                  <option value="corporate">კორპორატიული</option>
                </select>
              </div>
              
              {/* Date Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="date" 
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-brand-purple text-gray-500"
                  />
                </div>
                <span className="text-gray-300 hidden sm:block">-</span>
                <div className="relative w-full sm:w-auto">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-brand-purple text-gray-500"
                  />
                </div>

                <button 
                  onClick={handleExportReport}
                  className="w-full sm:w-auto px-6 py-3 bg-brand-deep text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> ექსპორტი (PDF)
                </button>
              </div>
            </div>

            {/* Archive Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-gray-50">
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">პაციენტი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">ჩატარებული მომსახურება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">გადახდის მეთოდი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">თარიღი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">ღირებულება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">ინვოისი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.length > 0 ? (
                      currentItems.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-6">
                            <span className="font-bold text-slate-800 text-sm">{order.patientName}</span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-wrap gap-1">
                              {order.billedServices?.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[9px] font-black uppercase tracking-widest">
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
                                 <span className="text-[9px] text-gray-300 font-bold uppercase italic">მეთოდი უცნობია</span>
                               )}
                               
                               {order.payerType ? (
                                 <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter ml-1">
                                   {order.payerType === 'personal' ? 'პერსონალური' : order.payerType === 'insurance' ? 'სადაზღვევო' : 'კორპორატიული'}
                                 </span>
                               ) : (
                                 <span className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter ml-1 italic">ტიპი უცნობია</span>
                               )}
                            </div>
                          </td>
                          <td className="p-6 text-[11px] font-bold text-gray-500 italic">
                            {order.finalizedAt ? new Date(order.finalizedAt).toLocaleDateString("ka-GE", { year: 'numeric', month: 'numeric', day: 'numeric' }) : "—"}
                          </td>
                          <td className="p-6 font-black text-brand-purple">
                            {order.price} ₾
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end items-center gap-2">
                               <button
                                 onClick={() => handlePrintOrder(order)}
                                 className="p-3 text-gray-500 hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all cursor-pointer"
                                 title="ბეჭდვა"
                               >
                                 <Printer size={18} />
                               </button>
                               <button
                                 onClick={() => handlePrintOrder(order)}
                                 className="p-3 text-gray-500 hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all cursor-pointer"
                                 title="PDF ჩამოტვირთვა"
                               >
                                 <FileDown size={18} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-20 text-center text-gray-300">
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
                <div className="p-6 border-t border-gray-50 bg-slate-50/30 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    ნაჩვენებია {(currentPage - 1) * itemsPerPage + 1}-დან {Math.min(currentPage * itemsPerPage, filteredData.length)} მდე (სულ {filteredData.length})
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-slate-50 hover:text-brand-purple disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="h-10 px-4 flex items-center justify-center rounded-xl bg-white border border-gray-100 font-black text-xs text-brand-deep">
                      {currentPage} / {totalPages}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-slate-50 hover:text-brand-purple disabled:opacity-50 transition-all cursor-pointer"
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
  );
};

export default OrderArchive;