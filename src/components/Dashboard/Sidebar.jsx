import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Users,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  Archive,
  LogOut,
  ChevronLeft,
  ClipboardList,
  ChevronDown,
  PieChart,
  Package,
  Zap,
  Crown,
  CreditCard,
  Globe,
  Book,
  History
} from "lucide-react";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clinicData, userData, activeStaff, role, isAdmin, staffLogout } = useAuth(); 
  const [isMobile, setIsMobile] = useState(false);
  
  const [expandedMenus, setExpandedMenus] = useState({ 
    finance: false, 
    management: false 
  });

  const isFreePlan = clinicData?.plan === "free";
  const isDoctor = role === "doctor";
  const isAccountant = role === "accountant";
  const isReceptionist = role === "receptionist";
  const isManager = role === "manager" || isAdmin;

  useEffect(() => {
    const isFinancePath = 
      location.pathname.startsWith("/finance") || 
      location.pathname === "/treatments" || 
      location.pathname === "/archive" ||
      location.pathname === "/salary-archive";

    const isManagementPath = 
      location.pathname === "/staff" || 
      location.pathname === "/services" || 
      location.pathname === "/settings" ||
      location.pathname === "/settings/billing";

    setExpandedMenus({
      finance: isFinancePath,
      management: isManagementPath
    });
  }, [location.pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateScreenMode = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    };

    updateScreenMode();
    mediaQuery.addEventListener("change", updateScreenMode);
    return () => mediaQuery.removeEventListener("change", updateScreenMode);
  }, [setIsOpen]);

  const toggleMenu = (menu) => {
    if (!isOpen) setIsOpen(true);
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // --- მენიუს დინამიური აწყობა როლების მიხედვით ---
  const menuItems = [
    { icon: Activity, label: "მთავარი", path: "/dashboard" },
  ];

  // პაციენტები: ადმინი, მენეჯერი, ექიმი, რეგისტრატორი
  if (isAdmin || isManager || isDoctor || isReceptionist) {
    menuItems.push({ icon: Users, label: "პაციენტები", path: "/patients" });
  }

  // კალენდარი: ადმინი, მენეჯერი, ექიმი, რეგისტრატორი
  if (isAdmin || isManager || isDoctor || isReceptionist) {
    menuItems.push({ icon: Calendar, label: "კალენდარი", path: "/calendar" });
  }

  // ფინანსები: ადმინი, მენეჯერი, ბუღალტერი
  if (isAdmin || isManager || isAccountant) {
    menuItems.push({
      label: "ფინანსები",
      icon: DollarSign,
      id: "finance",
      subItems: [
        { label: "მიმოხილვა", path: "/finance", icon: PieChart },
        { label: "მიმდინარე", path: "/treatments", icon: FileText }, 
        { label: "არქივი", path: "/archive", icon: Archive }, 
        { label: "ხელფასები", path: "/salary-archive", icon: History },
      ],
    });
  }

  // საწყობი: ადმინი, მენეჯერი, ექიმი, ბუღალტერი
  if (isAdmin || isManager || isDoctor || isAccountant) {
    menuItems.push({ icon: Package, label: "საწყობი", path: "/inventory" });
  }


  // მართვა: სუბ-მენიუები როლების მიხედვით
  const managementSubItems = [];
  if (isAdmin) {
    managementSubItems.push({ label: "პერსონალი", path: "/staff", icon: Users });
    managementSubItems.push({ label: "სერვისები", path: "/services", icon: ClipboardList });
    managementSubItems.push({ label: "პორტფოლიო", path: "/settings/portfolio", icon: Globe });
    managementSubItems.push({ label: "პარამეტრები", path: "/settings", icon: Settings });
    managementSubItems.push({ label: "ბილინგი", path: "/settings/billing", icon: CreditCard });
    managementSubItems.push({ label: "აქტივობები", path: "/activity-log", icon: Activity });
  }

  if (managementSubItems.length > 0) {
    menuItems.push({
      label: "მართვა",
      icon: Settings,
      id: "management",
      subItems: managementSubItems,
    });
  }

  return (
    <>
      {isMobile && (
        <div
          className={`app-overlay fixed inset-0 backdrop-blur-sm z-40 ${isOpen ? "opacity-100 bg-brand-deep/50 pointer-events-auto" : "opacity-0 bg-brand-deep/0 pointer-events-none"}`}
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`
          app-sheet
          ${isMobile ? "fixed left-0 top-0 h-screen m-0 rounded-none z-50" : "relative m-2 rounded-[40px]"}
          ${isMobile ? "w-72" : isOpen ? "w-72" : "w-24"}
          ${isMobile ? (isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-95") : "translate-x-0 opacity-100"}
          bg-brand-deep transition-all duration-300 flex flex-col p-6 shadow-2xl overflow-hidden shrink-0
        `}
      >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-12 px-2 shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="min-w-[40px] h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-purple/20">
            <Activity size={24} />
          </div>
          {isOpen && (
            <span className="text-2xl font-black text-white whitespace-nowrap animate-in fade-in duration-500">
              DentalHub
            </span>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white/30 hover:text-white hover:bg-surface/10 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft
            size={20}
            className={`transition-transform duration-500 ${!isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* მენიუ */}
      <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 min-w-0">
        {menuItems.map((item) => {
          if (item.subItems) {
            const isExpanded = expandedMenus[item.id];
            const hasActiveSubItem = item.subItems.some(
              (sub) => location.pathname === sub.path,
            );

            return (
              <div key={item.id} className="space-y-2">
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center rounded-2xl transition-all cursor-pointer 
                    ${isOpen ? "px-4 py-4 justify-between" : "p-4 justify-center"} 
                    ${hasActiveSubItem ? "bg-surface/10 text-white" : "text-white/50 hover:bg-surface/5 hover:text-white"}`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={24} className="shrink-0" />
                    {isOpen && (
                      <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {isOpen && isExpanded && (
                  <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer 
                          ${location.pathname === sub.path ? "text-brand-purple bg-surface shadow-md" : "text-white/40 hover:text-white hover:bg-surface/5"}`}
                      >
                        <sub.icon size={18} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {sub.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-2xl transition-all cursor-pointer 
                ${isOpen ? "px-4 py-4 gap-4" : "p-4 justify-center"} 
                ${location.pathname === item.path ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20" : "text-white/50 hover:bg-surface/5 hover:text-white"}`}
            >
              <item.icon size={24} className="shrink-0" />
              {isOpen && (
                <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- Upgrade / Plan Section --- */}
      <div className="mt-6 mb-6 px-2 shrink-0">
        {isOpen ? (
          <div className={`p-5 rounded-[32px] relative overflow-hidden transition-all duration-500 ${isFreePlan ? 'bg-gradient-to-br from-brand-purple to-purple-700 shadow-xl shadow-brand-purple/20' : 'bg-surface/5 border border-white/10'}`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={14} className={isFreePlan ? "text-white" : "text-brand-purple"} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                   {clinicData?.plan === 'free' ? 'უფასო ტარიფი' : (clinicData?.plan || 'Solo') + ' პაკეტი'}
                </span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">{activeStaff?.fullName || userData?.fullName}</p>
                 <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    {role === 'admin' ? 'ადმინისტრატორი' : 
                     role === 'doctor' ? 'ექიმი' : 
                     role === 'accountant' ? 'ბუღალტერი' : 
                     role === 'receptionist' ? 'რეგისტრატორი' : 
                     role === 'manager' ? 'მენეჯერი' : role}
                 </p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-surface/10 rounded-full blur-xl"></div>
          </div>
        ) : (
          <button 
            onClick={() => isAdmin ? navigate('/settings/billing') : null}
            className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${isFreePlan ? 'bg-brand-purple text-white animate-pulse shadow-lg shadow-brand-purple/40' : 'bg-surface/5 text-white/30 hover:text-white'}`}
          >
            <Crown size={20} />
          </button>
        )}
      </div>

      {/* გამოსვლა / შეცვლა */}
      <button
        onClick={() => {
            staffLogout();
            navigate("/auth");
        }}
        className="flex items-center gap-4 px-4 py-4 text-white/40 hover:text-red-400 transition-colors shrink-0 cursor-pointer group"
      >
        <LogOut size={22} className="shrink-0" />
        <span
          className={
            !isOpen ? "hidden" : "text-xs font-black uppercase tracking-widest whitespace-nowrap"
          }
        >
          შეცვლა / გამოსვლა
        </span>
      </button>
      </aside>
    </>
  );
};

export default Sidebar;