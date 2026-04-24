import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  Activity,
  Zap,
  Phone,
  Mail,
  X,
  Sparkles,
  Rocket
} from "lucide-react";
import { PLANS } from "../config/plans";
import MainHeader from "../components/Common/MainHeader";
import { useAuth } from "../context/AuthContext";

// --- დამხმარე კომპონენტები ---
const SectionTag = ({ children, dark }) => (
  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border ${dark ? "bg-surface/10 text-white border-white/20" : "bg-brand-purple/10 text-brand-purple border-brand-purple/20"}`}>
    {children}
  </span>
);

const CHECK = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <circle cx="8" cy="8" r="7.5" fill="#7C3AED" fillOpacity="0.12" stroke="#7C3AED" strokeWidth="1"/>
    <path d="M5 8l2 2 4-4" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DASH = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <circle cx="8" cy="8" r="7.5" fill="var(--bg-surface-soft)" stroke="var(--border-main)" strokeWidth="1"/>
    <path d="M5.5 8h5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Pricing = () => {
  const { currentUser } = useAuth();
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);

  const rows = [
    { label: "ფასი / თვე",       free: "0 ₾",  basic: "49 ₾", pro: "99 ₾",  isPrice: true },
    { label: "მაქს. ექიმი",      free: "3",    basic: "3",    pro: "∞" },
    { label: "მაქს. პაციენტი",   free: "50",   basic: "∞",    pro: "∞" },
    { label: "მაქს. ინვენტარი",  free: "10",   basic: "∞",    pro: "∞" },
    { label: "მაქს. სერვისი",    free: "10",   basic: "∞",    pro: "∞" },
    { label: "ინვოისი & ფ.100",  free: true,   basic: true,   pro: true },
    { label: "კბილების რუკა",    free: true,   basic: true,   pro: true },
    { label: "ფინანსური ანალიტიკა", free: true, basic: true,  pro: true },
    { label: "EHR სინქრონიზაცია",free: false,  basic: true,   pro: true },
    { label: "SMS შეხსენებები",  free: false,  basic: false,  pro: true },
    { label: "ტერმინალის დაკავშირება", free: false, basic: false, pro: true },
    { label: "სადაზღვეო სინქ.",  free: false,  basic: false,  pro: true },
    { label: "კლინიკის კატალოგი", free: "Basic", basic: "Brand", pro: "VIP" },
    { label: "ტექ. მხარდაჭერა",  free: false,  basic: true,   pro: true },
  ];

  const cols = [
    { key: "free",   label: "Free (სატესტო)", highlight: false },
    { key: "basic",  label: "Basic",        highlight: false },
    { key: "pro",    label: "Professional", highlight: true  },
  ];

  const renderCell = (val) => {
    if (val === true)  return <CHECK />;
    if (val === false) return <DASH />;
    return <span className="text-[13px] font-bold text-text-main">{val}</span>;
  };

  return (
    <div className="min-h-screen bg-surface font-nino selection:bg-brand-purple/10">
      <Helmet>
        <title>ფასები და პაკეტები — AiDent</title>
        <meta name="description" content="AiDent-ის ფასები და პაკეტები სტომატოლოგიური კლინიკებისთვის. დაიწყე უფასოდ და მოარგე სისტემა შენს საჭიროებებს." />
        <link rel="canonical" href="https://AiDent.ge/pricing" />
      </Helmet>

      <MainHeader user={currentUser} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-50">
           <div className="absolute top-10 right-0 w-96 h-96 bg-brand-purple/5 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <SectionTag>ფასები</SectionTag>
          <h1 className="text-5xl md:text-7xl font-black text-text-main tracking-tighter mb-8 italic leading-none">
            აირჩიე შენი კლინიკის <br />
            <span className="text-brand-purple italic">მომავალი.</span>
          </h1>
          <p className="text-xl text-text-muted font-medium italic max-w-2xl mx-auto leading-relaxed">
            დაიწყე სრულიად უფასოდ და გაიზარდე ჩვენთან ერთად. არავითარი ფარული ხარჯები.
          </p>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Detailed Table */}
          <div className="bg-surface rounded-[40px] border border-border-main shadow-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_repeat(3,200px)] border-b border-border-main bg-surface-soft/30">
              <div className="p-8" />
              {cols.map(c => (
                <div key={c.key} className={`p-8 text-center relative ${c.highlight ? "bg-brand-purple/5" : ""}`}>
                  {c.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      რეკომენდებული
                    </div>
                  )}
                  <h3 className={`text-sm font-black uppercase tracking-widest ${c.highlight ? "text-brand-purple" : "text-text-muted"}`}>
                    {c.label}
                  </h3>
                </div>
              ))}
            </div>

            {rows.map((row, i) => (
              <div key={i} className={`grid grid-cols-1 md:grid-cols-[1fr_repeat(3,200px)] border-b last:border-0 border-border-main group hover:bg-brand-purple/[0.02] transition-colors ${i % 2 === 0 ? "bg-surface" : "bg-surface-soft/10"}`}>
                <div className="p-5 md:p-8 flex items-center gap-3">
                  <span className="text-sm font-black text-text-main uppercase tracking-tight italic">{row.label}</span>
                  <button 
                    onClick={() => {}} // Could show tooltip
                    className="text-text-muted hover:text-brand-purple transition-colors"
                  >
                    <Info size={14} />
                  </button>
                </div>
                {cols.map(c => (
                  <div key={c.key} className={`p-5 md:p-8 flex items-center justify-center border-l md:border-l border-border-main/50 ${c.highlight ? "bg-brand-purple/[0.03]" : ""}`}>
                    <div className="flex items-center gap-2 md:hidden mr-auto">
                       <span className="text-[10px] font-black uppercase text-text-muted">{c.label}:</span>
                    </div>
                    {row.isPrice ? (
                      <span className={`text-2xl font-black italic tracking-tighter ${c.highlight ? "text-brand-purple" : "text-text-main"}`}>
                        {row[c.key]}
                      </span>
                    ) : renderCell(row[c.key])}
                  </div>
                ))}
              </div>
            ))}

            {/* Footer Row */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_repeat(3,200px)] bg-surface-soft/50">
               <div className="p-8 hidden md:flex items-center">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic leading-relaxed max-w-[200px]">
                    * პაკეტის გააქტიურება ხდება ხელშეკრულების საფუძველზე
                  </p>
               </div>
               {cols.map(c => (
                 <div key={c.key} className={`p-8 flex flex-col items-center gap-4 ${c.highlight ? "bg-brand-purple/5" : ""}`}>
                    {c.key === 'free' ? (
                      <Link to="/auth" className="w-full text-center py-4 rounded-2xl bg-brand-deep text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl">დაიწყე</Link>
                    ) : (
                      <a href="mailto:upgrade@AiDent.ge" className={`w-full text-center py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${c.highlight ? "bg-brand-purple text-white" : "bg-surface border border-border-main text-text-main hover:bg-surface-soft"}`}>კონტაქტი</a>
                    )}
                    <button 
                      onClick={() => setSelectedPlanForDetails(c.key)}
                      className="text-[10px] font-black text-brand-purple uppercase tracking-widest hover:underline"
                    >
                      ნახე დეტალები
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-brand-deep text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 relative z-10">
           <div className="md:col-span-1">
              <SectionTag dark>პრივილეგიები</SectionTag>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-6 leading-none">რატომ <br />AiDent?</h2>
              <p className="text-white/50 font-medium italic">ჩვენთან ინვესტიცია ნიშნავს თქვენი კლინიკის ზრდას და დროის დაზოგვას.</p>
           </div>
           {[
             { title: "24/7 მხარდაჭერა", desc: "ტექნიკური გუნდი ყოველთვის მზად არის თქვენს დასახმარებლად.", icon: Phone },
             { title: "უსაფრთხოება", desc: "თქვენი მონაცემები დაშიფრულია და დაცულია უმაღლესი სტანდარტებით.", icon: Rocket },
             { title: "მარტივი იმპორტი", desc: "დაგეხმარებით ძველი სისტემიდან მონაცემების გადმოტანაში უფასოდ.", icon: Zap }
           ].map((item, i) => (
             <div key={i} className="bg-white/5 p-8 rounded-[32px] border border-white/10 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-brand-purple text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <item.icon size={24} />
                </div>
                <h4 className="text-lg font-black uppercase italic mb-3">{item.title}</h4>
                <p className="text-sm text-white/60 font-medium italic leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* FAQ - Specialized for pricing */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
             <SectionTag>FAQ</SectionTag>
             <h2 className="text-4xl font-black text-text-main italic tracking-tighter uppercase">ხშირი კითხვები ფასებზე</h2>
          </div>
          <div className="space-y-6">
             {[
               { q: "შესაძლებელია თუ არა პაკეტის შეცვლა?", a: "დიახ, პაკეტის შეცვლა შეგიძლიათ ნებისმიერ დროს. ამისთვის საჭიროა დაგვიკავშირდეთ და ჩვენს ადმინისტრატორს შეატყობინოთ." },
               { q: "არსებობს თუ არა ფარული გადასახადი?", a: "არა, ჩვენი საფასო პოლიტიკა გამჭვირვალეა. თქვენ იხდით მხოლოდ არჩეული პაკეტის ღირებულებას." },
               { q: "როგორ ხდება ანგარიშსწორება?", a: "ანგარიშსწორება ხდება ყოველთვიურად, ინვოისის საფუძველზე, საბანკო გადარიცხვით." }
             ].map((faq, i) => (
               <div key={i} className="p-8 bg-surface-soft/50 rounded-[32px] border border-border-main">
                  <h4 className="text-lg font-black text-text-main italic mb-3 uppercase">{faq.q}</h4>
                  <p className="text-text-muted font-medium italic text-sm leading-relaxed">{faq.a}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-deep py-20 px-6 text-white text-center border-t border-white/10">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <Activity className="text-brand-purple" size={32} />
          <span className="text-2xl font-black tracking-tighter italic">AiDent</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">© 2026 Crafted for modern dentistry</p>
      </footer>

      {/* Plan Details Modal */}
      {selectedPlanForDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedPlanForDetails(null)} />
          <div className="bg-surface rounded-[40px] w-full max-w-2xl max-h-[80vh] flex flex-col relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-10 border-b border-border-main flex justify-between items-center bg-surface-soft/50">
              <div>
                <h3 className="text-2xl font-black text-text-main italic leading-none">{PLANS[selectedPlanForDetails].title}</h3>
                <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.2em] mt-3">პაკეტის სრული შესაძლებლობები</p>
              </div>
              <button onClick={() => setSelectedPlanForDetails(null)} className="p-3 bg-surface text-text-muted hover:text-text-main rounded-2xl shadow-sm border border-border-main transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-4">
              {PLANS[selectedPlanForDetails].features?.map((feature, idx) => (
                <div key={idx} className="flex gap-6 p-6 rounded-[32px] bg-surface-soft border border-transparent hover:border-brand-purple/20 transition-all group">
                  <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-brand-purple shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-text-main uppercase text-sm mb-2 italic">{feature.name}</h4>
                    <p className="text-xs font-bold text-text-muted leading-relaxed italic">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
