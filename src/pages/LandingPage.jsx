import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { PLANS } from "../config/plans";
import {
  Zap,
  Shield,
  BarChart3,
  Star,
  Clock,
  Heart,
  ArrowRight,
  Activity,
  Users,
  CheckCircle2,
  Play,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Lightbulb,
  Info,
  HelpCircle,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
  Stethoscope,
  ChevronLeft,
  Monitor,
  Smartphone,
} from "lucide-react";
import { auth, db } from "../firebase";
import { collection, query, getDocs, limit, where } from "firebase/firestore";
import MainHeader from "../components/Common/MainHeader";

// --- დამხმარე კომპონენტები ---
const SectionTag = ({ children, dark }) => (
  <span
    className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border ${
      dark
        ? "bg-surface/10 text-white border-white/20"
        : "bg-brand-purple/10 text-brand-purple border-brand-purple/20"
    } font-nino`}
  >
    {children}
  </span>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-surface rounded-[24px] border border-border-main mb-4 overflow-hidden shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left group"
      >
        <h4 className="text-lg font-black text-text-main group-hover:text-brand-purple transition-colors tracking-tight italic">
          {question}
        </h4>
        <div
          className={`w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180 bg-brand-purple text-white" : "text-brand-purple"}`}
        >
          <ChevronDown size={18} />
        </div>
      </button>
      <div className={`faq-content ${isOpen ? "open" : ""}`}>
        <div className="p-6 pt-0 text-text-muted font-medium leading-relaxed border-t border-border-main mt-2">
          {answer}
        </div>
      </div>
    </div>
  );
};

