import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { Plus, Users, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { PLANS } from '../config/plans';
import Sidebar from '../components/Dashboard/Sidebar';
import TopNav from '../components/Dashboard/TopNav';
import PatientsTable from '../components/Patients/PatientsTable';
import AddPatientSlideOver from '../components/Patients/AddPatientSlideOver';

const Patients = () => {
  const { clinicData, userData } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || "";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "patients"),
      where("clinicId", "==", userData.clinicId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatientsCount(snapshot.docs.length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsAddModalOpen(true);
      // წავშალოთ პარამეტრი URL-დან სისუფთავისთვის
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  const currentPlan = PLANS[(clinicData?.plan || "free").toLowerCase()] || PLANS.free;
  const maxPatients = currentPlan.maxPatients;
  const isLimitReached = maxPatients !== Infinity && patientsCount >= maxPatients;

  return (
    <>
      <Helmet>
        <title>პაციენტები — DentalHub</title>
      </Helmet>

      <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino text-slate-900">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC] custom-scrollbar flex flex-col">
            <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-[20px] flex items-center justify-center text-brand-purple">
                    <Users size={24} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-brand-deep italic tracking-tighter">პაციენტების ბაზა</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">სულ რეგისტრირებულია:</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isLimitReached ? 'bg-red-50 text-red-500' : 'bg-brand-purple/10 text-brand-purple'}`}>
                        {patientsCount} {maxPatients === Infinity ? '(ულიმიტო)' : `/ ${maxPatients}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={isLimitReached}
                  onClick={() => setIsAddModalOpen(true)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-[20px] shadow-xl transition-all active:scale-95 group
                    ${isLimitReached
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-brand-purple text-white hover:bg-brand-deep shadow-brand-purple/20'
                    }`}
                >
                  {isLimitReached ? (
                    <span className="text-[11px] font-black uppercase tracking-widest italic">ლიმიტი ამოწურულია</span>
                  ) : (
                    <>
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span className="text-[11px] font-black uppercase tracking-widest">ახალი პაციენტი</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <PatientsTable externalSearch={initialSearch} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddPatientSlideOver
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentCount={patientsCount}
      />
    </>
  );
};

export default Patients;
