import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import StatsGrid from '../components/Dashboard/StatsGrid';
import AppointmentsList from '../components/Dashboard/AppointmentsList';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentTreatments from '../components/Dashboard/RecentTreatments';
import { 
  AlertTriangle, PackageSearch, ChevronRight, Crown, Loader2, Clock, 
  Activity, CalendarDays, Zap, ArrowUpRight, DollarSign, 
  TrendingUp, Wallet, FileText, Users
} from 'lucide-react';

// --- სპეციალიზებული ბუღალტრული დაშბორდი ---
const AccountantDashboard = ({ userData }) => {
  const navigate = useNavigate();
  const [financialStats, setFinancialStats] = useState({
    monthlyRevenue: 0,
    pendingPayments: 0,
    dailyGrowth: "+0%",
    transactions: []
  });

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", userData.clinicId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const allApts = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(apt => new Date(apt.start) >= oneMonthAgo); // კლიენტის მხარეს ფილტრაცია
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let revenue = 0;
      let pending = 0;
      
      allApts.forEach(apt => {
        const aptDate = new Date(apt.start);
        const isCompleted = apt.status === 'completed_and_billed';
        
        if (isCompleted && aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear) {
          revenue += Number(apt.paidAmount || 0);
        }

        const total = Number(apt.price || 0);
        const paid = Number(apt.paidAmount || 0);
        if (total > paid) {
          pending += (total - paid);
        }
      });

      const recentTransactions = allApts
        .filter(apt => apt.status === 'completed_and_billed' || Number(apt.paidAmount) > 0)
        .sort((a, b) => new Date(b.finalizedAt || b.start) - new Date(a.finalizedAt || a.start))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          patient: t.patientName,
          amount: t.paidAmount || t.price,
          status: t.paidAmount >= t.price ? 'paid' : 'pending',
          date: new Date(t.finalizedAt || t.start).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }));

      setFinancialStats({
        monthlyRevenue: revenue,
        pendingPayments: pending,
        dailyGrowth: "+0%", 
        transactions: recentTransactions
      });
    });

    return () => unsubscribe();
  }, [userData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-all"></div>
           <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center mb-6">
                <DollarSign size={24} />
              </div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">თვიური ბრუნვა</h4>
              <p className="text-3xl font-black text-brand-deep italic tracking-tighter">₾ {financialStats.monthlyRevenue}</p>
              <div className="flex items-center gap-2 mt-4 text-emerald-500">
                <TrendingUp size={14} />
                <span className="text-[10px] font-black">{financialStats.dailyGrowth} ზრდა</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Wallet size={24} />
              </div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">მისაღები თანხა</h4>
              <p className="text-3xl font-black text-brand-deep italic tracking-tighter">₾ {financialStats.pendingPayments}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest">დავალიანების მქონე პაციენტები</p>
           </div>
        </div>

        <div className="bg-brand-deep p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-20">
              <Activity size={80} className="text-white" />
           </div>
           <div className="relative z-10 text-white">
              <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 italic">საგადასახადო</h4>
              <p className="text-4xl font-black italic tracking-tighter">100%</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-6 leading-relaxed">
                 ყველა ფინანსური დოკუმენტი წესრიგშია
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-brand-deep italic uppercase tracking-tighter">ბოლო ტრანზაქციები</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ფინანსური ისტორია</p>
              </div>
              <button className="px-5 py-2.5 bg-slate-50 text-brand-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">რეპორტი</button>
           </div>
           <div className="space-y-4">
              {financialStats.transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-5 rounded-[28px] border border-slate-50 hover:border-brand-purple/20 hover:bg-slate-50/30 transition-all group">
                   <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                         <FileText size={20} />
                      </div>
                      <div>
                         <p className="text-[13px] font-black text-brand-deep uppercase">{t.patient}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{t.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-brand-deep italic">₾ {t.amount}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${t.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                         {t.status === 'paid' ? 'გადახდილი' : 'მოლოდინში'}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <h4 className="text-[11px] font-black text-brand-deep uppercase tracking-widest mb-6">სწრაფი ქმედებები</h4>
              <div className="space-y-3">
                 <button onClick={() => navigate('/finance')} className="w-full p-4 bg-slate-50 hover:bg-brand-purple hover:text-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-3">
                    <TrendingUp size={16} /> ხარჯების აღრიცხვა
                 </button>
                 <button onClick={() => navigate('/archive')} className="w-full p-4 bg-slate-50 hover:bg-brand-purple hover:text-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-3">
                    <FileText size={16} /> საგადასახადო დეკლარაცია
                 </button>
                 <button onClick={() => navigate('/inventory')} className="w-full p-4 bg-slate-50 hover:bg-brand-purple hover:text-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-3">
                    <PackageSearch size={16} /> საწყობის დათვალიერება
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { userData, clinicData, loading, role, activeStaff } = useAuth(); 
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [todayVisitsCount, setTodayVisitsCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [staffCount, setStaffCount] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('დილა მშვიდობისა');
    else if (hour < 18) setGreeting('შუადღე მშვიდობისა');
    else setGreeting('საღამო მშვიდობისა');
  }, []);

  useEffect(() => {
    if (!userData || !userData.clinicId) return;

    // თანამშრომლების რაოდენობის წამოღება
    const qStaff = query(collection(db, "users"), where("clinicId", "==", userData.clinicId));
    getDocs(qStaff).then(snap => setStaffCount(snap.size));

    let qAppointments;
    if (role === "doctor") {
      // ვიყენებთ მხოლოდ doctorId-ს ინდექსების შეცდომის თავიდან ასაცილებლად
      qAppointments = query(
        collection(db, "appointments"),
        where("doctorId", "==", activeStaff?.id || userData?.uid)
      );
    } else {
      qAppointments = query(
        collection(db, "appointments"),
        where("clinicId", "==", userData.clinicId)
      );
    }

    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      const allData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // ფილტრაცია კლიენტის მხარეს (კლინიკის მიხედვით ექიმისთვის)
      const allApts = role === "doctor" 
        ? allData.filter(apt => apt.clinicId === userData.clinicId)
        : allData;

      setAppointments(allApts);

      const today = new Date().toISOString().split('T')[0];
      const count = allApts.filter(apt => 
        apt.start && apt.start.startsWith(today) && apt.status !== 'cancelled'
      ).length;
      setTodayVisitsCount(count);
    }, (error) => {
      console.error("Dashboard appointments error:", error);
    });

    const qInventory = query(
      collection(db, "inventory"),
      where("clinicId", "==", userData.clinicId)
    );
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const lowStock = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => item.quantity <= item.minThreshold);
      setLowStockItems(lowStock);
    });

    return () => {
      unsubAppointments();
      unsubInventory();
    };
  }, [userData, role, activeStaff]);

  const handleSeed = async () => {
    if (!userData?.clinicId || isSeeding) return;
    setIsSeeding(true);
    const res = await seedTestData(userData.clinicId);
    if (res.success) {
      alert("სატესტო მონაცემები წარმატებით დაემატა!");
    } else {
      alert("შეცდომა: " + res.error);
    }
    setIsSeeding(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header with Role Context */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-brand-deep italic tracking-tighter leading-none">
                  {(() => {
                    const nameParts = (activeStaff?.fullName || userData?.fullName || 'მომხმარებელო').split(' ');
                    const firstName = nameParts[0] === 'ექიმი' ? (nameParts[1] || nameParts[0]) : nameParts[0];
                    return `${greeting}, ${firstName}`;
                  })()}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                   <Activity size={12} className="text-brand-purple" />
                   {role === 'admin' ? 'კლინიკის მართვის პანელი' : 
                    role === 'doctor' ? 'პირადი სამუშაო სივრცე' : 
                    role === 'receptionist' ? 'რეგისტრატორის პანელი' : 
                    role === 'accountant' ? 'ბუღალტრული პანელი' : 
                    role === 'manager' ? 'მენეჯერის პანელი' : 'სისტემური პანელი'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <QuickActions />
              </div>
            </div>

            {/* --- როლების მიხედვით დაშბორდის ჩვენება --- */}
            {role === 'accountant' ? (
              <AccountantDashboard userData={userData} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Focus & Timeline */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* NEXT PATIENT FOCUS */}
                  {(role !== 'accountant' && role !== 'manager') && (() => {
                    const now = new Date();
                    const nextApp = appointments
                      .filter(a => new Date(a.start) > now && a.status !== 'cancelled')
                      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

                    if (!nextApp) {
                      return (
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-purple/20 transition-all">
                          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-purple/5 group-hover:text-brand-purple transition-all">
                            <CalendarDays size={32} />
                          </div>
                          <h3 className="text-lg font-black text-brand-deep italic">დღეს სხვა ჯავშნები არ გაქვთ</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">დაისვენეთ ან გადახედეთ ხვალინდელ გეგმას</p>
                        </div>
                      );
                    }

                    const startTime = new Date(nextApp.start);
                    const diffMins = Math.round((startTime - now) / 60000);
                    const initials = nextApp.patientName ? nextApp.patientName.split(' ').map(n => n[0]).join('') : '??';

                    return (
                      <div className="bg-white rounded-[40px] p-8 border border-brand-purple/20 shadow-xl shadow-brand-purple/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8">
                            <Crown size={64} className="text-brand-purple/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-purple text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-brand-purple/30">
                              <Clock size={12} /> შემდეგი ვიზიტი {diffMins < 60 ? `${diffMins} წუთში` : `${Math.floor(diffMins/60)} საათში`}
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-8">
                              <div className="w-24 h-24 bg-slate-50 text-brand-purple rounded-[32px] flex items-center justify-center text-3xl font-black shadow-inner uppercase">
                                  {initials}
                              </div>
                              <div className="flex-1">
                                  <h2 className="text-3xl font-black text-brand-deep tracking-tighter mb-2">{nextApp.patientName}</h2>
                                  <div className="flex flex-wrap gap-4 text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-brand-purple rounded-full"></div>
                                        <span className="text-xs font-bold">{nextApp.service}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold">{startTime.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                  <button onClick={() => navigate(`/patients/${nextApp.patientId}`)} className="px-6 py-3 bg-brand-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple transition-all active:scale-95 shadow-lg shadow-brand-deep/20">პროფილის ნახვა</button>
                              </div>
                            </div>
                        </div>
                      </div>
                    );
                  })()}

                  {role === 'manager' && (
                     <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                              <Users size={24} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-brand-deep italic uppercase tracking-tighter">კლინიკის დატვირთვა</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ოპერაციული მიმოხილვა</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-blue-200 transition-all">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">დღევანდელი ვიზიტები</p>
                              <p className="text-3xl font-black text-brand-deep italic">{todayVisitsCount}</p>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-blue-200 transition-all">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">აქტიური სტაფი</p>
                              <p className="text-3xl font-black text-brand-deep italic">{String(staffCount).padStart(2, '0')}</p>
                           </div>
                        </div>
                     </div>
                  )}

                  <AppointmentsList />
                  <RecentTreatments appointments={appointments} />
                </div>

                {/* Right Column: Statistics & Contextual Cards */}
                <div className="lg:col-span-4 space-y-8">
                  <StatsGrid />
                  
                  {/* ექიმის სპეციფიკური ბარათი */}
                  {role === "doctor" && (
                    <div className="bg-brand-purple p-8 rounded-[40px] shadow-2xl relative overflow-hidden group text-white">
                        <div className="absolute top-0 right-0 p-6 opacity-20">
                          <Zap size={80} className="fill-white" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 italic">სამუშაო დატვირთვა</h4>
                          <div className="flex items-end justify-between mb-6">
                            <p className="text-4xl font-black italic tracking-tighter">{todayVisitsCount} ვიზიტი</p>
                          </div>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-relaxed mb-6">
                            თქვენი დღევანდელი პაციენტების საერთო რაოდენობა
                          </p>
                          <button onClick={() => navigate('/calendar')} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            კალენდარი
                          </button>
                        </div>
                    </div>
                  )}

                  {/* რეგისტრატორის სპეციფიკური ბარათი */}
                  {role === "receptionist" && (
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center">
                          <CalendarDays size={24} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-brand-deep uppercase tracking-widest leading-none mb-1">ჯავშნები</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">დღევანდელი სტატისტიკა</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-brand-deep uppercase">სულ ვიზიტები</span>
                            <span className="text-lg font-black text-brand-purple">{todayVisitsCount}</span>
                          </div>
                      </div>
                    </div>
                  )}

                  {/* მენეჯერისა და ადმინისტრატორის შეტყობინებები */}
                  {(role === "admin" || role === "manager") && (
                    <>
                      <div className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm group">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <PackageSearch size={24} />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-brand-deep uppercase tracking-widest leading-none mb-1">ინვენტარი</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">დაბალი მარაგი</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {lowStockItems.length > 0 ? (
                            lowStockItems.map(item => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-amber-50/50 rounded-xl">
                                <span className="text-[10px] font-black text-brand-deep uppercase">{item.name}</span>
                                <span className="text-[10px] font-black text-amber-600 uppercase">{item.quantity} {item.unit}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 opacity-50">
                              <p className="text-[9px] font-black uppercase">ყველა მარაგი წესრიგშია</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-brand-deep p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Activity size={80} className="text-white" />
                        </div>
                        <div className="relative z-10 text-white">
                          <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 italic">ლაბორატორია</h4>
                          <div className="flex items-end justify-between mb-6">
                            <p className="text-4xl font-black italic tracking-tighter">00</p>
                            <div className="flex items-center gap-1 text-emerald-400">
                                <ArrowUpRight size={14} />
                                <span className="text-[10px] font-black">მზადაა</span>
                            </div>
                          </div>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-relaxed mb-6">
                            აქტიური შეკვეთები არ არის
                          </p>
                          <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            დეტალები
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;