const LandingPage = ({ user }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);
  
  const [clinics, setClinics] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const q = query(
          collection(db, "clinics"), 
          where("isPublic", "==", true),
          limit(12)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().clinicName || "დასახელების გარეშე",
          city: doc.data().city || "თბილისი",
          category: (doc.data().plan || "Solo").toUpperCase(),
          promo: doc.data().description || "სტომატოლოგიური კლინიკა DentalHub-ის პარტნიორი.",
          logoUrl: doc.data().logoUrl || null,
          address: doc.data().address || ""
        }));
        
        if (list.length > 0) {
          setClinics(list);
        } else {
          setClinics([
            { id: '1', name: "Smile Studio", city: "თბილისი", category: "Professional", promo: "თანამედროვე იმპლანტოლოგია და პრემიუმ სერვისი. ჩვენი გუნდი ორიენტირებულია თქვენს კომფორტზე." },
            { id: '2', name: "White Pearl", city: "ბათუმი", category: "Clinic Plus", promo: "ბავშვთა და საოჯახო სტომატოლოგიის სრული სერვისები. უახლესი აპარატურა და გამოცდილი ექიმები." },
            { id: '3', name: "NovaDent", city: "ქუთაისი", category: "Professional", promo: "მულტიდისციპლინური გუნდი და სწრაფი ჩაწერის სისტემა. ყველაზე ხელმისაწვდომი ფასები რეგიონში." },
            { id: '4', name: "Elite Dental", city: "თბილისი", category: "Clinic Plus", promo: "უახლესი ხარისხის მომსახურება და ინდივიდუალური მკურნალობის გეგმა ყველა პაციენტისთვის." }
          ]);
        }
      } catch (e) {
        console.error("Error fetching clinics:", e);
      }
    };
    fetchClinics();
  }, []);

  const nextSlide = () => setCarouselIndex((prev) => (prev + 1) % Math.max(1, clinics.length));
  const prevSlide = () => setCarouselIndex((prev) => (prev - 1 + clinics.length) % Math.max(1, clinics.length));

  return (
    <>
      <Helmet>
        <title>DentalHub — კლინიკის მართვის ინოვაციური პლატფორმა</title>
        <meta name="description" content="მართე შენი სტომატოლოგიური კლინიკა ციფრულად. პაციენტების აღრიცხვა, ფინანსური ანალიტიკა და ავტომატური ჯავშნები ერთ სივრცეში." />
      </Helmet>
      <div className="min-h-screen bg-surface font-nino selection:bg-brand-purple/10 overflow-x-hidden">
      <MainHeader user={user} />

      {/* 2. Hero Section - ENHANCED */}
      <section className="min-h-screen flex items-center px-4 md:px-6 bg-surface relative overflow-hidden">
        {/* Background Ornaments */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #7C3AED 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full relative z-10 pt-20 md:pt-0">
          <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="flex items-center gap-2 mb-6">
              <SectionTag>Premium Software 2026</SectionTag>
              <div className="flex -space-x-3 mb-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-surface-soft overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-purple text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                  +1k
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-black text-text-main leading-[0.9] mb-8 tracking-tighter italic">
              მართე კლინიკა <br />
              <span className="bg-gradient-to-r from-brand-purple to-blue-600 bg-clip-text text-transparent">ციფრულად.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted mb-10 max-w-xl leading-relaxed font-medium italic">
              DentalHub არის ყველაზე მოქნილი პლატფორმა ქართული სტომატოლოგიური კლინიკებისთვის. გაზარდეთ შემოსავალი 40%-ით პირველივე თვეში.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth"
                className="bg-brand-purple text-white px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-purple/30 hover:bg-brand-deep hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                დაიწყე უფასოდ <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <a href="#features" className="px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-widest text-text-main border-2 border-border-main hover:bg-surface-soft transition-all flex items-center justify-center gap-3">
                <Play size={18} fill="currentColor" /> დემო ვერსია
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border-main pt-10">
              <div>
                <p className="text-2xl font-black text-text-main italic">100+</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">კლინიკა</p>
              </div>
              <div>
                <p className="text-2xl font-black text-text-main italic">50k+</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">პაციენტი</p>
              </div>
              <div>
                <p className="text-2xl font-black text-text-main italic">99.9%</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">Uptime</p>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="relative z-10 rounded-[56px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(124,58,237,0.25)] border-[16px] border-surface">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200"
                className="w-full h-[600px] object-cover group-hover:scale-110 transition-transform duration-1000"
                alt="Dental Tech"
              />
            </div>
            
            {/* Floating Stats Card */}
            <div className="absolute -left-12 top-1/4 bg-surface/80 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-white/50 animate-bounce-slow hidden md:block z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Live Analytics</p>
                  <p className="text-lg font-black text-text-main italic">+24% Growth</p>
                </div>
              </div>
            </div>

            {/* Floating User Card */}
            <div className="absolute -right-8 bottom-1/4 bg-brand-deep text-white p-6 rounded-[32px] shadow-2xl animate-bounce-slow delay-500 hidden md:block z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-purple rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">New Appointment</p>
                  <p className="text-lg font-black italic">John Doe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="py-24 bg-surface-soft/50 border-y border-border-main px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
               <SectionTag>Work Process</SectionTag>
               <h2 className="text-3xl font-black text-text-main italic tracking-tighter uppercase leading-none">როგორ <br />ვმუშაობთ?</h2>
            </div>
            {[
              { title: "რეგისტრაცია", desc: "შექმენი პროფილი 1 წუთში", icon: User },
              { title: "პერსონალიზაცია", desc: "მოარგე სისტემა შენს საჭიროებებს", icon: Sparkles },
              { title: "ავტომატიზაცია", desc: "დაიწყე მუშაობა და დაზოგე დრო", icon: Zap }
            ].map((step, i) => (
              <div key={i} className="bg-surface p-8 rounded-[32px] border border-border-main shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-surface-soft text-brand-purple rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-purple group-hover:text-white transition-all">
                  <step.icon size={24} />
                </div>
                <h4 className="text-lg font-black text-text-main italic mb-2 uppercase">{step.title}</h4>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Multiplatform Section - ENHANCED BACKGROUND --- */}
      <section className="py-24 px-6 bg-gradient-to-b from-surface-soft/50 to-surface border-b border-border-main overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-brand-deep rounded-[56px] p-8 md:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            
            <div className="lg:w-1/2 relative z-10 text-center lg:text-left">
              <SectionTag dark>ხელმისაწვდომობა</SectionTag>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 italic leading-[1.1]">
                ერთი სისტემა <br />
                <span className="text-brand-purple">ყველა მოწყობილობაზე.</span>
              </h2>
              <p className="text-white/60 text-lg font-medium mb-10 italic">
                გამოიყენეთ DentalHub როგორც თქვენს კომპიუტერზე, ასევე მობილურ ტელეფონებზე. ჩვენი აპლიკაციები ოპტიმიზირებულია Windows, Android და iOS პლატფორმებისთვის.
              </p>
              <Link 
                to="/apps" 
                className="inline-flex items-center gap-3 bg-surface text-text-main px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-2xl"
              >
                გადმოწერე აპლიკაცია <ArrowRight size={20} />
              </Link>
            </div>

            <div className="lg:w-1/2 relative z-10 flex justify-center items-center">
              <div className="relative w-full max-w-md">
                 <div className="bg-surface/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                    <div className="space-y-6">
                       {[
                         { icon: Monitor, name: "Windows", status: "Active" },
                         { icon: Smartphone, name: "Android", status: "Active" },
                         { icon: Smartphone, name: "iOS / iPhone", status: "Active" }
                       ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between bg-surface/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-brand-purple rounded-xl flex items-center justify-center text-white">
                                  <item.icon size={24} />
                               </div>
                               <span className="text-white font-black italic">{item.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full">
                               {item.status}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>
                 {/* Decorative floaters */}
                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-purple rounded-3xl rotate-12 -z-10 shadow-2xl animate-pulse"></div>
                 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full -z-10 blur-2xl opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Clinic Catalog Carousel - ENHANCED SEPARATION */}
      <section id="clinic-catalog" className="py-24 md:py-32 px-4 md:px-6 bg-surface-soft/30 border-b border-border-main overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-main to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <SectionTag>კლინიკების კატალოგი</SectionTag>
              <h2 className="text-4xl md:text-6xl font-black text-text-main tracking-tighter italic mb-6 leading-[1.1]">
                იპოვე სასურველი <br />
                კლინიკა <span className="text-brand-purple">ერთ სივრცეში.</span>
              </h2>
              <p className="text-text-muted font-medium max-w-xl leading-relaxed italic">
                დაათვალიერეთ საქართველოში მოქმედი წამყვანი სტომატოლოგიური კლინიკები,
                მათი სერვისები და შეთავაზებები.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={prevSlide}
                className="w-14 h-14 rounded-2xl border-2 border-border-main flex items-center justify-center text-text-main hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextSlide}
                className="w-14 h-14 rounded-2xl border-2 border-border-main flex items-center justify-center text-text-main hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all shadow-sm active:scale-90"
              >
                <ArrowRight size={24} />
              </button>
              <Link
                to="/catalog"
                className="hidden md:flex bg-brand-deep text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-purple transition-all shadow-xl ml-4"
              >
                სრული სია
              </Link>
            </div>
          </div>

          {/* Carousel Wrapper */}
          <div className="relative">
             <div className="flex transition-transform duration-700 ease-in-out gap-6" 
                  style={{ transform: `translateX(-${carouselIndex * (100 / (windowWidth < 768 ? 1 : windowWidth < 1280 ? 2 : 3))}%)` }}>
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="min-w-full md:min-w-[calc(50%-12px)] xl:min-w-[calc(33.333%-16px)]">
                    <CatalogClinicCard {...clinic} />
                  </div>
                ))}
             </div>
          </div>
          
          <div className="mt-12 md:hidden">
            <Link
              to="/catalog"
              className="block w-full text-center bg-brand-deep text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-purple transition-all shadow-xl"
            >
              ყველა კლინიკის ნახვა
            </Link>
          </div>
        </div>
      </section>

      {/* --- 3. ABOUT US - SOFT GRAY BG (More Contrast) --- */}
      <section
        id="about"
        className="py-32 bg-surface-soft border-y border-border-dark px-6"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000"
              className="rounded-[40px] shadow-2xl border-[12px] border-surface"
              alt="About"
            />
            <div className="absolute -bottom-6 -right-6 bg-brand-deep p-8 rounded-3xl shadow-2xl text-white hidden md:block border-4 border-surface">
              <p className="text-4xl font-black mb-1">10+</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple">
                წლის გამოცდილება
              </p>
            </div>
          </div>
          <div>
            <SectionTag>ჩვენს შესახებ</SectionTag>
            <h2 className="text-4xl md:text-5xl font-black text-text-main tracking-tighter mb-8 leading-tight italic">
              ტექნოლოგია, რომელიც <br />
              ზრუნავს თქვენს პაციენტებზე.
            </h2>
            <p className="text-text-muted font-medium leading-relaxed mb-8 italic">
              DentalHub არის ექიმებისა და დეველოპერების მიერ შექმნილი
              ინსტრუმენტი. ჩვენი მიზანია კლინიკების სრული ავტომატიზაცია და
              ექიმების დროის დაზოგვა.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                "ქართული ენა",
                "24/7 მხარდაჭერა",
                "უსაფრთხო ბაზა",
                "მარტივი ინტერფეისი",
                "ავტომატური რეზერვი",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-black text-text-main italic"
                >
                  <CheckCircle2 size={18} className="text-brand-purple" />{" "}
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section - ENHANCED SEPARATION */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-surface-soft/50 to-surface border-y border-border-main relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <SectionTag>შესაძლებლობები</SectionTag>
          <h2 className="text-4xl md:text-6xl font-black text-text-main tracking-tighter mb-6 italic leading-none">ყველაფერი ერთ <br /><span className="text-brand-purple">ციფრულ სივრცეში</span></h2>
          <p className="text-text-muted font-medium max-w-2xl mx-auto italic">ჩვენი ფუნქციონალი შექმნილია იმისთვის, რომ ექიმს მეტი დრო დარჩეს პაციენტისთვის.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <FeatureCard
            icon={Users}
            title="პაციენტთა CRM"
            desc="სრული სამედიცინო ბარათები, რენტგენის არქივი, მკურნალობის ისტორია და პერსონალური მონაცემების დაცვა."
          />
          <FeatureCard
            icon={Zap}
            title="ტერმინალის დაკავშირება"
            desc="აპლიკაციიდან პირადპირ ტერმინალზე აისახება გადახდის დეტალები."
          />
          <FeatureCard
            icon={BarChart3}
            title="ანალიტიკა"
            desc="დეტალური ფინანსური რეპორტები, ექიმების ეფექტურობის მონიტორინგი და კლინიკის ზრდის პროგნოზირება."
          />
          <FeatureCard
            icon={Shield}
            title="უსაფრთხოება"
            desc="მონაცემთა ყოველდღიური დაშიფრული რეზერვირება (Backup) და წვდომის კონტროლი როლების მიხედვით."
          />
          <FeatureCard
            icon={Stethoscope}
            title="კბილების რუკა"
            desc="ინტერაქტიული 3D-სტილის კბილების რუკა, რომელიც საშუალებას გაძლევთ მონიშნოთ პრობლემები 1 წამში."
          />
          <FeatureCard
            icon={Activity}
            title="EHR სინქრონიზაცია"
            desc="მონაცემთა ავტომატური გაცვლა სახელმწიფო EHR სისტემასთან (ფორმა 100-ის გენერირება)."
          />
          <FeatureCard
            icon={Clock}
            title="სამუშაო გრაფიკი"
            desc="ექიმების სამუშაო საათების მართვა, შვებულებების და ცვლების მარტივი დაგეგმვა."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="ინვოისები"
            desc="პროფესიონალური ინვოისების და ჩეკების ბეჭდვა, სადაზღვევო კომპანიებთან ანგარიშსწორება."
          />
        </div>
      </section>

      {/* --- 5. TIPS & INSIGHTS - NEW UNIQUE DESIGN --- */}
      <section className="py-32 px-6 bg-brand-deep text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-purple/5 -skew-x-12 transform translate-x-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <SectionTag dark>ექსპერტის რჩევები</SectionTag>
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter leading-tight italic uppercase">
                როგორ <br />
                ვმართოთ <br />
                კლინიკა <br />
                <span className="text-brand-purple">უკეთესად?</span>
              </h2>
              <p className="text-text-muted font-medium leading-relaxed italic">
                მცირე ცვლილებებს დიდ შედეგებამდე მიჰყავხართ. გაეცანით
                სტატისტიკას.
              </p>
            </div>

            <div className="lg:col-span-2 space-y-12">
              <div className="flex flex-col md:flex-row gap-8 items-start group">
                <span className="tip-number font-black font-sans group-hover:text-brand-purple transition-colors duration-500">
                  01
                </span>
                <div className="pt-4">
                  <h4 className="text-2xl font-black mb-4 tracking-tight italic uppercase text-brand-purple">
                    ავტომატიზაცია
                  </h4>
                  <p className="text-text-muted font-medium leading-relaxed italic max-w-xl text-lg">
                    პაციენტების 30% ივიწყებს ვიზიტს. ავტომატური SMS შეხსენებები
                    ამ ციფრს 5%-მდე ამცირებს და ზოგავს თქვენს დაკარგულ
                    შემოსავალს.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-surface/10 shadow-sm"></div>

              <div className="flex flex-col md:flex-row gap-8 items-start group">
                <span className="tip-number font-black font-sans group-hover:text-brand-purple transition-colors duration-500">
                  02
                </span>
                <div className="pt-4">
                  <h4 className="text-2xl font-black mb-4 tracking-tight italic uppercase text-brand-purple">
                    მონაცემთა ანალიზი
                  </h4>
                  <p className="text-text-muted font-medium leading-relaxed italic max-w-xl text-lg">
                    რეალურ დროში ფინანსების კონტროლი საშუალებას გაძლევთ
                    დაინახოთ, რომელი პროცედურაა ყველაზე მომგებიანი და მოახდინოთ
                    რესურსების ოპტიმიზაცია.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-surface/10 shadow-sm"></div>

              <div className="flex flex-col md:flex-row gap-8 items-start group">
                <span className="tip-number font-black font-sans group-hover:text-brand-purple transition-colors duration-500">
                  03
                </span>
                <div className="pt-4">
                  <h4 className="text-2xl font-black mb-4 tracking-tight italic uppercase text-brand-purple">
                    ციფრული ისტორია
                  </h4>
                  <p className="text-text-muted font-medium leading-relaxed italic max-w-xl text-lg">
                    მონაცემთა მყისიერი წვდომა ექიმის მუშაობის სისწრაფეს 20%-ით
                    ზრდის, რაც საშუალებას გაძლევთ მიიღოთ მეტი პაციენტი დღის
                    განმავლობაში.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. FAQ - FULL WIDTH CONTENT (White BG) --- */}
      <section id="faq" className="py-32 px-6 bg-surface border-b border-border-main relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border-main to-transparent"></div>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>FAQ</SectionTag>
            <h2 className="text-4xl font-black text-text-main tracking-tighter italic uppercase">
              ხშირად დასმული კითხვები
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-x-8 items-start">
            <FAQItem
              question="რამდენი ხანი სჭირდება დანერგვას?"
              answer="სისტემის გამართვა და პერსონალის ტრენინგი სულ რაღაც 1-2 სამუშაო დღეში სრულდება."
            />
            <FAQItem
              question="მონაცემები უსაფრთხოდ იქნება?"
              answer="დიახ, DentalHub იყენებს საბანკო დონის დაშიფვრას და ყოველდღიურ რეზერვს (Backups)."
            />
            <FAQItem
              question="შესაძლებელია ძველი ბაზის გადმოტანა?"
              answer="რა თქმა უნდა, ჩვენი ტექნიკური გუნდი დაგეხმარებათ პაციენტების მონაცემების უმტკივნეულო იმპორტში."
            />
            <FAQItem
              question="გაქვთ თუ არა მობილური აპლიკაცია?"
              answer="დიახ, სისტემა სრულად ოპტიმიზირებულია პლანშეტებისა და მობილური ტელეფონებისთვის."
            />
          </div>
        </div>
      </section>

      {/* 7. Middle CTA - ENHANCED SEPARATION */}
      <section className="px-6 py-24 bg-surface-soft/50 border-y border-border-main">
        <div className="max-w-7xl mx-auto bg-brand-deep rounded-[48px] p-16 md:p-24 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
                მზად ხართ გაციფრულებისთვის?
              </h2>
              <p className="text-text-muted text-lg font-medium italic">
                "გახადეთ კლინიკის მართვა უფრო სასიამოვნო."
              </p>
            </div>
            <button className="bg-brand-purple text-white px-12 py-6 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-surface hover:text-brand-purple transition-all shadow-xl">
              დაგვიკავშირდით
            </button>
          </div>
        </div>
      </section>

      {/* 8. Pricing Table */}
      <section id="pricing" className="py-32 px-6 bg-surface-soft border-y border-border-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>ფასები</SectionTag>
            <h2 className="text-4xl md:text-5xl font-black text-text-main tracking-tighter mb-6">
              გამჭვირვალე ფასები
            </h2>
            <p className="text-text-muted font-medium max-w-xl mx-auto leading-relaxed italic">
              დაიწყე უფასოდ. გაზრდის შემთხვევაში დაგვიკავშირდი — ჩვენ გადავრთავთ პაკეტს ხელშეკრულების საფუძველზე.
            </p>
          </div>

          <PricingTable onSelectPlan={setSelectedPlanForDetails} />

          {/* Upgrade CTA */}
          <div className="mt-16 bg-brand-deep rounded-[40px] p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-purple/10 blur-[80px] rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <h3 className="text-3xl font-black italic tracking-tighter mb-3">გჭირდებათ გაუმჯობესება?</h3>
              <p className="text-white/50 font-bold text-sm leading-relaxed mb-8 max-w-lg mx-auto">
                პაკეტის გაუმჯობესება ხდება პირადი ხელშეკრულების საფუძველზე. დაგვიკავშირდით და ჩვენ გააქტიურებთ სასურველ პაკეტს.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="tel:+99555102030" className="flex items-center gap-3 bg-surface/10 hover:bg-surface/20 border border-white/20 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">
                  <Phone size={18} /> +995 555 10 20 30
                </a>
                <a href="mailto:upgrade@dentalhub.ge" className="flex items-center gap-3 bg-brand-purple hover:bg-purple-600 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-purple/30 transition-all">
                  <Mail size={18} /> upgrade@dentalhub.ge
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Contact - WHITE BG */}
      <section id="contact" className="py-32 px-6 bg-surface border-t border-border-main">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <SectionTag>კონტაქტი</SectionTag>
            <h2 className="text-4xl md:text-6xl font-black text-text-main tracking-tighter leading-[1] mb-10 italic">
              მოგვწერეთ <br />
              ნებისმიერ დროს.
            </h2>
            <div className="space-y-12">
              <ContactInfo
                icon={Mail}
                title="ელ-ფოსტა"
                detail="hello@dentalhub.ge"
              />
              <ContactInfo
                icon={Phone}
                title="ტელეფონი"
                detail="+995 555 10 20 30"
              />
            </div>
          </div>
          <div className="bg-surface-soft p-12 rounded-[40px] border border-border-dark shadow-inner">
            <form className="space-y-6">
              <input
                type="text"
                placeholder="სახელი"
                className="w-full px-8 py-5 rounded-2xl bg-surface border border-border-main outline-none font-bold text-sm focus:border-brand-purple transition-all"
              />
              <textarea
                rows="4"
                placeholder="შეტყობინება"
                className="w-full px-8 py-5 rounded-2xl bg-surface border border-border-main outline-none font-bold text-sm focus:border-brand-purple transition-all resize-none"
              ></textarea>
              <button className="w-full bg-brand-deep text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-brand-purple transition-all shadow-xl">
                გაგზავნა
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-brand-deep py-20 px-6 text-white text-center border-t border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent"></div>
        <div className="flex items-center justify-center space-x-3 mb-12">
          <Activity className="text-brand-purple" size={32} />
          <span className="text-2xl font-black tracking-tighter italic">
            DentalHub
          </span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-muted">
          © 2026 Crafted for modern dentistry
        </p>
      </footer>

      {/* Plan Details Modal */}
      {selectedPlanForDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setSelectedPlanForDetails(null)} 
          />
          <div className="bg-surface rounded-[40px] w-full max-w-2xl max-h-[80vh] flex flex-col relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="p-10 border-b border-border-main flex justify-between items-center bg-surface-soft/50">
              <div>
                <h3 className="text-2xl font-black text-text-main italic leading-none">{PLANS[selectedPlanForDetails].title}</h3>
                <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.2em] mt-3">პაკეტის სრული შესაძლებლობები</p>
              </div>
              <button 
                onClick={() => setSelectedPlanForDetails(null)}
                className="p-3 bg-surface text-text-muted hover:text-text-main rounded-2xl shadow-sm border border-border-main transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
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

            <div className="p-8 bg-surface-soft border-t border-border-main flex justify-center">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">DentalHub Subscription Management © 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

