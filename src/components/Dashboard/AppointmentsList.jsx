import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Clock, Building2, Calendar as CalendarIcon, Search, Loader2, Archive, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AppointmentsList = () => {
  const { userData, role, activeStaff } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const isReceptionist = role === "receptionist";

  useEffect(() => {
    if (!userData?.clinicId) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    let q;
    if (role === "doctor") {
      // ვიყენებთ მხოლოდ doctorId-ს ინდექსების შეცდომის ასაცილებლად
      q = query(
        collection(db, "appointments"),
        where("doctorId", "==", activeStaff?.id || userData?.uid)
      );
    } else {
      q = query(
        collection(db, "appointments"),
        where("clinicId", "==", userData.clinicId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const todayDate = now.toISOString().split('T')[0];

      // ფილტრაცია კლიენტის მხარეს: კლინიკის ID (ექიმისთვის) და დღევანდელი თარიღი
      const todayData = allData.filter(app => {
        const isCorrectClinic = role === "doctor" ? app.clinicId === userData.clinicId : true;
        const appDate = app.start?.split('T')[0];
        return isCorrectClinic && appDate === todayDate;
      });

      setTodayAppointments(todayData);
      setLoading(false);
    }, (error) => {
      console.error("AppointmentsList listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const filteredAndSorted = useMemo(() => {
    const now = new Date();
    
    return todayAppointments
      .filter(app => 
        app.status !== "cancelled" && 
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const timeA = new Date(a.start);
        const timeB = new Date(b.start);
        const isFutureA = timeA > now;
        const isFutureB = timeB > now;

        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        if (isFutureA && isFutureB) return timeA - timeB;
        return timeB - timeA;
      });
  }, [todayAppointments, searchTerm]);

  const getTimeStatus = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMins = Math.round((start - now) / 60000);

    if (diffMins > 0) {
      return { text: diffMins < 60 ? `${diffMins} წთ-ში` : `${Math.floor(diffMins/60)}სთ-ში`, color: "bg-emerald-500" };
    } else {
      const passedMins = Math.abs(diffMins);
      return { text: passedMins < 60 ? "მიმდინარეობს" : "დასრულდა", color: "bg-slate-400" };
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-6 md:p-8 border border-slate-200/60 shadow-sm flex flex-col font-nino min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 shrink-0">
        <div>
          <h3 className="text-xl font-black text-brand-deep italic">დღევანდელი განრიგი</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {filteredAndSorted.length} ჩანიშნული ვიზიტი
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/calendar')} className="p-3 bg-slate-50 text-slate-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all border border-transparent hover:border-brand-purple/10">
            <CalendarDays size={20} />
          </button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
        {loading ? (
          <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
        ) : filteredAndSorted.length > 0 ? (
          <div className="space-y-0 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
            {filteredAndSorted.map((app, idx) => {
              const status = getTimeStatus(app.start);
              const isNext = new Date(app.start) > new Date() && (new Date(app.start) - new Date() < 1800000);
              const timeStr = new Date(app.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={app.id}
                  onClick={() => app.patientId && app.patientId !== 'external' && navigate(`/patients/${app.patientId}`)}
                  className="flex gap-3 md:gap-6 pb-6 md:pb-8 last:pb-0 group cursor-pointer relative"
                >
                  {/* Time & Dot */}
                  <div className="flex flex-col items-center shrink-0 w-14">
                    <div className={`w-14 h-10 md:h-12 rounded-xl flex items-center justify-center font-black text-[9px] md:text-[10px] z-10 transition-all whitespace-nowrap px-1 ${
                      isNext ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30 scale-105' : 'bg-white text-slate-400 border-2 border-slate-100'
                    }`}>
                      {timeStr}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 p-3 md:p-4 rounded-2xl border-2 transition-all min-w-0 ${
                    isNext ? 'border-brand-purple/10 bg-brand-purple/5' : 'border-transparent bg-slate-50/50 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <p className="text-[13px] md:text-sm font-black text-brand-deep truncate group-hover:text-brand-purple transition-colors shrink-0 max-w-[60%] md:max-w-none">
                             {app.patientName}
                           </p>
                           {(role === "admin" || role === "receptionist") && app.doctorName && (
                             <span className="text-[8px] md:text-[9px] font-black px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-md uppercase tracking-tighter whitespace-nowrap truncate">
                               {app.doctorName}
                             </span>
                           )}
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{app.service}</p>
                      </div>
                      <span className={`px-2 py-1 ${status.color} text-white rounded-full text-[7px] md:text-[8px] font-black uppercase shrink-0`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
              <CalendarIcon size={48} />
              <p className="font-black text-[10px] uppercase mt-4 tracking-widest text-center">განრიგი ცარიელია</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;