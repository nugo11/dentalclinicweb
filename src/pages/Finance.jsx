import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Download,
  Tag,
  PieChart,
  Wallet,
} from "lucide-react";
import ServiceSettingsSlideOver from "../components/Finance/ServiceSettingsSlideOver";
import { generateInvoice } from "../utils/generateInvoice";

const Finance = () => {
  const { userData, clinicData: dbClinicData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // ფინანსური სტატისტიკის State
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    vat: 0,
    expenses: 0,
    netProfit: 0
  });

  // კლინიკის მონაცემები ინვოისისთვის
  const clinicInfo = {
    name: dbClinicData?.clinicName || "DentalHub Clinic",
    address: dbClinicData?.address || "თბილისი, საქართველო",
    phone: dbClinicData?.phone || userData?.phone || "+995 555 00 00 00",
    tin: dbClinicData?.tin || "123456789",
  };

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", userData.clinicId),
      where("status", "==", "completed_and_billed"),
    );

    return onSnapshot(q, (snapshot) => {
      let total = 0,
          paid = 0,
          expenses = 0;

      const data = snapshot.docs.map((doc) => {
        const item = doc.data();
        const price = Number(item.price || 0);
        const amountPaid = Number(item.paidAmount || 0);
        const materialCost = Number(item.materialCost || 0); // საწყობის ხარჯი

        total += price;
        paid += amountPaid;
        expenses += materialCost;

        return { id: doc.id, ...item, price, amountPaid, materialCost };
      });

      setTransactions(data.sort((a, b) => new Date(b.finalizedAt) - new Date(a.finalizedAt)));
      
      setStats({
        total,
        paid,
        vat: total * 0.18,
        expenses,
        netProfit: paid - expenses
      });
    });
  }, [userData]);

  return (
    <>
      <Helmet>
        <title>ფინანსები — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            
            {/* Header Section */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">
                  ფინანსური მიმოხილვა
                </h1>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
                  შემოსავლების, ხარჯების და მოგების ანალიტიკა
                </p>
              </div>

            
            </div>

            {/* Stats Grid - 4 Cards for better insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="მთლიანი დარიცხვა"
                amount={stats.total}
                icon={DollarSign}
                color="text-brand-purple"
                bg="bg-brand-purple/5"
              />
              <StatCard
                title="მასალების ხარჯი"
                amount={stats.expenses}
                icon={PieChart}
                color="text-orange-500"
                bg="bg-orange-500/10"
              />
              <StatCard
                title="დღგ (18%)"
                amount={stats.vat}
                icon={Tag}
                color="text-amber-500"
                bg="bg-amber-500/10"
              />
              <StatCard
                title="წმინდა მოგება"
                amount={stats.netProfit}
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                highlight={true}
              />
            </div>

            {/* Transactions Table */}
            <div className="bg-surface rounded-[40px] border border-border-main shadow-sm overflow-hidden">
              <div className="p-8 border-b border-border-main flex justify-between items-center">
                <h3 className="text-xl font-black text-text-main italic">
                  ბოლო ტრანზაქციები
                </h3>
                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-surface-soft rounded-xl text-[10px] font-black uppercase text-text-muted tracking-widest border border-border-main italic">
                        სულ: {transactions.length} ვიზიტი
                    </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft/50">
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">პაციენტი / მომსახურება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">თარიღი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">ფასი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">ხარჯი</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">დღგ (18%)</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">გადახდილი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest text-right">ინვოისი</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-main">
                    {transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-surface-soft/50 transition-colors">
                        <td className="p-6">
                          <h5 className="font-bold text-text-main">{t.patientName}</h5>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter truncate max-w-[200px]">
                            {t.billedServices?.map((s) => s.name).join(", ") || "მომსახურება"}
                          </p>
                        </td>
                        <td className="p-6 text-sm font-medium text-text-muted italic">
                          {t.finalizedAt ? new Date(t.finalizedAt).toLocaleDateString("ka-GE") : "—"}
                        </td>
                        <td className="p-6 font-bold text-text-main">{t.price} ₾</td>
                        <td className="p-6">
                           <span className="text-[11px] font-bold text-orange-400">-{t.materialCost || 0} ₾</span>
                        </td>
                        <td className="px-8 py-6">
                            <span className="text-xs font-bold text-amber-600">
                              ₾ {(t.vatAmount || (t.price * 0.18)).toFixed(2)}
                            </span>
                        </td>
                        <td className="p-6">
                          <span className="font-black text-emerald-500">+{t.amountPaid} ₾</span>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => generateInvoice(t, dbClinicData)}
                            className="p-3 text-text-muted hover:text-brand-purple hover:bg-surface rounded-xl transition-all shadow-sm border border-transparent hover:border-border-main cursor-pointer active:scale-90"
                          >
                            <Download size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <ServiceSettingsSlideOver
            isOpen={isServiceModalOpen}
            onClose={() => setIsServiceModalOpen(false)}
          />
        </main>
      </div>
    </div>
    </>
  );
};

const StatCard = ({ title, amount, icon: Icon, color, bg, highlight }) => (
  <div className={`bg-surface p-8 rounded-[32px] border ${highlight ? 'border-emerald-500/20 shadow-emerald-500/5' : 'border-border-main'} shadow-sm flex items-center gap-6`}>
    <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <p className={`text-2xl font-black italic ${highlight ? 'text-emerald-600' : 'text-text-main'}`}>
        {Number(amount).toLocaleString()} ₾
      </p>
    </div>
  </div>
);

export default Finance;