// --- შვილობილი კომპონენტები ---
const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="p-8 md:p-12 bg-surface-soft rounded-[40px] border border-border-main hover:bg-surface hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group">
    <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-brand-purple mb-8 group-hover:bg-brand-purple group-hover:text-white transition-all shadow-sm">
      <Icon size={30} />
    </div>
    <h3 className="text-xl md:text-2xl font-black text-text-main mb-4 tracking-tighter leading-none italic uppercase">
      {title}
    </h3>
    <p className="text-text-muted font-medium text-xs md:text-sm leading-relaxed tracking-tight italic">
      {desc}
    </p>
  </div>
);

const CatalogClinicCard = ({ id, name, city, address, category, promo, logoUrl }) => (
  <Link to={`/catalog/${id}`} className="block h-full group">
    <div className="bg-surface border border-border-main rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
         <Activity size={100} />
      </div>

      <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
        <div className="w-20 h-20 rounded-[24px] bg-surface-soft border-2 border-border-main shadow-inner flex items-center justify-center shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-brand-purple/20"><Activity size={32} /></div>
          )}
        </div>
        <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-brand-purple/5 text-brand-purple border border-brand-purple/10 whitespace-nowrap shadow-sm">
          {category}
        </span>
      </div>

      <div className="flex-1 relative z-10">
        <h4 className="text-2xl font-black text-text-main tracking-tight italic mb-2 group-hover:text-brand-purple transition-colors">
          {name}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
          <MapPin size={12} className="text-brand-purple" />
          {city}${address ? `, ${address}` : ''}
        </div>
        <p className="text-sm font-medium text-text-muted leading-relaxed italic line-clamp-4">{promo}</p>
      </div>

      <div className="mt-8 pt-6 border-t border-border-main flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest group-hover:gap-4 transition-all relative z-10">
        პროფილის ნახვა <ArrowRight size={14} className="text-brand-purple" />
      </div>
    </div>
  </Link>
);

