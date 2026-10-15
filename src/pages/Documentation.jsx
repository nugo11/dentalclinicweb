import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import { 
  Book, HelpCircle, Map, Layout, Users, Calendar, 
  Package, DollarSign, ShieldCheck, ChevronRight, ChevronDown,
  FileText, Activity, Zap, Info, ArrowRight,
  Plus, Search, Download, Printer, Settings,
  LogOut, Trash2, Edit, Save, CheckCircle, Database,
  UserPlus, Key, Award, AlertCircle, Eye, Lock,
  Clock, TrendingUp, CreditCard, Filter, 
  CalendarDays, ImageIcon, Upload, Menu,
  Calculator, AlertTriangle, Coffee, ClipboardList, Layers
} from 'lucide-react';

const DocAccordionSection = ({ id, title, subtitle, icon: Icon, isOpen, onToggle, children }) => (
  <div 
    id={id} 
    className="scroll-mt-24 bg-surface rounded-[32px] md:rounded-[44px] border border-border-main shadow-sm overflow-hidden transition-all duration-300 hover:border-brand-purple/30"
  >
    <button
      onClick={onToggle}
      className={`w-full p-5 sm:p-7 md:p-8 flex items-center justify-between text-left transition-colors cursor-pointer group ${isOpen ? 'bg-surface-soft/40 border-b border-border-main' : 'hover:bg-surface-soft/60'}`}
      aria-expanded={isOpen}
    >
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'bg-brand-purple/10 text-brand-purple group-hover:scale-105'}`}>
          <Icon size={22} className="sm:w-7 sm:h-7" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg sm:text-2xl font-black text-text-main italic tracking-tight">
              {title}
            </h2>
            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full transition-colors ${isOpen ? 'bg-brand-purple/15 text-brand-purple' : 'bg-surface-soft text-text-muted border border-border-main'}`}>
              {isOpen ? 'ჩაშლილია' : 'დაკეცილია'}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-text-muted font-bold uppercase tracking-wider mt-1 truncate">
            {subtitle || 'Advanced Logic & Rules'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 ${isOpen ? 'bg-brand-purple text-white rotate-180 shadow-md shadow-brand-purple/20' : 'bg-surface-soft text-text-muted group-hover:bg-brand-purple/10 group-hover:text-brand-purple'}`}>
          <ChevronDown size={18} className="sm:w-5 sm:h-5" />
        </div>
      </div>
    </button>

    {isOpen && (
      <div className="p-4 sm:p-8 md:p-10 space-y-8 bg-surface animate-in fade-in slide-in-from-top-3 duration-300">
        {children}
      </div>
    )}
  </div>
);

const FeatureCard = ({ title, desc, buttons = [], fields = [], roles = [], logic = [] }) => (
  <div className="bg-surface-soft/40 p-5 sm:p-8 md:p-10 rounded-[28px] md:rounded-[36px] border border-border-main space-y-6 md:space-y-8">
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border-main pb-6">
      <div className="space-y-3">
        <h4 className="font-black text-text-main uppercase text-lg sm:text-xl flex items-center gap-3 italic">
           <div className="w-3.5 h-3.5 bg-brand-purple rounded-full shrink-0"></div>
           {title}
        </h4>
        <p className="text-sm font-bold text-text-muted leading-relaxed max-w-3xl">{desc}</p>
      </div>
      
      {roles.length > 0 && (
        <div className="flex flex-wrap gap-2 shrink-0">
           {roles.map((role, idx) => (
             <span key={idx} className="px-4 py-1.5 bg-surface text-text-muted rounded-xl text-[9px] font-black uppercase tracking-widest border border-border-main shadow-xs">
               {role}
             </span>
           ))}
        </div>
      )}
    </div>

    {logic.length > 0 && (
      <div className="bg-brand-purple/5 p-5 sm:p-8 rounded-[24px] md:rounded-[30px] space-y-4">
        <p className="text-[10px] md:text-[11px] font-black text-brand-purple uppercase tracking-[0.2em] flex items-center gap-2.5">
          <Zap size={15} /> სისტემური ლოგიკა & წესები:
        </p>
        <div className="grid grid-cols-1 gap-3">
          {logic.map((l, i) => (
            <div key={i} className="flex gap-3.5 p-4 bg-surface rounded-2xl border border-brand-purple/10">
              <div className="w-6 h-6 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 font-black text-[11px]">
                {i + 1}
              </div>
              <p className="text-xs font-bold text-text-main leading-relaxed">{l}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {fields.length > 0 && (
      <div className="bg-surface p-5 sm:p-8 rounded-[24px] md:rounded-[30px] space-y-6 border border-border-main">
        <p className="text-[10px] md:text-[11px] font-black text-text-main uppercase tracking-widest flex items-center gap-2.5">
          <Info size={14} className="text-brand-purple" /> ველების დეტალური აღწერა:
        </p>
        <div className="grid grid-cols-1 gap-3">
          {fields.map((f, i) => (
            <div key={i} className="bg-surface-soft/60 p-4 rounded-2xl border border-border-main space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-[11px] text-text-main uppercase tracking-tighter">{f.name}</span>
                {f.restricted && (
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    <Lock size={11} /> როლური შეზღუდვა
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-text-muted leading-relaxed italic">
                 {f.guide}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {buttons.length > 0 && (
      <div className="space-y-3">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">ინტერაქტიული ღილაკები:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buttons.map((btn, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-surface rounded-2xl group hover:bg-brand-purple/5 transition-all border border-border-main">
              <div className="p-3 bg-surface-soft rounded-xl text-brand-purple shadow-xs group-hover:scale-105 transition-transform shrink-0">
                {btn.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-text-main uppercase tracking-tighter truncate">{btn.name}</p>
                <p className="text-[10px] text-text-muted font-bold leading-tight mt-0.5">{btn.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const Documentation = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Accordion state: by default first topic is open for guidance
  const [openSections, setOpenSections] = useState({
    calendar: true,
  });

  const navItems = [
    { 
      id: 'calendar', 
      name: 'კალენდარი', 
      title: 'კალენდარი & გეგმარება',
      subtitle: 'ჯავშნების მართვის იერარქია და დროის დაბლოკვა',
      icon: Calendar 
    },
    { 
      id: 'patients', 
      name: 'პაციენტები', 
      title: 'პაციენტთა ბაზა (CRM)',
      subtitle: 'სამედიცინო ბარათი, ისტორია და კბილების რუკა',
      icon: Users 
    },
    { 
      id: 'treatments', 
      name: 'მიმდინარე', 
      title: 'ჩახურვის პროცესი',
      subtitle: 'ბილინგი, მასალების ჩამოწერა და EHR (ფორმა 100)',
      icon: Activity 
    },
    { 
      id: 'archive', 
      name: 'ფინანსები', 
      title: 'ფინანსური არქივი',
      subtitle: 'შემოსავლების კონტროლი, გადახდის ტიპები და რეპორტები',
      icon: DollarSign 
    },
    { 
      id: 'inventory', 
      name: 'საწყობი', 
      title: 'საწყობი & მასალები',
      subtitle: 'ავტომატიზირებული ჩამოწერა და ნაშთების მონიტორინგი',
      icon: Package 
    },
    { 
      id: 'staff', 
      name: 'პერსონალი', 
      title: 'პერსონალის უსაფრთხოება',
      subtitle: 'წვდომის კონტროლი, როლები და PIN კოდის დაცვა',
      icon: UserPlus 
    },
    { 
      id: 'settings', 
      name: 'პარამეტრები', 
      title: 'კლინიკის პარამეტრები & პაკეტები',
      subtitle: 'კონფიგურაცია, პაკეტები (Billing) და პორტფოლიო',
      icon: Settings 
    }
  ];

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all = {};
    navItems.forEach(item => { all[item.id] = true; });
    setOpenSections(all);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const handleNavClick = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <>
      <Helmet>
        <title>დახმარება & დოკუმენტაცია — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

          <main className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 lg:gap-12 p-4 sm:p-8 md:p-12">
              
              {/* Sticky Wiki Navigation on large screens */}
              <aside className="hidden xl:block w-72 shrink-0">
                 <div className="sticky top-6 space-y-5">
                    <div className="bg-brand-deep p-8 rounded-[36px] text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Book size={18} className="text-brand-purple" />
                          <h3 className="text-xl font-black italic tracking-tighter">AiDent Wiki</h3>
                        </div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6">სისტემური გზამკვლევი</p>
                        
                        <nav className="space-y-1.5">
                          {navItems.map(item => {
                            const isSectionOpen = !!openSections[item.id];
                            return (
                              <button 
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left group cursor-pointer ${isSectionOpen ? 'bg-surface/15 text-white' : 'hover:bg-surface/10 text-white/60 hover:text-white'}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <item.icon size={18} className={isSectionOpen ? 'text-brand-purple' : 'text-white/40 group-hover:text-white transition-colors'} />
                                  <span className="text-[11px] font-black uppercase tracking-wider truncate">{item.name}</span>
                                </div>
                                <span className={`w-2 h-2 rounded-full transition-all ${isSectionOpen ? 'bg-brand-purple' : 'bg-transparent'}`}></span>
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-brand-purple/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Quick Expand / Collapse Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={expandAll}
                        className="flex-1 py-3 px-3 bg-surface hover:bg-surface-soft border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-text-main transition-all text-center cursor-pointer active:scale-95 shadow-xs"
                      >
                        ყველას გახსნა
                      </button>
                      <button
                        onClick={collapseAll}
                        className="flex-1 py-3 px-3 bg-surface hover:bg-surface-soft border border-border-main rounded-2xl text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-text-main transition-all text-center cursor-pointer active:scale-95 shadow-xs"
                      >
                        ყველას დახურვა
                      </button>
                    </div>
                 </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 space-y-6 sm:space-y-8 min-w-0">
                {/* Header Section */}
                <div className="pb-6 sm:pb-8 border-b border-border-main flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-text-main italic tracking-tighter leading-none mb-3">
                      სისტემის <span className="text-brand-purple">ლოგიკა</span>
                    </h1>
                    <p className="text-text-muted font-bold text-xs sm:text-sm uppercase tracking-widest">
                      დააჭირეთ თემას ინფორმაციის ჩამოსაშლელად
                    </p>
                  </div>

                  {/* Mobile Quick Expand/Collapse */}
                  <div className="flex items-center gap-2 xl:hidden shrink-0">
                    <button
                      onClick={expandAll}
                      className="py-2.5 px-4 bg-surface hover:bg-surface-soft border border-border-main rounded-xl text-[10px] font-black uppercase tracking-wider text-text-muted transition-all active:scale-95 shadow-xs"
                    >
                      ყველას გახსნა
                    </button>
                    <button
                      onClick={collapseAll}
                      className="py-2.5 px-4 bg-surface hover:bg-surface-soft border border-border-main rounded-xl text-[10px] font-black uppercase tracking-wider text-text-muted transition-all active:scale-95 shadow-xs"
                    >
                      ყველას დახურვა
                    </button>
                  </div>
                </div>

                {/* 1. კალენდარი */}
                <DocAccordionSection 
                  id="calendar" 
                  title="კალენდარი & გეგმარება" 
                  subtitle="ჯავშნების მართვა, ექიმების განრიგი და პირადი დროის დაბლოკვა"
                  icon={Calendar}
                  isOpen={!!openSections.calendar}
                  onToggle={() => toggleSection('calendar')}
                >
                  <FeatureCard 
                    title="ჯავშნების მართვის იერარქია" 
                    desc="ვინ ვისთვის ჯავშნის? წესები და კონფლიქტების პრევენცია."
                    roles={["Admin", "Manager", "Receptionist", "Doctor"]}
                    logic={[
                      "ადმინისტრატორი, მენეჯერი და რეგისტრატორი ფლობენ სრულ კონტროლს - მათ შეუძლიათ ნებისმიერი ექიმის განრიგში ჯავშნის დამატება, გადატანა ან წაშლა.",
                      "ექიმი შეზღუდულია მხოლოდ საკუთარი განრიგით. მას შეუძლია ჯავშნის დამატება მხოლოდ თავის თავზე. სხვა ექიმების განრიგს ის მხოლოდ საინფორმაციო რეჟიმში ხედავს.",
                      "ექიმს აქვს შესაძლებლობა ჩანიშნოს 'გარე კლინიკის ჯავშანი' (ან პერსონალური დროის ბლოკი). ეს აისახება საერთო კალენდარში, რათა სხვა როლებმა დაინახონ, რომ ექიმი დაკავებულია და არ მოხდეს დროის კონფლიქტი.",
                      "ბუღალტერი საერთოდ არ ფლობს წვდომას კალენდარზე. მისთვის ეს მოდული დამალულია უსაფრთხოების მიზნით."
                    ]}
                    buttons={[
                      { icon: <Coffee size={14} />, name: "დროის დაბლოკვა", action: "ექიმისთვის: პირადი დროის ან სხვა კლინიკის ვიზიტის მონიშვნა." },
                      { icon: <Plus size={14} />, name: "სხვისი ჯავშანი", action: "რეგისტრატორისთვის: ნებისმიერ ექიმთან პაციენტის ჩაწერა." }
                    ]}
                  />
                </DocAccordionSection>

                {/* 2. პაციენტები */}
                <DocAccordionSection 
                  id="patients" 
                  title="პაციენტთა ბაზა (CRM)" 
                  subtitle="სამედიცინო ბარათი, ისტორია, ალერგიები და კბილების რუკა"
                  icon={Users}
                  isOpen={!!openSections.patients}
                  onToggle={() => toggleSection('patients')}
                >
                  <FeatureCard 
                    title="სამედიცინო ბარათის მართვა" 
                    desc="პაციენტის ისტორია, კბილების რუკა და პერსონალური მონაცემები."
                    roles={["Admin", "Manager", "Receptionist", "Doctor"]}
                    logic={[
                      "ახალი პაციენტის დამატება შეუძლია ყველას, გარდა ბუღალტრისა. ეს კეთდება სწრაფი რეგისტრაციის ფორმით.",
                      "კბილების რუკა და სამედიცინო ისტორია ხელმისაწვდომია მხოლოდ ექიმებისთვის, მენეჯერებისთვის და ადმინისთვის. რეგისტრატორი ხედავს მხოლოდ საკონტაქტო ინფორმაციას.",
                      "პაციენტის წაშლა კატეგორიულად აკრძალულია ყველასთვის, გარდა ადმინისტრატორისა, რათა არ მოხდეს სამედიცინო ისტორიის შემთხვევითი დაკარგვა.",
                      "სისტემა ავტომატურად აჯგუფებს პაციენტებს მათი ვიზიტების სიხშირისა და სტატუსის მიხედვით."
                    ]}
                    buttons={[
                      { icon: <Plus size={14} />, name: "ახალი პაციენტი", action: "სწრაფი რეგისტრაცია და ბაზაში დამატება." },
                      { icon: <Map size={14} />, name: "კბილების რუკა", action: "ვიზუალური ისტორიის მართვა და ჩანაწერები." }
                    ]}
                  />
                </DocAccordionSection>

                {/* 3. მიმდინარე მკურნალობა */}
                <DocAccordionSection 
                  id="treatments" 
                  title="ჩახურვის პროცესი & EHR" 
                  subtitle="ბილინგის ბიზნეს წესები, მასალების ჩამოწერა და ფორმა 100"
                  icon={Activity}
                  isOpen={!!openSections.treatments}
                  onToggle={() => toggleSection('treatments')}
                >
                  <FeatureCard 
                    title="ბილინგის ბიზნეს წესები" 
                    desc="მკურნალობის დასრულების და ფინანსური გაფორმების ლოგიკა."
                    roles={["Admin", "Manager", "Receptionist", "Doctor", "Accountant"]}
                    logic={[
                      "ექიმს შეუძლია ჩახუროს (დაასრულოს) მხოლოდ საკუთარი შეკვეთები. მას არ აქვს უფლება ჩაერიოს სხვა კოლეგის მკურნალობის ფინანსურ მხარეში.",
                      "რეგისტრატორს შეუძლია ჩახუროს ნებისმიერი ექიმის შეკვეთა. ეს საჭიროა იმისთვის, რომ როდესაც პაციენტი მიდის კლინიკიდან, მან თანხა რეგისტრატურაში გადაიხადოს.",
                      "ჩახურვისას სისტემა ავტომატურად ითვლის მასალების ხარჯს საწყობიდან, სერვისების წინასწარი კონფიგურაციის მიხედვით.",
                      "თუ კლინიკას აქვს 'Business' ან 'Custom' პაკეტი და ჩართული აქვს EHR, ჩახურვის მომენტში ექიმი უთითებს დაავადების ICD-10 კოდს და სერვისების NCSP კოდებს. სისტემა ავტომატურად აგზავნის და ამტკიცებს ფორმა 100-ს ჯანდაცვის სამინისტროს ბაზაში.",
                      "ბუღალტერი ხედავს ყველა მიმდინარე შეკვეთას, მაგრამ მისი როლი შემოიფარგლება მხოლოდ მონიტორინგით."
                    ]}
                  />
                </DocAccordionSection>

                {/* 4. ფინანსური არქივი */}
                <DocAccordionSection 
                  id="archive" 
                  title="ფინანსური არქივი" 
                  subtitle="შემოსავლების კონტროლი, გადახდის მეთოდები და რეპორტები"
                  icon={DollarSign}
                  isOpen={!!openSections.archive}
                  onToggle={() => toggleSection('archive')}
                >
                  <FeatureCard 
                    title="შემოსავლების კონტროლი" 
                    desc="დასრულებული ვიზიტების რეესტრი და ფილტრაცია."
                    roles={["Admin", "Manager", "Accountant"]}
                    logic={[
                      "არქივი ხელმისაწვდომია მხოლოდ მენეჯერული რგოლისთვის და ბუღალტრისთვის. ექიმები და რეგისტრატორები ვერ ხედავენ კლინიკის ჯამურ შემოსავლებს.",
                      "სისტემა საშუალებას იძლევა გაიფილტროს მონაცემები გადახდის მეთოდის (ნაღდი/ბარათი/დაზღვევა) მიხედვით.",
                      "PDF ექსპორტი საშუალებას იძლევა მომენტალურად გენერირდეს ფინანსური რეპორტი ნებისმიერი პერიოდისთვის.",
                      "სადაზღვევო შემთხვევების მართვა ხდება ცალკე ფილტრით, რაც აადვილებს სადაზღვევოებთან ანგარიშსწორებას."
                    ]}
                    buttons={[
                      { icon: <Filter size={14} />, name: "ფილტრაცია", action: "მონაცემების დახარისხება თარიღის, ექიმის ან გადახდის ტიპის მიხედვით." },
                      { icon: <Download size={14} />, name: "PDF ექსპორტი", action: "ფინანსური ანგარიშის ჩამოტვირთვა." }
                    ]}
                  />
                </DocAccordionSection>

                {/* 5. საწყობი */}
                <DocAccordionSection 
                  id="inventory" 
                  title="საწყობი & მასალები" 
                  subtitle="ავტომატიზირებული ჩამოწერა და ნაშთების კონტროლი"
                  icon={Package}
                  isOpen={!!openSections.inventory}
                  onToggle={() => toggleSection('inventory')}
                >
                  <FeatureCard 
                    title="ავტომატიზირებული ჩამოწერა" 
                    desc="როგორ უკავშირდება მკურნალობა საწყობს."
                    roles={["Admin", "Manager", "Accountant"]}
                    logic={[
                      "მასალების ხელით ჩამოწერა არ არის საჭირო. როდესაც ექიმი ან რეგისტრატორი ხურავს ვიზიტს, სისტემა თავად ამოწმებს რომელი სერვისები ჩატარდა და რა მასალები იყო მათზე მიბმული.",
                      "თუ მასალის რაოდენობა კრიტიკულ ზღვარს ქვემოთ ჩამოდის, სისტემა დაშბორდზე აგდებს წითელ გაფრთხილებას, რათა ადმინისტრატორმა დროულად მოახდინოს შესყიდვა.",
                      "ბუღალტერს და მენეჯერს აქვთ უფლება ნახონ ნაშთები და ფასები, რათა აწარმოონ ფინანსური ანგარიშგება, თუმცა რაოდენობის ხელით ცვლილება მათთვის აკრძალულია."
                    ]}
                  />
                </DocAccordionSection>

                {/* 6. პერსონალი */}
                <DocAccordionSection 
                  id="staff" 
                  title="პერსონალის უსაფრთხოება" 
                  subtitle="წვდომის კონტროლი, თანამშრომელთა როლები და PIN დაცვა"
                  icon={UserPlus}
                  isOpen={!!openSections.staff}
                  onToggle={() => toggleSection('staff')}
                >
                  <FeatureCard 
                    title="წვდომის კონტროლი" 
                    desc="სისტემის დაცვის მექანიზმები და თანამშრომლების ექაუნთები."
                    roles={["Admin", "Manager"]}
                    logic={[
                      "ადმინისტრატორს და მენეჯერს აქვთ უფლება შექმნან ახალი მომხმარებელი და მიანიჭონ როლი. როლის შეცვლა მომენტალურად ცვლის მომხმარებლის უფლებებს.",
                      "PIN კოდი არის ერთადერთი გზა სისტემაში ავტორიზაციისთვის. მენეჯმენტს შეუძლია პინის აღდგენა, თუ თანამშრომელს დაავიწყდება.",
                      "პაკეტების მიხედვით შეზღუდულია ექიმების დამატების რაოდენობა: Free - 3 ექიმი, Business - 6 ექიმი, Custom - შეთანხმებით."
                    ]}
                  />
                </DocAccordionSection>

                {/* 7. პარამეტრები & პაკეტები */}
                <DocAccordionSection 
                  id="settings" 
                  title="კლინიკის პარამეტრები & პაკეტები" 
                  subtitle="კონფიგურაცია, პაკეტები (Billing) და პორტფოლიო"
                  icon={Settings}
                  isOpen={!!openSections.settings}
                  onToggle={() => toggleSection('settings')}
                >
                  <FeatureCard 
                    title="კონფიგურაცია & ბილინგი" 
                    desc="კლინიკის გლობალური მართვა და პაკეტების (Subscriptions) ცვლილება."
                    roles={["Admin"]}
                    logic={[
                      "პარამეტრების და სერვისების მოდულები ხელმისაწვდომია ექსკლუზიურად ადმინისტრატორისთვის და მენეჯერისთვის.",
                      "სისტემა გვთავაზობს 3 ძირითად პაკეტს: Free (სატესტო, 3 ექიმის ლიმიტით), Business (მაქსიმუმ 6 ექიმი) და Custom (ულიმიტო ექიმი შეთანხმებით).",
                      "Business და Custom პაკეტებში აქტიურდება დამატებითი ფუნქციები: SMS შეხსენებები პაციენტებისთვის, EHR (სახელმწიფო ჯანდაცვის) სინქრონიზაცია და VIP სტატუსი კატალოგში.",
                      "კლინიკის კატალოგში გამოსაჩენი ინფორმაციის (ლოგო, აღწერა, ფოტოები) მართვა ხდება 'პორტფოლიოს' სექციიდან.",
                      "სერვისებზე მასალების მიბმა - განისაზღვრება თუ რომელი პროცედურის ჩატარებისას რა მასალა უნდა ჩამოიწეროს ავტომატურად."
                    ]}
                    buttons={[
                      { icon: <ClipboardList size={14} />, name: "სერვისების მართვა", action: "პროცედურების და ფასების რედაქტირება." },
                      { icon: <CreditCard size={14} />, name: "გამოწერა (Billing)", action: "მიმდინარე პაკეტის მართვა და დეტალების ნახვა." }
                    ]}
                  />
                </DocAccordionSection>

                {/* Footer Banner */}
                <div className="bg-brand-deep p-8 sm:p-14 rounded-[36px] sm:rounded-[48px] text-white text-center space-y-4 sm:space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 p-8 opacity-5 scale-150">
                      <AlertTriangle size={150} />
                   </div>
                   <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter leading-tight">ლოგიკა უპირველეს ყოვლისა</h3>
                      <p className="text-white/50 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] leading-relaxed">
                         AiDent შექმნილია იმისთვის, რომ მინიმუმამდე დაიყვანოს ადამიანური შეცდომები და კონფლიქტები კლინიკის მართვისას.
                      </p>
                   </div>
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Documentation;
