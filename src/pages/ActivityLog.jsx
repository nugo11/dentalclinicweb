import React, { useState, useEffect } from 'react';
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

const LOGS_PER_PAGE = 20;

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
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    return matchesSearch && log.action.includes(filterType);
  });

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
    if (action.includes('delete')) return 'bg-red-50 text-red-500';
    if (action.includes('create')) return 'bg-emerald-50 text-emerald-500';
    if (action.includes('update')) return 'bg-blue-50 text-blue-500';
    if (action.includes('finance')) return 'bg-amber-50 text-amber-500';
    return 'bg-slate-50 text-slate-500';
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
    <div className="flex min-h-screen bg-bg-soft font-nino">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 transition-all duration-300 min-w-0">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-brand-deep italic tracking-tighter uppercase">
                აქტივობების ჟურნალი
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                <Activity size={12} className="text-brand-purple" />
                კლინიკის ყველა ქმედების ისტორია
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ძებნა (სახელი, ქმედება...)"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-purple transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-purple shadow-sm cursor-pointer"
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
          <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">თარიღი</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">მომხმარებელი</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ქმედება</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">დეტალები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Activity className="animate-pulse" size={48} />
                          <p className="text-[10px] font-black uppercase tracking-widest">იტვირთება...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                <Clock size={14} />
                             </div>
                             <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                               {formatDate(log.timestamp)}
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-brand-deep text-xs uppercase shadow-inner">
                               {log.userName ? log.userName.split(' ').map(n => n[0]).join('') : '??'}
                             </div>
                             <div>
                               <p className="text-sm font-black text-brand-deep truncate">{log.userName}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{log.userRole}</p>
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
                           <p className="text-xs font-bold text-slate-600 max-w-md leading-relaxed">
                             {log.details}
                           </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center">
                             <AlertTriangle size={32} />
                          </div>
                          <div>
                             <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">აქტივობები არ მოიძებნა</p>
                             <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">ბოლო 7 დღის განმავლობაში ჩანაწერები არ არის</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Load More */}
            {hasMore && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                <button 
                  onClick={() => fetchLogs(true)}
                  disabled={loadingMore}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-brand-deep rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-brand-purple hover:text-brand-purple transition-all shadow-sm disabled:opacity-50 group"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Activity size={18} className="group-hover:animate-pulse" /> მეტის ნახვა
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityLog;