const PriceCard = ({ plan, price, features, primary }) => (
  <div
    className={`p-12 rounded-[48px] border-2 transition-all duration-500 bg-surface ${primary ? "border-brand-purple shadow-2xl scale-105 z-10" : "border-border-main hover:border-border-dark shadow-sm"}`}
  >
    {primary && (
      <div className="inline-flex items-center gap-2 bg-brand-purple text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
        <Sparkles size={12} /> პოპულარული
      </div>
    )}
    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4 block">
      {plan}
    </h4>
    <div className="mb-10">
      <span className="text-6xl font-black text-text-main tracking-tighter leading-none font-sans italic">
        ${price}
      </span>
      <span className="text-text-muted font-black text-[11px] uppercase ml-1">
        / თვე
      </span>
    </div>
    <ul className="space-y-5 mb-12 text-left">
      {features.map((f, i) => (
        <li
          key={i}
          className="flex items-center gap-4 text-[11px] font-black text-text-main/60 uppercase tracking-tight italic"
        >
          <CheckCircle2 size={16} className="text-brand-purple" /> {f}
        </li>
      ))}
    </ul>
    <button
      className={`w-full py-5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${primary ? "bg-brand-purple text-white" : "bg-surface-soft text-text-main hover:bg-surface-soft"}`}
    >
      არჩევა
    </button>
  </div>
);

