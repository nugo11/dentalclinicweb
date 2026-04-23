import React, { useState, useEffect } from "react";
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
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            
            {/* Header Section */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-brand-deep italic tracking-tighter">
                  ფინანსური მიმოხილვა
                </h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
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
                bg="bg-orange-50"
              />
              <StatCard
                title="დღგ (18%)"
                amount={stats.vat}
                icon={Tag}
                color="text-amber-500"
                bg="bg-amber-50"
              />
              <StatCard
                title="წმინდა მოგება"
                amount={stats.netProfit}
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-50"
                highlight={true}
              />
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-brand-deep italic">
                  ბოლო ტრანზაქციები
                </h3>
                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-widest border border-gray-100 italic">
                        სულ: {transactions.length} ვიზიტი
                    </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">პაციენტი / მომსახურება</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">თარიღი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">ფასი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">ხარჯი</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">დღგ (18%)</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">გადახდილი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">ინვოისი</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <h5 className="font-bold text-slate-800">{t.patientName}</h5>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter truncate max-w-[200px]">
                            {t.billedServices?.map((s) => s.name).join(", ") || "მომსახურება"}
                          </p>
                        </td>
                        <td className="p-6 text-sm font-medium text-gray-500 italic">
                          {t.finalizedAt ? new Date(t.finalizedAt).toLocaleDateString("ka-GE") : "—"}
                        </td>
                        <td className="p-6 font-bold text-slate-700">{t.price} ₾</td>
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
                            className="p-3 text-gray-400 hover:text-brand-purple hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 cursor-pointer active:scale-90"
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
  );
};

const StatCard = ({ title, amount, icon: Icon, color, bg, highlight }) => (
  <div className={`bg-white p-8 rounded-[32px] border ${highlight ? 'border-emerald-100 shadow-emerald-500/5' : 'border-gray-100'} shadow-sm flex items-center gap-6`}>
    <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
        {title}
      </p>
      <p className={`text-2xl font-black italic ${highlight ? 'text-emerald-600' : 'text-brand-deep'}`}>
        {Number(amount).toLocaleString()} ₾
      </p>
    </div>
  </div>
);

export default Finance;