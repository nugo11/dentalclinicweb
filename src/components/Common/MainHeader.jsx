import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, User, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { auth } from "../../firebase";

const MainHeader = ({ user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-deep rounded-xl flex items-center justify-center text-white shadow-lg">
              <Activity size={20} />
            </div>
            <span className="text-xl md:text-2xl font-black text-brand-deep tracking-tighter italic">
              DentalHub
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 text-brand-deep"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:flex items-center space-x-10 text-[11px] font-black text-gray-500 tracking-widest uppercase">
            <Link to="/" className={`${location.pathname === "/" ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              მთავარი
            </Link>
            {isLanding && (
              <>
                <a href="#about" className="hover:text-brand-purple transition-colors">ჩვენს შესახებ</a>
                <a href="#features" className="hover:text-brand-purple transition-colors">ფუნქციები</a>
                <a href="#faq" className="hover:text-brand-purple transition-colors">FAQ</a>
                <a href="#pricing" className="hover:text-brand-purple transition-colors">ფასები</a>
              </>
            )}
            <Link to="/catalog" className={`${location.pathname.startsWith("/catalog") ? "text-brand-purple" : "hover:text-brand-purple"} transition-colors`}>
              კატალოგი
            </Link>

            <div className="flex items-center gap-4 relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-2xl transition-all border border-gray-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-all">
                      <User size={18} />
                    </div>
                    <span className="text-[11px] font-black text-brand-deep uppercase tracking-widest hidden md:block">
                      ჩემი პროფილი
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-56 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 mb-1 bg-gray-50/50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">ავტორიზირებული</p>
                          <p className="text-[11px] font-bold text-brand-deep truncate tracking-tight">{user.email}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-purple/5 text-brand-deep transition-all cursor-pointer group">
                          <div className="p-2 rounded-lg bg-brand-purple/10 text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors">
                            <Activity size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">სამართავი პანელი</span>
                        </Link>
                        <button onClick={() => { auth.signOut(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-red-500 transition-all cursor-pointer group">
                          <div className="p-2 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 md:top-20 bg-white z-[40] animate-in slide-in-from-top-4 duration-300 overflow-y-auto">
            <div className="p-6 flex flex-col gap-6">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-deep uppercase tracking-widest border-b border-gray-50 pb-4">მთავარი</Link>
              {isLanding && (
                <>
                  <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-deep uppercase tracking-widest border-b border-gray-50 pb-4">ჩვენს შესახებ</a>
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-deep uppercase tracking-widest border-b border-gray-50 pb-4">ფუნქციები</a>
                  <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-deep uppercase tracking-widest border-b border-gray-50 pb-4">ფასები</a>
                </>
              )}
              <Link to="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-deep uppercase tracking-widest border-b border-gray-50 pb-4">კატალოგი</Link>
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-brand-purple uppercase tracking-widest">კონტროლის პანელი</Link>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-brand-deep text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest text-center shadow-2xl">შესვლა</Link>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from going under the fixed navbar */}
      <div className="h-16 md:h-20 w-full" />
    </>
  );
};

export default MainHeader;
