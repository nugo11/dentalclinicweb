import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Users, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';

const StatsGrid = () => {
  const { userData, role } = useAuth();
  const [stats, setStats] = useState({
    patientCount: 0,
    todayVisits: 0,
    revenue: 0
  });

  const isStaff = role === "receptionist" || role === "doctor";

  useEffect(() => {
    if (!userData?.clinicId) return;

    // პაციენტების საერთო რაოდენობის დათვლა რეალურ დროში
    const qPatients = query(collection(db, "patients"), where("clinicId", "==", userData.clinicId));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      setStats(prev => ({ ...prev, patientCount: snapshot.size }));
    });

    // აქ სამომავლოდ დაემატება დღევანდელი ვიზიტების და ფინანსების დათვლა
    return () => unsubPatients();
  }, [userData]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {!isStaff && (
        <StatCard 
          title="დღევანდელი შემოსავალი" 
          value={`₾ ${stats.revenue}`} 
          icon={DollarSign} 
          color="bg-brand-purple" 
          trend="+12%" 
        />
      )}
      <StatCard 
        title="აქტიური პაციენტები" 
        value={stats.patientCount} 
        icon={Users} 
        color="bg-blue-500" 
        trend="+4" 
      />
      <StatCard 
        title="კლინიკის დატვირთვა" 
        value="85%" 
        icon={Calendar} 
        color="bg-amber-500" 
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-5 rounded-[28px] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-500 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-black text-brand-deep italic tracking-tighter">{value}</p>
          {trend && (
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg">
              {trend}
            </span>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
         <ArrowUpRight size={14} className="text-slate-300" />
      </div>
    </div>
  </div>
);

export default StatsGrid;