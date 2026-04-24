import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import StatsGrid from '../components/Dashboard/StatsGrid';
import AppointmentsList from '../components/Dashboard/AppointmentsList';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentTreatments from '../components/Dashboard/RecentTreatments';
import SalaryReminder from '../components/Dashboard/SalaryReminder';
import PWAInstallBanner from '../components/PWAInstallBanner';
import { 
  AlertTriangle, PackageSearch, ChevronRight, Crown, Loader2, Clock, 
  Activity, CalendarDays, Zap, ArrowUpRight, DollarSign, 
  TrendingUp, Wallet, FileText, Users, Tag, Phone
} from 'lucide-react';

const Dashboard = () => {
  const { userData, loading, role, activeStaff, clinicData } = useAuth(); 
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [todayVisitsCount, setTodayVisitsCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [paidStaffIds, setPaidStaffIds] = useState([]);
  const [pendingClosuresCount, setPendingClosuresCount] = useState(0);
  const [monthlyPatientsCount, setMonthlyPatientsCount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('დილა მშვიდობისა');
    else if (hour < 18) setGreeting('შუადღე მშვიდობისა');
    else setGreeting('საღამო მშვიდობისა');
  }, []);

  useEffect(() => {
    if (!userData?.clinicId) return;

    // თანამშრომლები
    const qStaff = query(collection(db, "users"), where("clinicId", "==", userData.clinicId));
    const unsubStaff = onSnapshot(qStaff, (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthStr = now.toISOString().slice(0, 7);

    // ფინანსები: შემოსავალი მოდის appointments-იდან, ხარჯები ორივედან
    const qFinance = query(collection(db, 'finance'), where('clinicId', '==', userData.clinicId));
    const qAptsFinance = query(
      collection(db, 'appointments'),
      where('clinicId', '==', userData.clinicId),
      where('status', '==', 'completed_and_billed')
    );

    let aptInc = 0;
    let aptExp = 0;
    let finInc = 0;
    let finExp = 0;
    let paidIds = [];

    const updateFinancials = () => {
      setMonthlyIncome(aptInc + finInc);
      setMonthlyExpenses(aptExp + finExp);
      setPaidStaffIds(paidIds);
    };

    const unsubAptsFinance = onSnapshot(qAptsFinance, (snap) => {
      let inc = 0;
      let exp = 0;
      snap.docs.forEach(doc => {
        const d = doc.data();
        const rawDate = d.finalizedAt || d.start;
        let dt = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate || 0);
        if (dt >= startOfMonth) {
          inc += Number(d.price || 0);
          exp += Number(d.materialCost || 0);
        }
      });
      aptInc = inc;
      aptExp = exp;
      updateFinancials();
    });

    const unsubFinance = onSnapshot(qFinance, (snap) => {
      let inc = 0;
      let exp = 0;
      let pIds = [];
      snap.docs.forEach(doc => {
        const d = doc.data();
        const rawDate = d.date || d.createdAt;
        let dt = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate || 0);
        
        if (dt >= startOfMonth) {
          if (d.category === 'შემოსავალი' || d.type === 'income') inc += Number(d.amount || 0);
          if (d.category === 'ხელფასი' || d.type === 'expense') exp += Number(d.amount || 0);
        }

        if (d.category === 'ხელფასი' && d.paidMonth === currentMonthStr) {
          pIds.push(d.staffId);
        }
      });
      finInc = inc;
      finExp = exp;
      paidIds = pIds;
      updateFinancials();
    });

    // ჯავშნები
    let qAppointments;
    if (role === "doctor") {
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
      const allApts = role === "doctor" 
        ? allData.filter(apt => apt.clinicId === userData.clinicId)
        : allData;

      setAppointments(allApts);

      const todayStr = new Date().toISOString().split('T')[0];
      const count = allApts.filter(apt => 
        apt.start && apt.start.startsWith(todayStr) && apt.status !== 'cancelled'
      ).length;
      setTodayVisitsCount(count);

      const pending = allApts.filter(apt => {
        const aptEnd = new Date(apt.end);
        return aptEnd < now && apt.status !== 'completed_and_billed' && apt.status !== 'cancelled';
      }).length;
      setPendingClosuresCount(pending);
    });

    // პაციენტების ზრდა
    const qPatients = query(collection(db, "patients"), where("clinicId", "==", userData.clinicId));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      const recent = snapshot.docs.filter(doc => {
        const data = doc.data();
        let createdAt;
        if (data.createdAt?.toDate) createdAt = data.createdAt.toDate();
        else if (data.createdAt) createdAt = new Date(data.createdAt);
        else createdAt = new Date(0);
        
        return createdAt >= startOfMonth;
      }).length;
      setMonthlyPatientsCount(recent);
    });

    // ინვენტარის განგაში
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
      unsubStaff();
      unsubAptsFinance();
      unsubFinance();
      unsubAppointments();
      unsubPatients();
      unsubInventory();
    };
  }, [userData, role, activeStaff]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface-soft">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>სამართავი პანელი — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <PWAInstallBanner />

        {/* --- Missing Phone Number Warning --- */}
        {role === 'admin' && clinicData?.plan !== 'free' && !clinicData?.phone && (
          <div className="mx-4 sm:mx-8 mt-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-500/10 border-2 border-red-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                   <Phone size={28} />
                </div>
                <div>
                   <h4 className="text-lg font-black text-red-600 italic tracking-tighter">საკონტაქტო ნომერი არ არის დამატებული!</h4>
                   <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mt-1">SMS შეტყობინებების გასაგზავნად აუცილებელია კლინიკის ნომრის მითითება</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/settings/portfolio')}
                className="w-full sm:w-auto px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                პორტფოლიოში გადასვლა <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-text-main italic tracking-tighter leading-none">
                  {(() => {
                    const nameParts = (activeStaff?.fullName || userData?.fullName || 'მომხმარებელო').split(' ');
                    const firstName = nameParts[0] === 'ექიმი' ? (nameParts[1] || nameParts[0]) : nameParts[0];
                    return `${greeting}, ${firstName}`;
                  })()}
                </h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* NEXT PATIENT FOCUS */}
                {(role !== 'accountant' && role !== 'manager') && (() => {
                  const now = new Date();
                  const nextApp = appointments
                    .filter(a => new Date(a.start) > now && a.status !== 'cancelled')
                    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

                  if (!nextApp) {
                    return (
                      <div className="bg-surface rounded-[40px] p-10 border border-border-main shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-purple/20 transition-all">
                        <div className="w-16 h-16 bg-surface-soft text-text-muted rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-purple/5 group-hover:text-brand-purple transition-all">
                          <CalendarDays size={32} />
                        </div>
                        <h3 className="text-lg font-black text-text-main italic">დღეს სხვა ჯავშნები არ გაქვთ</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">დაისვენეთ ან გადახედეთ ხვალინდელ გეგმას</p>
                      </div>
                    );
                  }

                  const startTime = new Date(nextApp.start);
                  const diffMins = Math.round((startTime - now) / 60000);
                  const initials = nextApp.patientName ? nextApp.patientName.split(' ').map(n => n[0]).join('') : '??';

                  return (
                    <div className="bg-surface rounded-[40px] p-8 border border-brand-purple/20 shadow-xl shadow-brand-purple/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8">
                          <Crown size={64} className="text-brand-purple/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                      </div>
                      <div className="relative z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-purple text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-brand-purple/30">
                            <Clock size={12} /> შემდეგი ვიზიტი {diffMins < 60 ? `${diffMins} წუთში` : `${Math.floor(diffMins/60)} საათში`}
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-24 h-24 bg-surface-soft text-brand-purple rounded-[32px] flex items-center justify-center text-3xl font-black shadow-inner uppercase">
                                {initials}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-text-main tracking-tighter mb-2">{nextApp.patientName}</h2>
                                <div className="flex flex-wrap gap-4 text-text-muted">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-brand-purple rounded-full"></div>
                                      <span className="text-xs font-bold">{nextApp.service}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Clock size={14} className="text-text-muted" />
                                      <span className="text-xs font-bold">{startTime.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/patients/${nextApp.patientId}`)} className="px-6 py-3 bg-brand-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple transition-all shadow-lg shadow-brand-deep/20">პროფილის ნახვა</button>
                          </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Pending Closures Section */}
                {(role === 'admin' || role === 'manager' || role === 'accountant') && (
                  <div className="bg-surface rounded-[40px] p-8 border border-border-main shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-text-main italic uppercase tracking-tighter">ჩასახურავი შეკვეთები</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">ფინანსური მონიტორინგი</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 bg-surface-soft rounded-[32px] border border-transparent hover:border-amber-200 transition-all">
                        <p className="text-[10px] font-black text-text-muted uppercase mb-2">მოლოდინშია</p>
                        <p className="text-3xl font-black text-text-main italic">{pendingClosuresCount} ვიზიტი</p>
                      </div>
                      <div className="p-6 bg-surface-soft/50 rounded-[32px] border border-transparent flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] font-black text-text-muted uppercase mb-1">რეპორტი</p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">დეტალები</p>
                        </div>
                        <button onClick={() => navigate('/finance')} className="w-10 h-10 bg-surface rounded-xl shadow-sm flex items-center justify-center text-text-main hover:bg-brand-purple hover:text-white transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <AppointmentsList />
              </div>

              <div className="lg:col-span-4 space-y-8">
                <StatsGrid 
                  patientsGrowth={monthlyPatientsCount}
                  inventoryAlerts={lowStockItems.length}
                  monthlyIncome={monthlyIncome}
                  monthlyExpenses={monthlyExpenses}
                  role={role}
                />

                {(role === 'admin' || role === 'accountant') && (
                  <SalaryReminder staff={staff} paidStaffIds={paidStaffIds} />
                )}

                <RecentTreatments appointments={appointments} />

                {/* Inventory Low Stock Alert */}
                {(role === 'admin' || role === 'manager') && lowStockItems.length > 0 && (
                  <div className="bg-surface p-8 rounded-[40px] border border-border-dark/60 shadow-sm group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                        <PackageSearch size={24} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest leading-none mb-1">ინვენტარი</h4>
                        <p className="text-[9px] font-bold text-text-muted uppercase">დაბალი მარაგი</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {lowStockItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-amber-500/10/50 rounded-xl">
                          <span className="text-[10px] font-black text-text-main uppercase">{item.name}</span>
                          <span className="text-[10px] font-black text-amber-600 uppercase">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {lowStockItems.length > 3 && (
                        <button onClick={() => navigate('/inventory')} className="w-full text-center py-2 text-[9px] font-black uppercase text-amber-600 hover:underline">
                          ყველას ნახვა ({lowStockItems.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default Dashboard;