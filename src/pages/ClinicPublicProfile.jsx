import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  Activity, MapPin, Phone, Clock, 
  Star, ShieldCheck, 
  Globe, MessageSquare, Loader2,
  Stethoscope, Info
} from "lucide-react";
import { PLANS } from "../config/plans";
import { useAuth } from "../context/AuthContext";
import MainHeader from "../components/Common/MainHeader";

const ClinicPublicProfile = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [doctors, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clinicDoc = await getDoc(doc(db, "clinics", id));
        if (clinicDoc.exists()) {
          const data = clinicDoc.data();
          if (!data.isPublic) {
            setLoading(false);
            setClinic({ isPrivate: true });
            return;
          }
          setClinic({ id: clinicDoc.id, ...data });
          
          const planId = (data.plan || "free").toLowerCase();
          const pFeatures = PLANS[planId]?.portfolioFeatures || PLANS.free.portfolioFeatures;

          if (pFeatures.canShowDoctors) {
            const qDoctors = query(collection(db, "users"), where("clinicId", "==", id), where("role", "==", "doctor"));
            const dSnap = await getDocs(qDoctors);
            setStaff(dSnap.docs.map(d => d.data()));
          }

          if (pFeatures.canShowServices) {
            const qServices = query(collection(db, "services"), where("clinicId", "==", id));
            const sSnap = await getDocs(qServices);
            setServices(sSnap.docs.map(s => s.data()));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-brand-purple" size={48} />
    </div>
  );

  if (!clinic || clinic.isPrivate) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-nino p-6 text-center">
       <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
          <Activity size={40} />
       </div>
       <h1 className="text-2xl font-black text-brand-deep mb-2 italic">კლინიკა ვერ მოიძებნა</h1>
       <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">გვერდი ან არ არსებობს, ან მფლობელის მიერ არის დამალული</p>
       <Link to="/catalog" className="px-8 py-4 bg-brand-deep text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple transition-all shadow-xl">კატალოგში დაბრუნება</Link>
    </div>
  );

  const planId = (clinic.plan || "free").toLowerCase();
  const features = PLANS[planId]?.portfolioFeatures || PLANS.free.portfolioFeatures;

  return (
    <div className="min-h-screen bg-slate-50 font-nino selection:bg-brand-purple/10 pb-20">
      <MainHeader user={currentUser} />

      <main className="pt-12 px-6">
        <div className="max-w-7xl mx-auto">
           {/* Hero Section */}
           <div className="bg-white rounded-[48px] p-8 md:p-16 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-12 items-center mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                 <Activity size={200} />
              </div>

              <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-50 rounded-[40px] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden shrink-0 relative z-10">
                 {clinic.logoUrl ? (
                    <img src={clinic.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                 ) : (
                    <div className="text-brand-purple/10"><Activity size={80} /></div>
                 )}
              </div>
              <div className="flex-1 text-center md:text-left relative z-10">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/5 text-brand-purple rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-purple/10">
                   <ShieldCheck size={14} /> ვერიფიცირებული კლინიკა
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black text-brand-deep tracking-tighter italic mb-6 leading-tight">
                    {clinic.clinicName}
                 </h1>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    {features.canShowPhone && clinic.phone && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-brand-purple"><Phone size={14} /></div>
                        <span className="font-bold text-sm">{clinic.phone}</span>
                      </div>
                    )}
                    {clinic.city && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-brand-purple"><MapPin size={14} /></div>
                        <span className="font-bold text-sm">{clinic.city}</span>
                      </div>
                    )}
                    {features.canShowHours && clinic.workingHours && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-brand-purple"><Clock size={14} /></div>
                        <span className="font-bold text-sm">{clinic.workingHours}</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* About & Features */}
              <div className="lg:col-span-8 space-y-8">
                 {features.canShowAbout && clinic.description && (
                    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <h3 className="text-2xl font-black text-brand-deep italic tracking-tighter mb-6 flex items-center gap-3">
                          <Info className="text-brand-purple" size={24} /> კლინიკის შესახებ
                       </h3>
                       <p className="text-slate-500 font-medium leading-relaxed italic text-lg">
                          {clinic.description}
                       </p>
                    </div>
                 )}

                 {features.canShowSpecialties && clinic.specialties?.length > 0 && (
                    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                       <h3 className="text-2xl font-black text-brand-deep italic tracking-tighter mb-8">მიმართულებები</h3>
                       <div className="flex flex-wrap gap-3">
                          {clinic.specialties.map((s, i) => (
                             <span key={i} className="px-5 py-3 bg-slate-50 text-brand-deep rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-100 hover:border-brand-purple/20 transition-all cursor-default">
                                {s}
                             </span>
                          ))}
                       </div>
                    </div>
                 )}

                 {features.canShowServices && services.length > 0 && (
                    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-black text-brand-deep italic tracking-tighter">მომსახურება და ფასები</h3>
                          <div className="w-10 h-10 bg-brand-purple/5 text-brand-purple rounded-xl flex items-center justify-center font-black text-xs">{services.length}</div>
                       </div>
                       <div className="space-y-4">
                          {services.map((s, i) => (
                             <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[28px] border border-transparent hover:border-brand-purple/10 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-purple shadow-sm group-hover:bg-brand-purple group-hover:text-white transition-all"><Stethoscope size={18} /></div>
                                   <span className="font-black text-brand-deep tracking-tight">{s.name}</span>
                                </div>
                                <span className="text-xl font-black text-brand-purple italic">{s.price} ₾</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-8">
                 {features.canShowDoctors && doctors.length > 0 && (
                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                       <h3 className="text-xl font-black text-brand-deep italic tracking-tighter mb-8">ჩვენი გუნდი</h3>
                       <div className="space-y-6">
                          {doctors.map((d, i) => (
                             <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group">
                                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center font-black text-lg group-hover:bg-brand-purple group-hover:text-white transition-all">
                                   {d.fullName ? d.fullName[0] : "?"}
                                </div>
                                <div>
                                   <p className="font-black text-brand-deep text-sm leading-tight">{d.fullName}</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{d.role}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {features.canShowMap && clinic.mapUrl && (
                   <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm overflow-hidden group">
                      <h3 className="text-xl font-black text-brand-deep italic tracking-tighter mb-8">მდებარეობა</h3>
                      <div className="rounded-3xl overflow-hidden border border-slate-100 h-64 grayscale group-hover:grayscale-0 transition-all duration-1000">
                         <iframe 
                            src={clinic.mapUrl} 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy"
                         ></iframe>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-slate-400 px-2">
                         <MapPin size={12} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">{clinic.address}</span>
                      </div>
                   </div>
                 )}

                 <div className="bg-brand-deep rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-brand-deep/20">
                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                    <h3 className="text-2xl font-black italic tracking-tighter mb-4 relative z-10 leading-tight">მოგვწერეთ ან <br />დაგვირეკეთ</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 relative z-10 leading-relaxed">
                       სპეციალისტთან კონსულტაციაზე ჩასაწერად დაუკავშირდით კლინიკას.
                    </p>
                    <div className="space-y-3 relative z-10">
                        <a href={`tel:${clinic.phone}`} className="flex items-center justify-center gap-3 w-full py-5 bg-white text-brand-deep rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-xl">
                        <Phone size={18} /> {clinic.phone || "დარეკვა"}
                        </a>
                        {clinic.email && (
                            <a href={`mailto:${clinic.email}`} className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 text-white border border-white/10 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                                <MessageSquare size={16} /> ელ-ფოსტა
                            </a>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default ClinicPublicProfile;
