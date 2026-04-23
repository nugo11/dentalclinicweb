import React, { useState } from 'react';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import { 
  Book, HelpCircle, Map, Layout, Users, Calendar, 
  Package, DollarSign, ShieldCheck, ChevronRight,
  FileText, Activity, Zap, Info, ArrowRight,
  Plus, Search, Download, Printer, Settings,
  LogOut, Trash2, Edit, Save, CheckCircle, Database,
  UserPlus, Key, Award, AlertCircle, Eye, Lock,
  Clock, TrendingUp, CreditCard, Filter, 
  CalendarDays, ImageIcon, Upload, Menu,
  Calculator, AlertTriangle, Coffee, ClipboardList
} from 'lucide-react';

const DocContentSection = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="scroll-mt-24 space-y-12 py-24 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-8">
      <div className="w-24 h-24 bg-brand-purple/10 text-brand-purple rounded-[40px] flex items-center justify-center shadow-sm">
        <Icon size={44} />
      </div>
      <div>
        <h2 className="text-6xl font-black text-brand-deep italic uppercase tracking-tighter leading-none">{title}</h2>
        <p className="text-sm text-brand-purple font-black uppercase tracking-[0.5em] mt-4 italic">Advanced Logic & Business Rules</p>
      </div>
    </div>
    <div className="space-y-16">
      {children}
    </div>
  </section>
);

