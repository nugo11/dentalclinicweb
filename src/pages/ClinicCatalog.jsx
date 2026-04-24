import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  Search, 
  MapPin, 
  Phone, 
  Loader2, 
  Stethoscope, 
  Star,
  Globe,
  ArrowRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainHeader from "../components/Common/MainHeader";

const ClinicCatalog = () => {
  const { currentUser } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const q = query(collection(db, "clinics"), where("isPublic", "==", true));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const getPlanPriority = (doc) => {
          const plan = (doc.plan || "free").toLowerCase();
          const priorities = { 'pro': 3, 'basic': 1, 'solo': 1, 'free': 0 };
          return priorities[plan] || 0;
        };

        docs.sort((a, b) => getPlanPriority(b) - getPlanPriority(a));
        setClinics(docs);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const filteredClinics = clinics.filter(c => 
    (c.clinicName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>კლინიკების კატალოგი — DentalHub</title>
      </Helmet>
      <div className="min-h-screen bg-surface-soft font-nino transition-colors duration-300">
      <MainHeader user={currentUser} />

      {/* Hero Search */}
      <div className="bg-brand-deep py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-purple rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-6 leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            იპოვეთ თქვენთვის <span className="text-brand-purple">საუკეთესო</span> კლინიკა
          </h1>
          <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12 opacity-80">
            საქართველოს წამყვანი სტომატოლოგიური კლინიკების კატალოგი
          </p>

          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="მოძებნეთ კლინიკა, ქალაქი ან მისამართი..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border-2 border-white/5 focus:border-brand-purple/50 focus:bg-white/15 rounded-[32px] pl-16 pr-8 py-6 text-white outline-none font-bold text-lg backdrop-blur-xl transition-all shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-brand-purple mb-4" size={48} />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">იტვირთება კატალოგი...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClinics.map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        )}

        {!loading && filteredClinics.length === 0 && (
          <div className="text-center py-40 animate-in fade-in duration-500">
             <div className="w-24 h-24 bg-surface rounded-[32px] shadow-sm flex items-center justify-center text-text-muted mx-auto mb-6 border border-border-main">
                <Search size={40} />
             </div>
             <h3 className="text-2xl font-black text-text-main italic">კლინიკა ვერ მოიძებნა</h3>
             <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-2">სცადეთ სხვა საძიებო სიტყვა</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

const ClinicCard = ({ clinic }) => {
  const planKey = (clinic.plan || "free").toLowerCase();
  const isVip = planKey === 'pro';
  const isBasic = planKey === 'basic' || planKey === 'solo';

  return (
  <Link to={`/catalog/${clinic.id}`} className="block group h-full">
    <div className={`bg-surface rounded-[40px] p-8 border-2 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 flex flex-col h-full relative overflow-hidden ${isVip ? 'border-brand-purple/20 shadow-xl shadow-brand-purple/5' : isBasic ? 'border-brand-purple/5' : 'border-border-main/50'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Activity size={100} />
        </div>

        <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-20 h-20 bg-surface-soft rounded-[24px] border-2 border-border-main shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                {clinic.logoUrl ? (
                <img src={clinic.logoUrl} alt={clinic.clinicName} className="w-full h-full object-cover" />
                ) : (
                <div className="text-brand-purple/20"><Stethoscope size={32} /></div>
                )}
            </div>
            {isVip && (
                <div className="px-4 py-1.5 bg-brand-purple text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-brand-purple/20">
                <Star size={10} fill="currentColor" /> VIP
                </div>
            )}
        </div>

        <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-black text-text-main italic tracking-tighter mb-2 group-hover:text-brand-purple transition-colors">
            {clinic.clinicName}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
                <MapPin size={12} className="text-brand-purple" />
                {clinic.city || "თბილისი"}{clinic.address ? `, ${clinic.address}` : ''}
            </div>
            <p className="text-text-muted font-medium leading-relaxed italic line-clamp-4 text-sm">
            {clinic.description || "ამ კლინიკას ჯერ არ დაუმატებია აღწერა."}
            </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border-main flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest group-hover:gap-4 transition-all">
                გვერდის ნახვა <ArrowRight size={14} className="text-brand-purple" />
            </div>
            {clinic.phone && (
                <div className="flex items-center gap-1.5 text-text-muted">
                    <Phone size={12} />
                    <span className="text-[10px] font-bold">{clinic.phone}</span>
                </div>
            )}
        </div>
    </div>
  </Link>
  );
};

export default ClinicCatalog;
