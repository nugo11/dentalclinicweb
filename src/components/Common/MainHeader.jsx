import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, User, ChevronDown, LogOut, Menu, X, Smartphone } from "lucide-react";
import { auth } from "../../firebase";
import ThemeToggle from "./ThemeToggle";

const MainHeader = ({ user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-border-main" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-deep rounded-xl flex items-center justify-center text-white shadow-lg">
              <Activity size={20} />
            </div>
            <span className="text-xl md:text-2xl font-black text-text-main tracking-tighter italic">
              DentalHub
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-border-dark text-text-main"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:flex items-center space-x-10 text-[11px] font-black text-text-muted tracking-widest uppercase">
            <Link to="/" onClick={handleHomeClick} className={`${location.pathname === "/" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              მთავარი
            </Link>
            <Link to="/pricing" className={`${location.pathname === "/pricing" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              ფასები
            </Link>
            <Link to="/about" className={`${location.pathname === "/about" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              ჩვენს შესახებ
            </Link>
            <Link to="/contact" className={`${location.pathname === "/contact" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              კონტაქტი
            </Link>
            <Link to="/catalog" className={`${location.pathname.startsWith("/catalog") ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              კატალოგი
            </Link>
            <Link to="/apps" className={`${location.pathname === "/apps" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors font-black`}>
              აპლიკაციები
            </Link>
            
            <ThemeToggle className="ml-4" />

            <div className="flex items-center gap-4 relative ml-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 bg-surface-soft hover:bg-surface-soft px-4 py-2 rounded-2xl transition-all border border-border-dark group"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-all">
                      <User size={18} />
                    </div>
                    <span className="text-[11px] font-black text-text-main uppercase tracking-widest hidden md:block">
                      ჩემი პროფილი
                    </span>
                    <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-56 bg-surface rounded-[24px] shadow-2xl border border-border-main py-2 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-border-main mb-1 bg-surface-soft/50">
                          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">ავტორიზირებული</p>
                          <p className="text-[11px] font-bold text-text-main truncate tracking-tight">{user.email}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-purple/5 text-text-main transition-all cursor-pointer group">
                          <div className="p-2 rounded-lg bg-brand-purple/10 text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors">
                            <Activity size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">სამართავი პანელი</span>
                        </Link>
                        <button onClick={() => { auth.signOut(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer group">
                          <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <LogOut size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">გასვლა</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/auth" className="bg-brand-deep text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-purple transition-all shadow-xl shadow-brand-deep/10 active:scale-95">
                  შესვლა
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="lg:hidden">
        <div 
          className={`fixed inset-0 z-[9998] bg-brand-deep/80 backdrop-blur-md transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        <div className={`fixed top-0 right-0 h-screen w-[85%] max-w-sm bg-surface z-[9999] shadow-[-20px_0_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-border-main flex items-center justify-between bg-surface">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-deep rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Activity size={20} />
                  </div>
                  <span className="text-xl font-black text-text-main italic tracking-tighter">DentalHub</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-surface-soft text-text-muted hover:text-brand-purple transition-all">
                  <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-surface">
               <Link to="/" onClick={handleHomeClick} className="flex items-center justify-between p-5 rounded-[24px] bg-surface-soft/50 hover:bg-brand-purple/5 text-text-main font-black uppercase tracking-widest text-[11px] transition-all group">
                  მთავარი <ChevronDown size={14} className="-rotate-90 text-text-muted group-hover:text-brand-purple" />
               </Link>
               
               <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 rounded-[24px] bg-surface-soft/50 hover:bg-brand-purple/5 text-text-main font-black uppercase tracking-widest text-[11px] transition-all group">
                  ფასები <ChevronDown size={14} className="-rotate-90 text-text-muted group-hover:text-brand-purple" />
               </Link>

                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 rounded-[24px] bg-surface-soft/50 hover:bg-brand-purple/5 text-text-main font-black uppercase tracking-widest text-[11px] transition-all group">
                   ჩვენს შესახებ <ChevronDown size={14} className="-rotate-90 text-text-muted group-hover:text-brand-purple" />
                </Link>

                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 rounded-[24px] bg-surface-soft/50 hover:bg-brand-purple/5 text-text-main font-black uppercase tracking-widest text-[11px] transition-all group">
                   კონტაქტი <ChevronDown size={14} className="-rotate-90 text-text-muted group-hover:text-brand-purple" />
                </Link>

               <Link to="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 rounded-[24px] bg-surface-soft/50 hover:bg-brand-purple/5 text-text-main font-black uppercase tracking-widest text-[11px] transition-all group">
                  კატალოგი <ChevronDown size={14} className="-rotate-90 text-text-muted group-hover:text-brand-purple" />
               </Link>

               <Link to="/apps" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 rounded-[24px] bg-brand-purple/5 border border-brand-purple/10 text-brand-purple font-black uppercase tracking-widest text-[11px] transition-all group">
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} /> აპლიკაციები
                  </div>
                  <ChevronDown size={14} className="-rotate-90 text-brand-purple" />
                </Link>

                <div className="flex items-center justify-between p-5 mt-4 rounded-[24px] bg-surface-soft border border-border-main text-text-main font-black uppercase tracking-widest text-[11px]">
                  <span>თემა</span>
                  <ThemeToggle />
                </div>
            </div>

            <div className="p-8 border-t border-border-main bg-surface">
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-5 bg-brand-purple text-white rounded-[28px] shadow-2xl shadow-brand-purple/30 transition-all active:scale-95">
                  <div className="w-12 h-12 rounded-2xl bg-surface/20 flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">კონტროლის პანელი</p>
                    <p className="text-[13px] font-bold truncate max-w-[160px]">{user.email}</p>
                  </div>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-6 bg-brand-deep text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-deep/30 transition-all active:scale-95">
                  შესვლა სისტემაში
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full" style={{ height: 'calc(4rem + var(--safe-top))' }} />
    </>
  );
};

export default MainHeader;
