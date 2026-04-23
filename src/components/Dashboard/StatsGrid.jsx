import React from 'react';
import { Users, Package, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsGrid = ({ patientsGrowth = 0, inventoryAlerts = 0, monthlyIncome = 0, monthlyExpenses = 0, role }) => {
  const isFinanceRole = role === 'admin' || role === 'accountant';

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-5">
      {isFinanceRole && (
        <>
          <StatCard 
            title="თვიური შემოსავალი" 
            value={`₾${monthlyIncome.toLocaleString()}`} 
            desc="ჯამური შემოსავალი"
            icon={TrendingUp} 
            iconColor="text-emerald-500"
            bgColor="bg-emerald-500/10"
            trend="+12%" 
            trendColor="text-emerald-500"
          />
          
          <StatCard 
            title="თვიური ხარჯი" 
            value={`₾${monthlyExpenses.toLocaleString()}`} 
            desc="ჯამური ხარჯი"
            icon={Wallet} 
            iconColor="text-red-500"
            bgColor="bg-red-500/10"
            trend="მიმდინარე"
            trendColor="text-red-500"
          />
        </>
      )}

      <StatCard 
        title="ინვენტარის განგაში" 
        value={inventoryAlerts} 
        desc="შესავსები ნივთები"
        icon={Package} 
        iconColor="text-amber-500"
        bgColor="bg-amber-500/10"
        trend={inventoryAlerts > 0 ? "ყურადღება" : "წესრიგშია"}
        isAlert={inventoryAlerts > 0}
      />

      <StatCard 
        title="თვიური ზრდა" 
        value={`+${patientsGrowth}`} 
        desc="ახალი პაციენტი"
        icon={Users} 
        iconColor="text-blue-500"
        bgColor="bg-blue-500/10"
        trend="ამ თვეში" 
      />
    </div>
  );
};

const StatCard = ({ title, value, desc, icon: Icon, iconColor, bgColor, trend, trendColor, isAlert }) => (
  <div className={`bg-white p-5 rounded-[28px] border ${isAlert ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/60'} shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-3 rounded-2xl ${bgColor} ${iconColor} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-black text-brand-deep italic tracking-tighter">{value}</p>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{desc}</span>
        </div>
      </div>
      {trend && (
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${isAlert ? 'bg-amber-500 text-white' : trendColor || 'bg-slate-50 text-slate-400'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default StatsGrid;