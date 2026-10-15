import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Menu, Settings, LogOut, X, Loader2, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ThemeToggle from '../Common/ThemeToggle';
import { getRoleLabel } from '../../utils/roleUtils';

const TopNav = ({ onMenuClick }) => {
  const { activeStaff, userData, staffLogout, role } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = activeStaff?.fullName || userData?.fullName || "მომხმარებელი";
  const displayRole = activeStaff?.role || userData?.role || "პერსონალი";

  const roleMap = {
    admin: "ადმინისტრატორი",
    doctor: "ექიმი",
    receptionist: "რეგისტრატორი",
    manager: "მენეჯერი",
    accountant: "ბუღალტერი"
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
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

  // Click outside and scroll to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    const handleScroll = () => {
      setShowUserMenu(false);
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <div 
      className="top-nav-header sticky top-0 px-3 sm:px-4 md:px-8 shrink-0 z-40 font-nino max-w-full select-none" 
      style={{ paddingTop: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-top, 0px)))' }}
      onTouchMove={(e) => {
        if (!e.target.closest('.overflow-y-auto')) {
          e.preventDefault();
        }
      }}
    >
      <header className="h-16 sm:h-20 md:h-22 px-4 sm:px-6 md:px-10 flex items-center justify-between bg-surface/80 backdrop-blur-xl border border-border-main rounded-2xl sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] gap-3">
        {/* Left Section: Menu button, Responsive Logo, and Search */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-border-main text-text-muted hover:text-brand-purple hover:bg-surface-soft transition-all shrink-0 active:scale-95"
            aria-label="მენიუ"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Mobile Clinic Logo to return to Dashboard (Requirement 7) */}
          <Link 
            to="/dashboard" 
            className="flex lg:hidden items-center gap-2 group select-none shrink-0"
            title="მთავარი პანელი"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-deep flex items-center justify-center text-white shadow-md shadow-brand-deep/20 group-hover:bg-brand-purple transition-colors">
              <Activity size={16} />
            </div>
            <span className="text-base font-black text-text-main italic tracking-wider">
              AiDent
            </span>
          </Link>
          
          {/* Search bar for larger screens */}
          <div className="relative w-full max-w-md group hidden sm:block" ref={searchRef}>
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" size={17} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              placeholder="მოძებნე პაციენტი (სახელი, ID, ტელეფონი)..." 
              className="w-full pl-11 md:pl-12 pr-10 py-3 md:py-3.5 bg-surface-soft/50 rounded-2xl md:rounded-[22px] outline-none font-bold text-xs md:text-[13px] text-text-main focus:bg-surface focus:ring-4 focus:ring-brand-purple/5 border border-transparent focus:border-brand-purple/20 transition-all"
            />
            {isSearching && (
              <div className="absolute right-10 md:right-12 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="animate-spin text-brand-purple" />
              </div>
            )}
            {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowResults(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main">
                    <X size={14} />
                </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-surface rounded-[28px] shadow-2xl border border-border-main overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-border-main flex justify-between items-center bg-surface-soft/30">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">პაციენტები</span>
                  <span className="text-[9px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">სულ {totalCount}</span>
                </div>
                
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-10 text-center">
                      <Loader2 className="animate-spin text-brand-purple mx-auto mb-2" size={20} />
                      <p className="text-[10px] font-bold text-text-muted uppercase">ვეძებ...</p>
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
                          className="px-6 py-4 hover:bg-surface-soft cursor-pointer transition-colors flex items-center justify-between group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-purple/5 text-brand-purple flex items-center justify-center font-black group-hover/item:bg-brand-purple group-hover/item:text-white transition-all">
                              {(patient.fullName || "?")[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-text-main leading-tight group-hover/item:text-brand-purple transition-colors">{patient.fullName}</p>
                              <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5">ID: {patient.personalId || "N/A"}</p>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-text-muted group-hover/item:text-brand-purple group-hover/item:translate-x-1 transition-all" />
                        </div>
                      ))}
                      
                      {totalCount > 5 && (
                        <button 
                          onClick={() => {
                            navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
                            setShowResults(false);
                          }}
                          className="w-full py-4 bg-surface-soft/50 hover:bg-brand-purple hover:text-white text-brand-purple text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-t border-border-main"
                        >
                          მეტის ნახვა ({totalCount - 5}+) <ArrowRight size={12} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-[10px] font-bold text-text-muted uppercase">შედეგი ვერ მოიძებნა</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Theme Toggle, Admin Settings, and User Profile */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
          <ThemeToggle className="flex scale-90 sm:scale-100" />

          {role === 'admin' && (
            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 sm:p-3.5 bg-surface-soft rounded-xl sm:rounded-2xl text-text-muted hover:text-brand-purple hover:bg-surface border border-transparent hover:border-border-main transition-all hidden md:flex active:scale-95"
              title="პარამეტრები"
            >
              <Settings size={18} className="md:w-5 md:h-5" />
            </button>
          )}
          
          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 md:pl-6 border-l border-border-main">
            <div className="text-right hidden lg:block">
              <p className="text-[13px] font-black text-text-main uppercase tracking-tighter leading-none mb-1">{displayName}</p>
              <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest opacity-70">
                  {roleMap[displayRole] || displayRole}
              </p>
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-xl sm:rounded-2xl md:rounded-[22px] flex items-center justify-center text-white shadow-lg cursor-pointer transition-all active:scale-95 ${showUserMenu ? 'bg-brand-purple' : 'bg-brand-deep shadow-brand-deep/20'}`}
                aria-label="მომხმარებლის პროფილი"
              >
                <User size={18} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
              </div>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-3 w-56 bg-surface rounded-[24px] sm:rounded-[28px] shadow-2xl border border-border-main py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 sm:px-6 py-3 sm:py-4 border-b border-border-main mb-2">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">სესია</p>
                        <p className="text-xs font-black text-text-main truncate">{displayName}</p>
                        <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest mt-0.5">
                          {roleMap[displayRole] || displayRole}
                        </p>
                      </div>
                      {role === 'admin' && (
                        <button 
                          onClick={() => { navigate('/settings'); setShowUserMenu(false); }} 
                          className="w-full px-5 sm:px-6 py-3 text-left text-[11px] font-bold text-text-muted hover:bg-surface-soft flex items-center gap-3 transition-colors cursor-pointer"
                        >
                            <Settings size={14} className="text-text-muted" /> პარამეტრები
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          staffLogout();
                        }} 
                        className="w-full px-5 sm:px-6 py-3 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                          <LogOut size={14} /> სისტემიდან გამოსვლა
                      </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default TopNav;