import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  Activity, MapPin, Phone, Clock, 
  Star, ShieldCheck, 
  Globe, MessageSquare, Loader2,
  Stethoscope, Info, Users
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
          const pKey = planId === "solo" ? "basic" : planId;
          const pFeatures = PLANS[pKey]?.portfolioFeatures || PLANS.free.portfolioFeatures;

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
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="animate-spin text-brand-purple" size={48} />
    </div>
  );

  if (!clinic || clinic.isPrivate) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface font-nino p-6 text-center">
       <div className="w-20 h-20 bg-surface-soft rounded-3xl flex items-center justify-center text-text-muted mb-6">
          <Activity size={40} />
       </div>
       <h1 className="text-2xl font-black text-text-main mb-2 italic">კლინიკა ვერ მოიძებნა</h1>
       <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-8">გვერდი ან არ არსებობს, ან მფლობელის მიერ არის დამალული</p>
       <Link to="/catalog" className="px-8 py-4 bg-brand-deep text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple transition-all shadow-xl">კატალოგში დაბრუნება</Link>
    </div>
  );

  const planId = (clinic.plan || "free").toLowerCase();
  const pKey = planId === "solo" ? "basic" : planId;
  const features = PLANS[pKey]?.portfolioFeatures || PLANS.free.portfolioFeatures;

  return (
    <>
      <Helmet>
        <title>{clinic?.clinicName || "კლინიკა"} — DentalHub</title>
      </Helmet>
      <div className="min-h-screen bg-surface-soft font-nino selection:bg-brand-purple/10 pb-20">
      <MainHeader user={currentUser} />

      <main className="pt-12 px-6">
        <div className="max-w-7xl mx-auto">
           {/* Hero Section */}
           <div className="bg-gradient-to-br from-brand-deep via-brand-deep to-brand-purple rounded-[48px] p-8 md:p-20 shadow-2xl shadow-brand-purple/20 flex flex-col md:flex-row gap-12 items-center mb-12 relative overflow-hidden group">
              {/* Background Ornaments */}
              <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

              <div className="w-48 h-48 md:w-72 md:h-72 bg-surface/10 backdrop-blur-xl rounded-[56px] border-4 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden shrink-0 relative z-10 group-hover:scale-105 transition-transform duration-700">
                 {clinic.logoUrl ? (
                    <img src={clinic.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                 ) : (
                    <div className="text-white/20"><Activity size={100} /></div>
                 )}
              </div>
              <div className="flex-1 text-center md:text-left relative z-10">
                 <div className="inline-flex items-center gap-2 px-5 py-2 bg-surface/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10">
                   <ShieldCheck size={16} className="text-emerald-400" /> ვერიფიცირებული კლინიკა
                 </div>
                 <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter italic mb-8 leading-[0.9] drop-shadow-2xl">
                    {clinic.clinicName}
                 </h1>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-8">
                    {features.canShowPhone && clinic.phone && (
                      <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                        <div className="w-10 h-10 bg-surface/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-purple border border-white/10 shadow-lg"><Phone size={16} /></div>
                        <span className="font-black text-sm tracking-widest">{clinic.phone}</span>
                      </div>
                    )}
                    {clinic.city && (
                      <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                        <div className="w-10 h-10 bg-surface/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-purple border border-white/10 shadow-lg"><MapPin size={16} /></div>
                        <span className="font-black text-sm tracking-widest">{clinic.city}</span>
                      </div>
                    )}
                    {features.canShowHours && clinic.workingHours && (
                      <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                        <div className="w-10 h-10 bg-surface/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-purple border border-white/10 shadow-lg"><Clock size={16} /></div>
                        <span className="font-black text-sm tracking-widest">{clinic.workingHours}</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* About & Features */}
              <div className="lg:col-span-8 space-y-8">
                 {features.canShowAbout && clinic.description && (
                    <div className="bg-surface rounded-[40px] p-12 border border-border-main shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                       <h3 className="text-3xl font-black text-text-main italic tracking-tighter mb-8 flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple"><Info size={24} /></div> 
                          კლინიკის შესახებ
                       </h3>
                       <p className="text-text-muted font-medium leading-relaxed italic text-xl">
                          {clinic.description}
                       </p>
                    </div>
                 )}

                 {features.canShowSpecialties && clinic.specialties?.length > 0 && (
                    <div className="bg-surface rounded-[40px] p-12 border border-border-main shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                       <h3 className="text-3xl font-black text-text-main italic tracking-tighter mb-10">მიმართულებები</h3>
                       <div className="flex flex-wrap gap-4">
                          {clinic.specialties.map((s, i) => (
                             <span key={i} className="px-6 py-4 bg-surface-soft text-text-main rounded-[24px] text-[12px] font-black uppercase tracking-widest border border-border-main hover:border-brand-purple/30 hover:bg-surface hover:shadow-xl hover:scale-105 transition-all cursor-default">
                                {s}
                             </span>
                          ))}
                       </div>
                    </div>
                 )}

                 {features.canShowServices && services.length > 0 && (
                    <div className="bg-surface rounded-[40px] p-12 border border-border-main shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                       <div className="flex items-center justify-between mb-10">
                          <h3 className="text-3xl font-black text-text-main italic tracking-tighter">მომსახურებები</h3>
                          <div className="px-6 py-2 bg-brand-purple/10 text-brand-purple rounded-full font-black text-[10px] uppercase tracking-widest">{services.length} დასახელება</div>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          {services.map((s, i) => (
                             <div key={i} className="flex items-center gap-4 px-6 py-4 bg-surface-soft rounded-[28px] border border-transparent hover:border-brand-purple/20 hover:bg-surface hover:shadow-xl hover:scale-105 transition-all group cursor-default">
                                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-brand-purple shadow-sm group-hover:bg-brand-purple group-hover:text-white transition-all duration-500">
                                   <Stethoscope size={18} />
                                </div>
                                <span className="font-black text-text-main text-sm tracking-tight">{s.name}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-8">
                 {features.canShowDoctors && doctors.length > 0 && (
                    <div className="bg-surface rounded-[40px] p-10 border border-border-main shadow-xl animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
                       <h3 className="text-2xl font-black text-text-main italic tracking-tighter mb-10 flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple"><Users size={24} /></div>
                          ჩვენი გუნდი
                       </h3>
                       <div className="space-y-6">
                          {doctors.map((d, i) => (
                             <div key={i} className="flex items-center gap-5 p-5 bg-surface-soft rounded-[28px] hover:bg-surface hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border border-transparent hover:border-border-main group">
                                <div className="w-16 h-16 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-brand-purple group-hover:text-white transition-all duration-500 shadow-inner">
                                   {d.fullName ? d.fullName[0] : "?"}
                                </div>
                                <div>
                                   <p className="font-black text-text-main text-lg leading-tight">{d.fullName}</p>
                                   <p className="text-[11px] text-text-muted font-black uppercase tracking-widest mt-1.5">{d.role}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {features.canShowMap && clinic.mapUrl && (
                    <div className="bg-surface rounded-[40px] p-10 border border-border-main shadow-xl animate-in fade-in slide-in-from-right-8 duration-700 delay-400 overflow-hidden group">
                       <h3 className="text-2xl font-black text-text-main italic tracking-tighter mb-8 flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple"><MapPin size={24} /></div>
                          მდებარეობა
                       </h3>
                       <div className="rounded-[32px] overflow-hidden border-4 border-border-main h-80 grayscale group-hover:grayscale-0 transition-all duration-1000 shadow-inner">
                          <iframe 
                             src={clinic.mapUrl} 
                             width="100%" 
                             height="100%" 
                             style={{ border: 0 }} 
                             allowFullScreen="" 
                             loading="lazy"
                          ></iframe>
                       </div>
                       <div className="mt-6 flex items-center gap-3 text-text-muted px-2 bg-surface-soft p-4 rounded-2xl">
                          <MapPin size={16} className="text-brand-purple" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{clinic.address}</span>
                       </div>
                    </div>
                 )}

                 <div className="bg-gradient-to-br from-brand-deep to-brand-purple rounded-[48px] p-12 text-white relative overflow-hidden group shadow-2xl shadow-brand-deep/30 animate-in fade-in slide-in-from-right-8 duration-700 delay-500">
                    <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-surface/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-brand-purple/20 rounded-full blur-2xl" />
                    
                    <h3 className="text-3xl font-black italic tracking-tighter mb-6 relative z-10 leading-none">მოგვწერეთ ან <br />დაგვირეკეთ</h3>
                    <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-10 relative z-10 leading-relaxed">
                       სპეციალისტთან კონსულტაციაზე ჩასაწერად დაუკავშირდით კლინიკას.
                    </p>
                    <div className="space-y-4 relative z-10">
                        <a href={`tel:${clinic.phone}`} className="flex items-center justify-center gap-4 w-full py-6 bg-surface text-text-main rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95 duration-300">
                          <Phone size={20} /> {clinic.phone || "დარეკვა"}
                        </a>
                        {clinic.email && (
                            <a href={`mailto:${clinic.email}`} className="flex items-center justify-center gap-4 w-full py-5 bg-surface/10 text-white border border-white/20 backdrop-blur-md rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-surface/20 transition-all duration-300">
                                <MessageSquare size={20} /> ელ-ფოსტა
                            </a>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default ClinicPublicProfile;
