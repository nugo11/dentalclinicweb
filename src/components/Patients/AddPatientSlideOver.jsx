import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  X, User, Phone, Mail, Calendar, FileText, Activity, 
  HeartPulse, ShieldAlert, BadgeInfo, Loader2, UserPlus
} from 'lucide-react';
import { transliterateToGeorgian } from '../../utils/transliterateKa';
import FormInput from '../Common/FormInput';

const AddPatientSlideOver = ({ isOpen, onClose, currentCount }) => {
  const { clinicData, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    personalId: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'not_specified',
    bloodGroup: '',
    allergies: '',
    chronicDiseases: '',
    importantNote: ''
  });
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ვალიდაცია
    const errors = {};
    if (!formData.fullName) errors.fullName = true;
    if (!formData.phone) errors.phone = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTimeout(() => setFormErrors({}), 1000);
      return;
    }

    // პლანის შემოწმება ჩაწერამდე
    if (clinicData?.plan === "free" && currentCount >= 50) {
      alert("თქვენ ამოწურეთ უფასო პაკეტის ლიმიტი (50 პაციენტი).");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("ავტორიზაცია საჭიროა");
      const clinicId = userData?.clinicId || user.uid;

      await addDoc(collection(db, "patients"), {
        ...formData,
        clinicId,
        createdAt: serverTimestamp(),
        lastVisit: null,
        appointmentCount: 0,
        status: 'active'
      });

      onClose();
      setFormData({ 
        fullName: '', personalId: '', phone: '', email: '', 
        birthDate: '', gender: 'not_specified', bloodGroup: '', 
        allergies: '', chronicDiseases: '', importantNote: '' 
      });
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("პაციენტის დამატება ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand-purple rounded-2xl outline-none font-bold text-sm text-brand-deep transition-all";
  const labelStyle = "text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block";

  return (
    <>
      <div className="app-overlay fixed inset-0 bg-brand-deep/30 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="app-sheet fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-500 font-nino">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-purple text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-deep italic tracking-tighter">პაციენტის რეგისტრაცია</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                სამედიცინო ბარათი #HUB-{Math.floor(Math.random() * 9000) + 1000}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-10">
            
            {/* სექცია 1: პირადი ინფორმაცია */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-brand-purple pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-deep">პირადი მონაცემები</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <FormInput 
                  label="სრული სახელი და გვარი" 
                  required 
                  icon={User} 
                  placeholder="მაგ: გიორგი მაისურაძე"
                  value={formData.fullName}
                  error={formErrors.fullName}
                  onChange={val => setFormData({...formData, fullName: transliterateToGeorgian(val)})}
                />

                <div className="grid grid-cols-2 gap-5">
                  <FormInput 
                    label="პირადი ნომერი (11 ნიშნა)" 
                    icon={BadgeInfo} 
                    maxLength={11} 
                    placeholder="010XXXXXXXX"
                    value={formData.personalId}
                    onChange={val => setFormData({...formData, personalId: val})}
                  />
                  <FormInput 
                    type="date"
                    label="დაბადების თარიღი" 
                    icon={Calendar} 
                    value={formData.birthDate}
                    onChange={val => setFormData({...formData, birthDate: val})}
                  />
                </div>
              </div>
            </div>

            {/* სექცია 2: კონტაქტი */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-deep">საკონტაქტო ინფორმაცია</h3>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FormInput 
                  label="ტელეფონი" 
                  required 
                  icon={Phone} 
                  placeholder="599 XX XX XX"
                  value={formData.phone}
                  error={formErrors.phone}
                  onChange={val => setFormData({...formData, phone: val})}
                />
                <FormInput 
                  label="ელ-ფოსტა" 
                  icon={Mail} 
                  type="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={val => setFormData({...formData, email: val})}
                />
              </div>
            </div>

            {/* სექცია 3: სამედიცინო ანამნეზი */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-[32px] border border-gray-100">
              <div className="flex items-center gap-2 border-l-4 border-red-500 pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-deep">სამედიცინო ანამნეზი</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <FormInput 
                  type="select"
                  label="სისხლის ჯგუფი" 
                  icon={HeartPulse} 
                  value={formData.bloodGroup}
                  onChange={val => setFormData({...formData, bloodGroup: val})}
                >
                  <option value="">შეარჩიეთ</option>
                  <option value="A+">A+</option> <option value="A-">A-</option>
                  <option value="B+">B+</option> <option value="B-">B-</option>
                  <option value="O+">O+</option> <option value="O-">O-</option>
                  <option value="AB+">AB+</option> <option value="AB-">AB-</option>
                </FormInput>
                <FormInput 
                  type="select"
                  label="სქესი" 
                  icon={Activity} 
                  value={formData.gender}
                  onChange={val => setFormData({...formData, gender: val})}
                >
                  <option value="not_specified">არჩეული არ არის</option>
                  <option value="male">მამრობითი</option>
                  <option value="female">მდედრობითი</option>
                </FormInput>
              </div>

              <FormInput 
                label="ალერგიები (წითელი ზონა)" 
                icon={ShieldAlert} 
                placeholder="მაგ: ანესთეზია, პენიცილინი..."
                value={formData.allergies}
                className="border-red-100 focus:border-red-400"
                iconClassName="text-red-400"
                onChange={val => setFormData({...formData, allergies: val})}
              />

              <FormInput 
                type="textarea"
                label="ქრონიკული დაავადებები" 
                icon={FileText} 
                placeholder="მაგ: დიაბეტი, ჰიპერტენზია..."
                value={formData.chronicDiseases}
                onChange={val => setFormData({...formData, chronicDiseases: val})}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-white grid grid-cols-2 gap-4">
          <button type="button" onClick={onClose} className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">გაუქმება</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || (clinicData?.plan === "free" && currentCount >= 50)} 
            className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-brand-deep hover:bg-brand-purple shadow-xl shadow-brand-purple/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "ბარათის შექმნა"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddPatientSlideOver;