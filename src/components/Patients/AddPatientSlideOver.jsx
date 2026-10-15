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
import PhoneInput from '../Common/PhoneInput';
import { logActivity } from '../../utils/activityLogger';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { validatePhone, formatPhone } from '../../utils/phoneFormatter';
import { scrollToFirstError } from '../../utils/scrollHelper';

const AddPatientSlideOver = ({ isOpen, onClose, currentCount }) => {
  useLockBodyScroll(isOpen);
  const { clinicData, userData, activeStaff } = useAuth();
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
    importantNote: '',
    actualRegion: '',
    actualResidenceAddress: ''
  });
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // მკაცრი ვალიდაცია ყველა დაფიფქულ (*) და ფორმატირებულ ველზე
    const errors = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = "სრული სახელი და გვარი სავალდებულოა";
    }
    
    const phoneError = validatePhone(formData.phone, true);
    if (phoneError) {
      errors.phone = phoneError;
    }

    if (!formData.actualRegion || !formData.actualRegion.trim()) {
      errors.actualRegion = "რეგიონი / ქალაქი სავალდებულოა";
    }

    if (!formData.actualResidenceAddress || !formData.actualResidenceAddress.trim()) {
      errors.actualResidenceAddress = "ფაქტობრივი მისამართი სავალდებულოა";
    }

    if (formData.personalId && formData.personalId.replace(/\D/g, '').length !== 11) {
      errors.personalId = "პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollToFirstError('.app-sheet');
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

      const newPatient = await addDoc(collection(db, "patients"), {
        ...formData,
        clinicId,
        createdAt: serverTimestamp(),
        lastVisit: null,
        appointmentCount: 0,
        status: 'active'
      });

      // LOG ACTIVITY
      await logActivity(clinicId, activeStaff || userData || { uid: user.uid, fullName: 'Unknown', role: 'unknown' }, 'patient_create', `დაემატა ახალი პაციენტი: ${formData.fullName}`, { patientId: newPatient.id, patientName: formData.fullName });

      onClose();
      setFormData({ 
        fullName: '', personalId: '', phone: '', email: '', 
        birthDate: '', gender: 'not_specified', bloodGroup: '', 
        allergies: '', chronicDiseases: '', importantNote: '',
        actualRegion: '', actualResidenceAddress: ''
      });
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("პაციენტის დამატება ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full pl-12 pr-4 py-3.5 bg-surface-soft border-2 border-transparent focus:bg-surface focus:border-brand-purple rounded-2xl outline-none font-bold text-sm text-text-main transition-all";
  const labelStyle = "text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 mb-2 block";

  return (
    <>
      <div className="app-overlay fixed inset-0 touch-none z-40 animate-in fade-in duration-300" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />
      
      <div className="app-sheet fixed top-0 right-0 w-full max-w-xl h-full bg-surface shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-500 font-nino overscroll-contain">
        
        {/* Header */}
        <div className="p-8 border-b border-border-main flex items-center justify-between bg-surface-soft/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-purple text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-main italic tracking-tighter">პაციენტის რეგისტრაცია</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">
                სამედიცინო ბარათი #HUB-{Math.floor(Math.random() * 9000) + 1000}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-xl transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          <div className="p-8 space-y-10">
            
            {/* სექცია 1: პირადი ინფორმაცია */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-brand-purple pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-main">პირადი მონაცემები</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <FormInput 
                  label="სრული სახელი და გვარი" 
                  required 
                  icon={User} 
                  placeholder="მაგ: გიორგი მაისურაძე"
                  value={formData.fullName}
                  error={formErrors.fullName}
                  onChange={val => {
                    setFormData({...formData, fullName: transliterateToGeorgian(val)});
                    if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormInput 
                    label="პირადი ნომერი (11 ნიშნა)" 
                    icon={BadgeInfo} 
                    maxLength={11} 
                    placeholder="010XXXXXXXX"
                    value={formData.personalId}
                    error={formErrors.personalId}
                    onChange={val => {
                      const clean = val.replace(/\D/g, '');
                      setFormData({...formData, personalId: clean});
                      if (formErrors.personalId) setFormErrors(prev => ({ ...prev, personalId: undefined }));
                    }}
                  />
                  <FormInput 
                    type="date"
                    label="დაბადების თარიღი" 
                    icon={Calendar} 
                    placeholder="mm/dd/yyyy"
                    value={formData.birthDate}
                    onChange={val => setFormData({...formData, birthDate: val})}
                  />
                </div>
              </div>
            </div>

            {/* სექცია 2: კონტაქტი */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-main">საკონტაქტო ინფორმაცია</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <PhoneInput 
                  label="ტელეფონი" 
                  required 
                  value={formData.phone}
                  error={formErrors.phone}
                  onChange={(formatted) => {
                    setFormData({...formData, phone: formatted});
                    if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                  }}
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
              <div className="grid grid-cols-2 gap-5">
                <FormInput 
                  label="რეგიონი / ქალაქი" 
                  required 
                  icon={FileText} 
                  placeholder="მაგ: თბილისი"
                  value={formData.actualRegion}
                  error={formErrors.actualRegion}
                  onChange={val => {
                    setFormData({...formData, actualRegion: val});
                    if (formErrors.actualRegion) setFormErrors(prev => ({ ...prev, actualRegion: undefined }));
                  }}
                />
                <FormInput 
                  label="ფაქტობრივი მისამართი" 
                  required
                  icon={FileText} 
                  placeholder="მაგ: ე. ამაშუკელის N16"
                  value={formData.actualResidenceAddress}
                  error={formErrors.actualResidenceAddress}
                  onChange={val => {
                    setFormData({...formData, actualResidenceAddress: val});
                    if (formErrors.actualResidenceAddress) setFormErrors(prev => ({ ...prev, actualResidenceAddress: undefined }));
                  }}
                />
              </div>
            </div>

            {/* სექცია 3: სამედიცინო ანამნეზი */}
            <div className="space-y-6 bg-surface-soft p-6 rounded-[32px] border border-border-main">
              <div className="flex items-center gap-2 border-l-4 border-red-500 pl-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-main">სამედიცინო ანამნეზი</h3>
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
                  <option value="1">O (I)</option>
                  <option value="2">A (II)</option>
                  <option value="3">B (III)</option>
                  <option value="4">AB (IV)</option>
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
                className="border-red-500/20 focus:border-red-400"
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
        <div className="p-8 border-t border-border-main bg-surface grid grid-cols-2 gap-4">
          <button type="button" onClick={onClose} className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-text-muted hover:bg-surface-soft transition-all">გაუქმება</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || (clinicData?.plan === "free" && currentCount >= 50)} 
            className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-brand-purple shadow-xl shadow-brand-purple/20 hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "ბარათის შექმნა"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddPatientSlideOver;