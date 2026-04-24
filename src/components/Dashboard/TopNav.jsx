import React, { useState } from 'react';
import { Search, Bell, User, Menu, Settings, LogOut, X, Book, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

const TopNav = ({ onMenuClick }) => {
  const { activeStaff, userData, staffLogout, role } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const initialNotifications = [
    { id: 1, text: "ახალი ჯავშანი: ლევან კაპანაძე", time: "5 წუთის წინ", type: "appointment" },
    { id: 2, text: "მარაგი იწურება: სტომატოლოგიური ბჟენი", time: "1 საათის წინ", type: "inventory" }
  ];

  // ვფილტრავთ ნოთიფიკაციებს როლის მიხედვით (მაგალითად რეგისტრატორს არ მიუვა ინვენტარის შეტყობინება)
  const hasInventoryAccess = role === 'admin' || role === 'manager' || role === 'doctor' || role === 'accountant';
  
  const [notifications, setNotifications] = useState(
    initialNotifications.filter(n => n.type !== 'inventory' || hasInventoryAccess)
  );

  const displayName = activeStaff?.fullName || userData?.fullName || "მომხმარებელი";
  const displayRole = activeStaff?.role || userData?.role || "პერსონალი";

  const roleMap = {
    admin: "ადმინისტრატორი",
    doctor: "ექიმი",
    receptionist: "რეცეფცია",
    manager: "მენეჯერი",
    accountant: "ბუღალტერი"
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Live Search Logic
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setTotalCount(0);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        const q = query(
          collection(db, "patients"),
          where("clinicId", "==", userData.clinicId)
        );
        const snapshot = await getDocs(q);
        const allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filtered = allPatients.filter(p => 
          (p.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.personalId || "").includes(searchQuery) ||
          (p.phone || "").includes(searchQuery)
        );

        setTotalCount(filtered.length);
        setSearchResults(filtered.slice(0, 5));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, userData?.clinicId]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-4 md:px-8 shrink-0 z-30 font-nino" style={{ paddingTop: 'calc(1rem + var(--safe-top))' }}>
      <header className="h-20 md:h-22 px-6 md:px-10 flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 rounded-2xl border border-slate-100 text-slate-500 hover:text-brand-purple hover:bg-slate-50 transition-all"
          >
            <Menu size={20} />
          </button>
          
          <div className="relative w-full max-w-md group hidden sm:block" ref={searchRef}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-purple transition-colors" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              placeholder="მოძებნე პაციენტი (სახელი, ID, ტელეფონი)..." 
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50/50 rounded-[22px] outline-none font-bold text-[13px] text-brand-deep focus:bg-white focus:ring-4 focus:ring-brand-purple/5 border border-transparent focus:border-brand-purple/20 transition-all"
            />
            {isSearching && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="animate-spin text-brand-purple" />
              </div>
            )}
            {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowResults(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    <X size={14} />
                </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">პაციენტები</span>
                  <span className="text-[9px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">სულ {totalCount}</span>
                </div>
                
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-10 text-center">
                      <Loader2 className="animate-spin text-brand-purple mx-auto mb-2" size={20} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ვეძებ...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map(patient => (
                        <div 
                          key={patient.id} 
                          onClick={() => {
                            navigate(`/patients/${patient.id}`);
                            setShowResults(false);
                            setSearchQuery("");
                          }}
                          className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-purple/5 text-brand-purple flex items-center justify-center font-black group-hover/item:bg-brand-purple group-hover/item:text-white transition-all">
                              {(patient.fullName || "?")[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-brand-deep leading-tight group-hover/item:text-brand-purple transition-colors">{patient.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">ID: {patient.personalId || "N/A"}</p>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-slate-200 group-hover/item:text-brand-purple group-hover/item:translate-x-1 transition-all" />
                        </div>
                      ))}
                      
                      {totalCount > 5 && (
                        <button 
                          onClick={() => {
                            navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
                            setShowResults(false);
                          }}
                          className="w-full py-4 bg-slate-50/50 hover:bg-brand-purple hover:text-white text-brand-purple text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-t border-slate-50"
                        >
                          მეტის ნახვა ({totalCount - 5}+) <ArrowRight size={12} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">შედეგი ვერ მოიძებნა</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Notifications & Help & Settings */}
          <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/documentation')}
                className="hidden md:flex items-center gap-2 px-5 py-3 bg-brand-purple/10 text-brand-purple rounded-2xl hover:bg-brand-purple hover:text-white transition-all group border border-brand-purple/20"
                title="დახმარება"
              >
                <Book size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">დახმარება</span>
              </button>

              <button 
                onClick={() => navigate('/documentation')}
                className="flex md:hidden p-3.5 bg-slate-50 text-slate-400 rounded-2xl transition-all border border-transparent"
              >
                <Book size={20} />
              </button>

              <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-3.5 rounded-2xl transition-all border ${showNotifications ? "bg-brand-purple text-white border-brand-purple" : "bg-slate-50 text-slate-400 hover:text-brand-purple hover:bg-white border-transparent hover:border-slate-100"}`}
                >
                  <Bell size={20} className={showNotifications ? "" : "group-hover:animate-bounce"} />
                  {notifications.length > 0 && (
                    <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white ${showNotifications ? "bg-white" : "bg-red-500"}`}></span>
                  )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black text-brand-deep uppercase tracking-tighter text-sm">შეტყობინებები</h4>
                            {notifications.length > 0 && (
                                <span className="px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full text-[9px] font-black uppercase">{notifications.length} ახალი</span>
                            )}
                        </div>
                        
                        <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className="flex gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group/item relative transition-all">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'appointment' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                            <Bell size={18} />
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <p className="text-[11px] font-black text-brand-deep leading-tight">{notif.text}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{notif.time}</p>
                                        </div>
                                        <button 
                                            onClick={() => dismissNotification(notif.id)}
                                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <Bell size={24} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">შეტყობინებები არ არის</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
              </div>

              {role === 'admin' && (
                <button 
                  onClick={() => navigate('/settings')}
                  className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-purple hover:bg-white border border-transparent hover:border-slate-100 transition-all hidden md:flex"
                >
                  <Settings size={20} />
                </button>
              )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div className="text-right hidden lg:block">
              <p className="text-[13px] font-black text-brand-deep uppercase tracking-tighter leading-none mb-1">{displayName}</p>
              <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest opacity-70">
                  {roleMap[displayRole] || displayRole}
              </p>
            </div>
            
            <div className="relative group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-[22px] bg-brand-deep flex items-center justify-center text-white shadow-xl shadow-brand-deep/20 cursor-pointer group-hover:scale-105 transition-all">
                <User size={22} />
              </div>
              
              <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-[28px] shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-3 z-50 overflow-hidden translate-y-2 group-hover:translate-y-0">
                  <div className="px-6 py-4 border-b border-slate-50 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">სესია</p>
                    <p className="text-xs font-black text-brand-deep truncate">{displayName}</p>
                  </div>
                  {role === 'admin' && (
                    <button onClick={() => navigate('/settings')} className="w-full px-6 py-3 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <Settings size={14} className="text-slate-400" /> პარამეტრები
                    </button>
                  )}
                  <button onClick={staffLogout} className="w-full px-6 py-3 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                      <LogOut size={14} /> სისტემიდან გამოსვლა
                  </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default TopNav;