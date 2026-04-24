import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { 
  collection, query, where, orderBy, limit, 
  getDocs, startAfter, Timestamp, onSnapshot
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import { 
  Activity, Search, Filter, Calendar, User, 
  Settings, UserPlus, FileText, CheckCircle2, 
  Trash2, AlertTriangle, ChevronLeft, ChevronRight,
  Clock, Loader2
} from 'lucide-react';

const LOGS_PER_PAGE = 10;

const ActivityLog = () => {
  const { userData, role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async (isNextPage = false) => {
    if (!userData?.clinicId) return;
    
    if (isNextPage) setLoadingMore(true);
    else setLoading(true);

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let q = query(
        collection(db, "activity"),
        where("clinicId", "==", userData.clinicId),
        limit(LOGS_PER_PAGE)
      );

      if (isNextPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const allNewLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter locally for the 7-day requirement to avoid composite index requirement
      const newLogs = allNewLogs.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return logDate >= sevenDaysAgo;
      });

      if (isNextPage) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      // If we filtered out some logs, we might have fewer than LOGS_PER_PAGE but there could be more
      setHasMore(snapshot.docs.length === LOGS_PER_PAGE && newLogs.length > 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!userData?.clinicId) return;

    setLoading(true);
    // ბოლო 100 ლოგს მაინც წამოვიღებთ, რომ 7 დღის ფილტრმა იმუშაოს
    const q = query(
      collection(db, "activity"),
      where("clinicId", "==", userData.clinicId),
      limit(100) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const processedLogs = logsData
        .filter(log => {
          const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          return logDate >= sevenDaysAgo;
        })
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : (a.timestamp ? new Date(a.timestamp) : new Date(0));
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : (b.timestamp ? new Date(b.timestamp) : new Date(0));
          return dateB - dateA;
        });

      setLogs(processedLogs);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 100);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    return matchesSearch && log.action.includes(filterType);
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const indexOfLastItem = currentPage * LOGS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - LOGS_PER_PAGE;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const getActionIcon = (action) => {
    if (action.includes('patient')) return <User size={16} />;
    if (action.includes('appointment')) return <Calendar size={16} />;
    if (action.includes('finance') || action.includes('payment')) return <FileText size={16} />;
    if (action.includes('inventory')) return <Settings size={16} />;
    if (action.includes('delete')) return <Trash2 size={16} />;
    if (action.includes('create')) return <UserPlus size={16} />;
    if (action.includes('update')) return <CheckCircle2 size={16} />;
    return <Activity size={16} />;
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return 'bg-red-500/10 text-red-500';
    if (action.includes('create')) return 'bg-emerald-500/10 text-emerald-500';
    if (action.includes('update')) return 'bg-blue-500/10 text-blue-500';
    if (action.includes('finance')) return 'bg-amber-500/10 text-amber-500';
    return 'bg-surface-soft text-text-muted';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ka-GE', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <Helmet>
        <title>აქტივობები — AiDent</title>
      </Helmet>
      <div className="flex min-h-screen bg-surface-soft font-nino">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 transition-all duration-300 min-w-0">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-text-main italic tracking-tighter uppercase">
                აქტივობების ჟურნალი
              </h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                <Activity size={12} className="text-brand-purple" />
                კლინიკის ყველა ქმედების ისტორია
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="ძებნა (სახელი, ქმედება...)"
                  className="w-full pl-12 pr-4 py-4 bg-surface border border-border-dark rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-purple transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="bg-surface border border-border-dark rounded-2xl px-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-purple shadow-sm cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">ყველა ტიპი</option>
                <option value="patient">პაციენტები</option>
                <option value="appointment">ვიზიტები</option>
                <option value="finance">ფინანსები</option>
                <option value="inventory">ინვენტარი</option>
                <option value="update">ცვლილებები</option>
                <option value="delete">წაშლა</option>
              </select>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-surface rounded-[40px] border border-border-dark/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-soft/50 border-b border-border-main">
                    <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">თარიღი</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">მომხმარებელი</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">ქმედება</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">დეტალები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Activity className="animate-pulse" size={48} />
                          <p className="text-[10px] font-black uppercase tracking-widest">იტვირთება...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-soft/30 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-surface-soft rounded-lg text-text-muted">
                                <Clock size={14} />
                             </div>
                             <span className="text-xs font-bold text-text-muted whitespace-nowrap">
                               {formatDate(log.timestamp)}
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-surface-soft flex items-center justify-center font-black text-text-main text-xs uppercase shadow-inner">
                               {log.userName ? log.userName.split(' ').map(n => n[0]).join('') : '??'}
                             </div>
                             <div>
                               <p className="text-sm font-black text-text-main truncate">{log.userName}</p>
                               <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{log.userRole}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-tighter ${getActionColor(log.action)}`}>
                             {getActionIcon(log.action)}
                             {log.action.replace('_', ' ')}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-bold text-text-muted max-w-md leading-relaxed">
                             {log.details}
                           </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-surface-soft text-text-muted rounded-3xl flex items-center justify-center">
                             <AlertTriangle size={32} />
                          </div>
                          <div>
                             <p className="text-sm font-black uppercase tracking-widest text-text-muted italic">აქტივობები არ მოიძებნა</p>
                             <p className="text-[10px] font-bold text-text-muted uppercase mt-1">ბოლო 7 დღის განმავლობაში ჩანაწერები არ არის</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-border-main bg-surface-soft/30 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  გვერდი {currentPage} / {totalPages} — სულ {filteredLogs.length} ჩანაწერი
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 cursor-pointer rounded-xl border transition-all ${
                      currentPage === 1 
                      ? "bg-surface-soft text-text-muted border-border-main cursor-not-allowed" 
                      : "bg-surface text-text-main border-border-dark hover:border-brand-purple hover:text-brand-purple active:scale-90"
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      if (totalPages > 5 && (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1)) {
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-text-muted">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                            currentPage === pageNum
                            ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                            : "text-text-muted hover:bg-surface-soft"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 cursor-pointer rounded-xl border transition-all ${
                      currentPage === totalPages 
                      ? "bg-surface-soft text-text-muted border-border-main cursor-not-allowed" 
                      : "bg-surface text-text-main border-border-dark hover:border-brand-purple hover:text-brand-purple active:scale-90"
                    }`}
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
    </>
  );
};

export default ActivityLog;