const FeatureCard = ({ title, desc, buttons = [], fields = [], roles = [], logic = [] }) => (
  <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm hover:border-brand-purple/20 transition-all space-y-10">
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-slate-50 pb-10">
      <div className="space-y-5">
        <h4 className="font-black text-brand-deep uppercase text-xl flex items-center gap-4 italic">
           <div className="w-4 h-4 bg-brand-purple rounded-full"></div>
           {title}
        </h4>
        <p className="text-base font-bold text-slate-500 leading-relaxed max-w-3xl">{desc}</p>
      </div>
      
      {roles.length > 0 && (
        <div className="flex flex-wrap gap-2 shrink-0">
           {roles.map((role, idx) => (
             <span key={idx} className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
               {role}
             </span>
           ))}
        </div>
      )}
    </div>

    {logic.length > 0 && (
      <div className="bg-brand-purple/5 p-10 rounded-[40px] space-y-6">
        <p className="text-[12px] font-black text-brand-purple uppercase tracking-[0.2em] flex items-center gap-3">
          <Zap size={18} /> სისტემური ლოგიკა & წესები:
        </p>
        <div className="grid grid-cols-1 gap-4">
          {logic.map((l, i) => (
            <div key={i} className="flex gap-4 p-5 bg-white rounded-3xl border border-brand-purple/10">
              <div className="w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 font-black text-xs">
                {i + 1}
              </div>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">{l}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {fields.length > 0 && (
      <div className="bg-slate-50 p-10 rounded-[40px] space-y-8">
        <p className="text-[11px] font-black text-brand-deep uppercase tracking-widest flex items-center gap-3">
          <Info size={16} className="text-brand-purple" /> ველების დეტალური აღწერა:
        </p>
        <div className="grid grid-cols-1 gap-4">
          {fields.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-[11px] text-brand-deep uppercase tracking-tighter">{f.name}</span>
                {f.restricted && (
                  <span className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase bg-amber-50 px-3 py-1 rounded-full">
                    <Lock size={12} /> როლური შეზღუდვა
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                 {f.guide}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {buttons.length > 0 && (
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ინტერაქტიული ღილაკები:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buttons.map((btn, idx) => (
            <div key={idx} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[32px] group hover:bg-brand-purple/5 transition-all border border-transparent">
              <div className="p-4 bg-white rounded-2xl text-brand-purple shadow-sm group-hover:scale-110 transition-transform">
                {btn.icon}
              </div>
              <div>
                <p className="text-xs font-black text-brand-deep uppercase tracking-tighter">{btn.name}</p>
                <p className="text-[10px] text-slate-400 font-bold leading-tight mt-1">{btn.action}</p>
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

  const navItems = [
    { id: 'calendar', name: 'კალენდარი', icon: Calendar },
    { id: 'patients', name: 'პაციენტები', icon: Users },
    { id: 'treatments', name: 'მიმდინარე', icon: Activity },
    { id: 'archive', name: 'ფინანსები', icon: DollarSign },
    { id: 'inventory', name: 'საწყობი', icon: Package },
    { id: 'staff', name: 'პერსონალი', icon: UserPlus },
    { id: 'settings', name: 'პარამეტრები', icon: Settings }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto flex gap-12 p-8 lg:p-16">
            
            <aside className="hidden xl:block w-80 shrink-0">
               <div className="sticky top-8 space-y-6">
                  <div className="bg-brand-deep p-12 rounded-[60px] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black italic tracking-tighter mb-4">Dental Wiki</h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-10">Advanced Logic Guide</p>
                      <nav className="space-y-1">
                        {navItems.map(item => (
                          <button 
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className="w-full flex items-center gap-5 p-5 rounded-[24px] hover:bg-white/10 transition-all text-left group"
                          >
                            <item.icon size={22} className="text-brand-purple group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">{item.name}</span>
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-brand-purple/20 rounded-full blur-3xl"></div>
                  </div>
               </div>
            </aside>

            <div className="flex-1 space-y-6">
              <div className="pb-20 border-b border-slate-100">
                <h1 className="text-9xl font-black text-brand-deep italic tracking-tighter leading-[0.85] mb-10">
                  სრული <br /><span className="text-brand-purple">ლოგიკა</span>
                </h1>
                <p className="text-slate-400 font-bold text-lg max-w-3xl leading-relaxed uppercase tracking-[0.2em]">
                  როგორ მუშაობს სისტემა - წესები და შეზღუდვები
                </p>
              </div>

              <DocContentSection id="calendar" title="კალენდარი & გეგმარება" icon={Calendar}>
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
              </DocContentSection>

              <DocContentSection id="patients" title="პაციენტთა ბაზა (CRM)" icon={Users}>
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
              </DocContentSection>

              <DocContentSection id="treatments" title="ჩახურვის პროცესი" icon={Activity}>
                <FeatureCard 
                  title="ბილინგის ბიზნეს წესები" 
                  desc="მკურნალობის დასრულების და ფინანსური გაფორმების ლოგიკა."
                  roles={["Admin", "Manager", "Receptionist", "Doctor", "Accountant"]}
                  logic={[
                    "ექიმს შეუძლია ჩახუროს (დაასრულოს) მხოლოდ საკუთარი შეკვეთები. მას არ აქვს უფლება ჩაერიოს სხვა კოლეგის მკურნალობის ფინანსურ მხარეში.",
                    "რეგისტრატორს შეუძლია ჩახუროს ნებისმიერი ექიმის შეკვეთა. ეს საჭიროა იმისთვის, რომ როდესაც პაციენტი მიდის კლინიკიდან, მან თანხა რეგისტრატურაში გადაიხადოს.",
                    "ბუღალტერი ხედავს ყველა მიმდინარე შეკვეთას, მაგრამ მისი როლი შემოიფარგლება მხოლოდ მონიტორინგით. ის ხედავს ვინ არის პასუხისმგებელი ექიმი, რათა საჭიროების შემთხვევაში დაუკავშირდეს მას ჩაუხურავ შეკვეთაზე.",
                    "ჩახურვისას სისტემა ავტომატურად ითვლის მასალების ხარჯს საწყობიდან, სერვისების წინასწარი კონფიგურაციის მიხედვით."
                  ]}
                />
              </DocContentSection>

              <DocContentSection id="archive" title="ფინანსური არქივი" icon={DollarSign}>
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
              </DocContentSection>

              <DocContentSection id="inventory" title="საწყობი & მასალები" icon={Package}>
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
              </DocContentSection>

              <DocContentSection id="staff" title="პერსონალის უსაფრთხოება" icon={UserPlus}>
                <FeatureCard 
                  title="წვდომის კონტროლი" 
                  desc="სისტემის დაცვის მექანიზმები."
                  roles={["Admin"]}
                  logic={[
                    "მხოლოდ ადმინისტრატორს აქვს უფლება შექმნას ახალი მომხმარებელი და მიანიჭოს მას როლი. როლის შეცვლა მომენტალურად ცვლის მომხმარებლის ინტერფეისს და უფლებებს.",
                    "PIN კოდი არის ერთადერთი გზა სისტემაში ავტორიზაციისთვის. ადმინისტრატორს შეუძლია პინის აღდგენა, თუ თანამშრომელს დაავიწყდება.",
                    "სისტემა ინახავს ინფორმაციას იმის შესახებ, თუ ვინ და როდის ჩახურა კონკრეტული შეკვეთა, რაც გამორიცხავს ფინანსურ გაურკვევლობას."
                  ]}
                />
              </DocContentSection>

              <DocContentSection id="settings" title="კლინიკის პარამეტრები" icon={Settings}>
                <FeatureCard 
                  title="კონფიგურაცია & ბილინგი" 
                  desc="კლინიკის გლობალური მართვა."
                  roles={["Admin"]}
                  logic={[
                    "პარამეტრების და სერვისების მოდულები ხელმისაწვდომია ექსკლუზიურად ადმინისტრატორისთვის. მენეჯერებს, ექიმებს და სხვა როლებს ამ სექციებზე წვდომა შეზღუდული აქვთ.",
                    "აქ ხდება სერვისების ფასების და საწყობის კატალოგის მართვა.",
                    "ბილინგის სექციაში შესაძლებელია მიმდინარე პაკეტის ნახვა და გაუმჯობესება.",
                    "კლინიკის კატალოგში გამოსაჩენი ინფორმაციის (ლოგო, აღწერა, ფოტოები) მართვა ხდება სწორედ აქედან.",
                    "სერვისებზე მასალების მიბმა - აქ განისაზღვრება თუ რომელი სერვისის ჩატარებისას რა მასალა უნდა ჩამოიწეროს ავტომატურად."
                  ]}
                  buttons={[
                    { icon: <ClipboardList size={14} />, name: "სერვისების მართვა", action: "პროცედურების და ფასების რედაქტირება." },
                    { icon: <CreditCard size={14} />, name: "გამოწერა", action: "პაკეტების მართვა და დეტალების ნახვა." }
                  ]}
                />
              </DocContentSection>

              <div className="bg-brand-deep p-20 rounded-[80px] text-white text-center space-y-12 relative overflow-hidden">
                 <div className="absolute top-0 left-0 p-16 opacity-5 scale-150">
                    <AlertTriangle size={300} />
                 </div>
                 <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                    <h3 className="text-5xl font-black italic tracking-tighter leading-tight">ლოგიკა უპირველეს ყოვლისა</h3>
                    <p className="text-white/40 font-bold text-base uppercase tracking-[0.4em] leading-relaxed">
                       Dental Hub შექმნილია იმისთვის, რომ მინიმუმამდე დაიყვანოს ადამიანური შეცდომები და კონფლიქტები კლინიკის მართვისას.
                    </p>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documentation;
