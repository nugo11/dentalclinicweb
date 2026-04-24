import React from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { AlertOctagon, Phone, Mail, LogOut, ArrowLeft } from "lucide-react";
import { auth } from "../firebase";

const SuspendedPage = () => {
  const { clinicData, staffLogout } = useAuth();

  const handleLogout = async () => {
    staffLogout();
    await auth.signOut();
  };

  return (
    <>
      <Helmet>
        <title>წვდომა შეჩერებულია — DentalHub</title>
      </Helmet>
      <div className="min-h-screen w-full bg-surface-soft font-nino flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-surface rounded-[48px] p-8 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-border-main text-center relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-red-500/20 animate-bounce">
            <AlertOctagon size={48} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tighter italic uppercase mb-6">
            მომსახურება <span className="text-red-500">შეჩერებულია</span>
          </h1>

          <p className="text-text-muted font-bold text-lg leading-relaxed mb-12 max-w-md mx-auto">
            თქვენი კლინიკის <strong>"{clinicData?.clinicName}"</strong> წვდომა დროებით შეზღუდულია. მონაცემები დაცულია, თუმცა სისტემით სარგებლობისთვის საჭიროა ადმინისტრაციასთან დაკავშირება.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <div className="p-6 bg-surface-soft rounded-[32px] border border-border-main flex items-center gap-4 group hover:bg-surface hover:border-brand-purple transition-all">
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-brand-purple shadow-sm group-hover:bg-brand-purple group-hover:text-white transition-all">
                <Phone size={22} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">დაგვიკავშირდით</p>
                <p className="text-sm font-black text-text-main tracking-tight">+995 555 123 456</p>
              </div>
            </div>
            <div className="p-6 bg-surface-soft rounded-[32px] border border-border-main flex items-center gap-4 group hover:bg-surface hover:border-brand-purple transition-all">
              <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-brand-purple shadow-sm group-hover:bg-brand-purple group-hover:text-white transition-all">
                <Mail size={22} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">მოგვწერეთ</p>
                <p className="text-sm font-black text-text-main tracking-tight">support@dentalhub.ge</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLogout}
              className="w-full sm:w-auto px-10 py-5 bg-brand-deep text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-brand-purple transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-deep/10"
            >
              <LogOut size={18} /> სისტემიდან გამოსვლა
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-10 py-5 bg-surface text-text-muted border border-border-dark rounded-[24px] font-black text-xs uppercase tracking-widest hover:text-text-main hover:border-brand-deep transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft size={18} /> ხელახლა ცდა
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default SuspendedPage;
