import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../context/AuthContext";
import { PLANS } from "../../config/plans";
import Sidebar from "../../components/Dashboard/Sidebar";
import TopNav from "../../components/Dashboard/TopNav";
import {
  Crown, Sparkles, ShieldCheck, CreditCard,
  Mail, Phone, CheckCircle2, ArrowRight, Info, X
} from "lucide-react";

const CHECK = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display:'inline-block',flexShrink:0}}>
    <circle cx="8" cy="8" r="8" fill="#7C3AED" fillOpacity="0.12"/>
    <path d="M5 8l2 2 4-4" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DASH = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display:'inline-block',flexShrink:0}}>
    <circle cx="8" cy="8" r="8" fill="#E2E8F0"/>
    <path d="M5.5 8h5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const rows = [
  { label: "ფასი / თვე",            free: "0 ₾",  basic: "49 ₾", pro: "99 ₾",  isPrice: true },
  { label: "მაქს. ექიმი",           free: "3",    basic: "3",    pro: "∞" },
  { label: "მაქს. პაციენტი",        free: "50",   basic: "∞",    pro: "∞" },
  { label: "მაქს. ინვენტარი",       free: "10",   basic: "∞",    pro: "∞" },
  { label: "მაქს. სერვისი",         free: "10",   basic: "∞",    pro: "∞" },
  { label: "ინვოისი & ფ.100",       free: true,   basic: true,   pro: true },
  { label: "კბილების რუკა",         free: true,   basic: true,   pro: true },
  { label: "ფინანსური ანალიტიკა",   free: true,   basic: true,   pro: true },
  { label: "EHR სინქრონიზაცია",     free: false,  basic: true,   pro: true },
  { label: "SMS შეხსენებები",       free: false,  basic: false,  pro: true },
  { label: "ტერმინალის დაკავშირება",   free: false,  basic: false,  pro: true },
  { label: "სადაზღვეო სინქ.",       free: false,  basic: false,  pro: true },
  { label: "კლინიკის კატალოგი",     free: "Basic",basic: "VIP",  pro: "VIP" },
  { label: "ტექ. მხარდაჭერა",       free: false,  basic: true,   pro: true },
];

const cols = [
  { key: "free",   label: "Free"         },
  { key: "basic",  label: "Basic"        },
  { key: "pro",    label: "Professional" },
];

const renderCell = (val) => {
  if (val === true)  return <CHECK />;
  if (val === false) return <DASH />;
  return <span style={{fontSize:13,fontWeight:500,color:'#1E293B'}}>{val}</span>;
};