const ContactInfo = ({ icon: Icon, title, detail }) => (
  <div className="flex items-center gap-8 group">
    <div className="w-16 h-16 bg-surface-soft rounded-[24px] flex items-center justify-center text-text-main group-hover:bg-brand-purple group-hover:text-white transition-all shadow-inner">
      <Icon size={28} />
    </div>
    <div>
      <h5 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">
        {title}
      </h5>
      <p className="text-2xl font-black text-text-main tracking-tighter leading-none italic">
        {detail}
      </p>
    </div>
  </div>
);

const PricingTable = ({ onSelectPlan }) => {
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
    { key: "free",   label: "Free",         highlight: false },
    { key: "basic",  label: "Basic",        highlight: false },
    { key: "pro",    label: "Professional", highlight: true  },
  ];

  const renderCell = (val) => {
    if (val === true)  return <CHECK />;
    if (val === false) return <DASH />;
    return <span style={{fontSize:13,fontWeight:500,color:'var(--text-main)'}}>{val}</span>;
  };

  return (
    <>
      <div className="md:hidden space-y-4">
        {cols.map((c) => (
          <div
            key={c.key}
            className={`rounded-[24px] border p-5 ${c.highlight ? "border-brand-purple bg-brand-purple/5" : "border-border-dark bg-surface"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-text-main">{c.label}</h4>
                <button 
                  onClick={() => onSelectPlan(c.key)}
                  className="p-1 rounded-lg bg-brand-purple/10 text-brand-purple border-none cursor-pointer"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className={`text-lg font-black italic ${c.highlight ? "text-brand-purple" : "text-text-main"}`}>
                {rows[0][c.key]}
              </span>
            </div>
            <div className="space-y-2">
              {rows.slice(1).map((row) => (
                <div key={`${c.key}-${row.label}`} className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted font-bold">{row.label}</span>
                  <span className="text-text-main font-black">{row[c.key] === true ? "✓" : row[c.key] === false ? "—" : row[c.key]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {c.key === "free" ? (
                <a href="/auth" className="block text-center py-3 rounded-xl bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest">დაიწყე</a>
              ) : (
                <a href="mailto:upgrade@dentalhub.ge" className={`block text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.highlight ? "bg-brand-purple text-white" : "bg-surface-soft text-text-main"}`}>კონტაქტი</a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block bg-surface rounded-[32px] overflow-hidden border border-border-main shadow-sm">
      {/* Header */}
      <div style={{display:'grid',gridTemplateColumns:'1fr repeat(3,180px)',borderBottom:'1px solid var(--border-main)'}}>
        <div style={{padding:'20px 24px'}} />
        {cols.map(c => (
          <div key={c.key} style={{
            padding:'20px 0',textAlign:'center',
            background: c.highlight ? '#7C3AED' : 'transparent',
            position:'relative'
          }}>
            {c.highlight && (
              <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',
                background:'#5B21B6',color:'white',fontSize:9,fontWeight:900,
                letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'}}>
                პოპულარული
              </div>
            )}
            <div style={{fontSize:12,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',
              color: c.highlight ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
              {c.label}
              <button 
                onClick={() => onSelectPlan(c.key)}
                style={{
                  padding:4, borderRadius:6, background: c.highlight ? 'rgba(255,255,255,0.1)' : 'var(--bg-surface-soft)',
                  color: c.highlight ? 'white' : '#7C3AED', border:'none', cursor:'pointer'
                }}
                title="დეტალები"
              >
                <Info size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display:'grid',gridTemplateColumns:'1fr repeat(3,180px)',
          borderBottom: i < rows.length-1 ? '1px solid var(--border-main)' : 'none',
          background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-soft)'
        }}>
          <div style={{padding:'14px 24px',fontSize:13,fontWeight:500,color:'var(--text-muted)',display:'flex',alignItems:'center'}}>
            {row.label}
          </div>
          {cols.map(c => (
            <div key={c.key} style={{
              display:'flex',alignItems:'center',justifyContent:'center',padding:'14px 0',
              background: c.highlight ? (row.isPrice ? '#7C3AED' : 'rgba(124,58,237,0.06)') : 'transparent'
            }}>
              {row.isPrice ? (
                <span style={{fontSize:c.highlight?20:16,fontWeight:900,
                  color:'var(--text-main)',fontStyle:'italic'}}>
                  {row[c.key]}
                </span>
              ) : renderCell(row[c.key])}
            </div>
          ))}
        </div>
      ))}

      {/* Footer buttons */}
      <div style={{display:'grid',gridTemplateColumns:'1fr repeat(3,180px)',borderTop:'1px solid var(--border-main)',background:'var(--bg-surface-soft)'}}>
        <div style={{padding:'20px 24px',fontSize:12,color:'var(--text-muted)',fontWeight:600,display:'flex',alignItems:'center'}}>
          * Upgrade ხელშეკრულებით
        </div>
        {cols.map(c => (
          <div key={c.key} style={{padding:'16px 12px',display:'flex',alignItems:'center',justifyContent:'center',
            background: c.highlight ? 'rgba(124,58,237,0.06)' : 'transparent'}}>
            {c.key === 'free' ? (
              <a href="/auth" style={{display:'block',width:'100%',textAlign:'center',
                padding:'10px 0',background:'var(--brand-deep)',color:'white',borderRadius:16,
                fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',textDecoration:'none'}}>
                დაიწყე
              </a>
            ) : (
              <a href="mailto:upgrade@dentalhub.ge" style={{display:'block',width:'100%',textAlign:'center',
                padding:'10px 0',
                background: c.highlight ? '#7C3AED' : 'var(--bg-surface-soft)',
                color: c.highlight ? 'white' : 'var(--text-main)',
                borderRadius:16,fontSize:10,fontWeight:900,textTransform:'uppercase',
                letterSpacing:'0.15em',textDecoration:'none'}}>
                კონტაქტი
              </a>
            )}
          </div>
        ))}
      </div>
      </div>
    </>
  );
};

const CHECK = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display:'inline-block',flexShrink:0}}>
      <circle cx="8" cy="8" r="7.5" fill="#7C3AED" fillOpacity="0.12" stroke="#7C3AED" strokeWidth="1"/>
      <path d="M5 8l2 2 4-4" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const DASH = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display:'inline-block',flexShrink:0}}>
      <circle cx="8" cy="8" r="7.5" fill="var(--bg-surface-soft)" stroke="var(--border-main)" strokeWidth="1"/>
      <path d="M5.5 8h5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

export default LandingPage;
