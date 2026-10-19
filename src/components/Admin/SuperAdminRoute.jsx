import React from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../context/AuthContext";
import { SUPERADMIN_EMAIL, isSuperAdminUser } from "../../utils/superAdmin";
import { ShieldAlert, ArrowLeft, LogOut, Lock, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "../../firebase";

const SuperAdminRoute = ({ children }) => {
  const { currentUser, userData, loading, staffLogout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-surface-soft flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple animate-pulse">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">
            მოწმდება უსაფრთხოების უფლებები...
          </p>
        </div>
      </div>
    );
  }

  // თუ მომხმარებელი საერთოდ არ არის ავტორიზებული
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const isAuthorized = isSuperAdminUser(currentUser, userData);

  // თუ ავტორიზებულია მაგრამ არ გააჩნია სუპერ ადმინის უფლება (არასწორი მეილი ან არ არის admin როლი)
  if (!isAuthorized) {
    return (
      <>
        <Helmet>
          <title>403 წვდომა შეზღუდულია — AiDent SuperAdmin</title>
        </Helmet>
        <div className="min-h-screen w-full bg-[#0a0d14] font-nino flex items-center justify-center p-4 text-white relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-lg w-full bg-[#121622] rounded-[36px] p-8 md:p-12 border border-red-500/20 shadow-2xl relative z-10 text-center">
            <div className="w-20 h-20 bg-red-500/10 text-red-400 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20">
              <ShieldAlert size={40} />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest mb-4">
              <Lock size={12} />
              <span>უსაფრთხოების ბარიერი</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3 uppercase">
              წვდომა <span className="text-red-400">შეზღუდულია</span>
            </h1>

            <p className="text-sm text-slate-400 font-bold leading-relaxed mb-6">
              სისტემის სუპერ ადმინ პანელზე წვდომა მკაცრად კონტროლდება. აღნიშნული განყოფილება ხელმისაწვდომია მხოლოდ ავტორიზებული სუპერ ადმინისტრატორისთვის (<span className="text-amber-400 font-mono">{SUPERADMIN_EMAIL}</span>) <span className="text-emerald-400">admin</span> სტატუსით.
            </p>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-left mb-8 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-black uppercase tracking-wider">მიმდინარე ანგარიში:</span>
                <span className="text-slate-200 font-mono font-bold truncate max-w-[200px]">
                  {currentUser.email || "უცნობი"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-black uppercase tracking-wider">ანგარიშის როლი:</span>
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  {userData?.role || "სტანდარტული"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-black uppercase tracking-wider">სტატუსი:</span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <ShieldAlert size={12} /> უარყოფილია
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/dashboard"
                className="flex-1 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <ArrowLeft size={16} />
                სამართავი პანელი
              </Link>
              <button
                onClick={async () => {
                  staffLogout?.();
                  await auth.signOut();
                }}
                className="px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
              >
                <LogOut size={16} />
                გამოსვლა
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default SuperAdminRoute;