const Billing = () => {
  const { clinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);
  
  const currentPlanIdRaw = (clinicData?.plan || "free").toLowerCase();
  const currentPlanId = currentPlanIdRaw === "solo" ? "basic" : currentPlanIdRaw;

  return (
    <>
      <Helmet>
        <title>ანგარიშსწორება და პაკეტები — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10 pb-12">

            <div className="text-center space-y-4 mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={14} /> Subscription Management
              </div>
              <h1 className="text-4xl font-black text-brand-deep italic tracking-tighter">
                თქვენი პაკეტი
              </h1>
              <p className="text-gray-400 font-bold text-sm max-w-lg mx-auto italic">
                ამჟამად გააქტიურებულია{" "}
                <span className="text-brand-purple font-black">
                  {PLANS[currentPlanId]?.title || currentPlanId}
                </span>{" "}
                პაკეტი. გაუმჯობესებისთვის დაგვიკავშირდით.
              </p>
              
              <button 
                onClick={() => setSelectedPlanForDetails(currentPlanId)}
                className="mt-6 inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-purple border-2 border-brand-purple/20 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-lg shadow-brand-purple/5"
              >
                <Info size={16} /> პაკეტის დეტალები
              </button>
            </div>

            <div style={{background:'white',borderRadius:32,overflow:'hidden',border:'1px solid #E2E8F0',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr repeat(3,1fr)',borderBottom:'1px solid #E2E8F0'}}>
                <div style={{padding:'20px 24px'}} />
                {cols.map(c => {
                  const isCurrent = c.key === currentPlanId;
                  return (
                    <div key={c.key} style={{
                      padding:'20px 12px',textAlign:'center',
                      background: isCurrent ? '#7C3AED' : 'transparent',
                      position:'relative'
                    }}>
                      {isCurrent && (
                        <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',
                          background:'#5B21B6',color:'white',fontSize:9,fontWeight:900,
                          letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 10px',
                          borderRadius:20,whiteSpace:'nowrap'}}>
                          მიმდინარე
                        </div>
                      )}
                      <div style={{fontSize:11,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',
                        color: isCurrent ? 'rgba(255,255,255,0.9)' : '#64748B', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
                        {c.label}
                        <button 
                          onClick={() => setSelectedPlanForDetails(c.key)}
                          style={{
                            padding:4, borderRadius:6, background: isCurrent ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
                            color: isCurrent ? 'white' : '#7C3AED', border:'none', cursor:'pointer'
                          }}
                          title="დეტალები"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {rows.map((row, i) => (
                <div key={i} style={{
                  display:'grid',gridTemplateColumns:'1fr repeat(3,1fr)',
                  borderBottom: i < rows.length-1 ? '1px solid #F1F5F9' : 'none',
                  background: i % 2 === 0 ? 'white' : '#FAFAFA'
                }}>
                  <div style={{padding:'13px 24px',fontSize:13,fontWeight:500,color:'#475569',display:'flex',alignItems:'center'}}>
                    {row.label}
                  </div>
                  {cols.map(c => {
                    const isCurrent = c.key === currentPlanId;
                    return (
                      <div key={c.key} style={{
                        display:'flex',alignItems:'center',justifyContent:'center',padding:'13px 0',
                        background: isCurrent ? (row.isPrice ? '#7C3AED' : 'rgba(124,58,237,0.06)') : 'transparent'
                      }}>
                        {row.isPrice ? (
                          <span style={{fontSize:isCurrent?18:14,fontWeight:900,
                            color:isCurrent?'white':'#1E293B',fontStyle:'italic'}}>
                            {row[c.key]}
                          </span>
                        ) : renderCell(row[c.key])}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div style={{display:'grid',gridTemplateColumns:'1fr repeat(3,1fr)',
                borderTop:'1px solid #E2E8F0',background:'#F8FAFC'}}>
                <div style={{padding:'16px 24px',fontSize:12,color:'#94A3B8',fontWeight:600,display:'flex',alignItems:'center'}}>
                  * Upgrade ხელშეკრულებით
                </div>
                {cols.map(c => {
                  const isCurrent = c.key === currentPlanId;
                  return (
                    <div key={c.key} style={{padding:'12px 12px',display:'flex',alignItems:'center',justifyContent:'center',
                      background: isCurrent ? 'rgba(124,58,237,0.04)' : 'transparent'}}>
                      {isCurrent ? (
                        <span style={{fontSize:10,fontWeight:900,textTransform:'uppercase',
                          letterSpacing:'0.12em',color:'#7C3AED',padding:'10px 0'}}>
                          გააქტიურებულია
                        </span>
                      ) : c.key === 'free' ? (
                        <span style={{fontSize:10,fontWeight:900,textTransform:'uppercase',
                          letterSpacing:'0.12em',color:'#94A3B8'}}>—</span>
                      ) : (
                        <a href="mailto:upgrade@dentalhub.ge"
                          style={{display:'block',width:'100%',textAlign:'center',
                          padding:'10px 0',background:'#7C3AED',color:'white',borderRadius:14,
                          fontSize:10,fontWeight:900,textTransform:'uppercase',
                          letterSpacing:'0.12em',textDecoration:'none'}}>
                          კონტაქტი
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-brand-deep rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 blur-[60px] rounded-full -mr-10 -mt-10" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black italic tracking-tighter mb-2">გჭირდებათ Upgrade?</h3>
                <p className="text-white/50 text-sm font-bold leading-relaxed max-w-sm">
                  დაგვიკავშირდით — ჩვენ გავაფორმებთ ხელშეკრულებას და გავააქტიურებთ სასურველ პაკეტს 24 საათში.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
                <a href="tel:+99555102030"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-white no-underline">
                  <Phone size={16} /> +995 555 10 20 30
                </a>
                <a href="mailto:upgrade@dentalhub.ge"
                  className="flex items-center gap-3 bg-brand-purple hover:bg-purple-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all text-white no-underline">
                  <Mail size={16} /> upgrade@dentalhub.ge
                </a>
              </div>
            </div>

          </div>
        </main>
      </div>

      {selectedPlanForDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setSelectedPlanForDetails(null)} 
          />
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[80vh] flex flex-col relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-brand-deep italic leading-none">{PLANS[selectedPlanForDetails]?.title || selectedPlanForDetails}</h3>
                <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.2em] mt-3">პაკეტის სრული შესაძლებლობები</p>
              </div>
              <button 
                onClick={() => setSelectedPlanForDetails(null)}
                className="p-3 bg-white text-slate-300 hover:text-brand-deep rounded-2xl shadow-sm border border-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
              {PLANS[selectedPlanForDetails]?.features?.map((feature, idx) => (
                <div key={idx} className="flex gap-6 p-6 rounded-[32px] bg-slate-50 border border-transparent hover:border-brand-purple/20 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-purple shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-brand-deep uppercase text-sm mb-2 italic">{feature.name}</h4>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Billing;
