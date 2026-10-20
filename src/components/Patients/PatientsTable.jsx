import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import {
  Search,
  Filter,
  Phone,
  Calendar,
  ArrowRight,
  Loader2,
  UserCircle2,
  MoreHorizontal,
  History,
  Edit3,   
  Trash2,
  FileText,
  User,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateForm100 } from "../../utils/generateForm100";
import { useAuth } from "../../context/AuthContext";

const PatientsTable = ({ externalSearch = "", onCountChange, onLoadingChange }) => {
  const navigate = useNavigate();
  const { clinicData, userData } = useAuth();
  
  // რეფერენსი ცხრილის მთავარი დივისთვის
  const tableTopRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(externalSearch);

  // Update search term if external prop changes
  useEffect(() => {
    if (externalSearch) {
        setSearchTerm(externalSearch);
        setCurrentPage(1);
    }
  }, [externalSearch]);

  // --- Pagination-ის სტეიტები ---
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 20;

  // --- მოდალის სტეიტები ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");

  const openFormModal = (patient) => {
    setSelectedPatient(patient);
    setDoctorNotes(""); 
    setIsModalOpen(true);
  };

  const [isGeneratingForm, setIsGeneratingForm] = useState(false);

  const handleFinalGenerate = async () => {
    setIsGeneratingForm(true);
    await generateForm100(selectedPatient, clinicData, doctorNotes);
    setIsGeneratingForm(false);
    setIsModalOpen(false);
  };

  // --- ავტომატური სქროლვა ზევით გვერდის შეცვლისას ---
  useEffect(() => {
    // თუ პაგინაცია შეიცვალა, გვერდი ადის ზევით
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // თუ ცხრილი არის Scrollable კონტეინერში, ეს აიტანს მის შიდა სქროლსაც
    if (tableTopRef.current) {
        tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const clinicId = userData?.clinicId || user.uid;

    const q = query(
      collection(db, "patients"),
      where("clinicId", "==", clinicId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientsData);
        if (onCountChange) onCountChange(patientsData.length);
        if (onLoadingChange) onLoadingChange(false);
        setFetchError(null);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients:", error);
        if (onLoadingChange) onLoadingChange(false);
        setFetchError(error.message || "მონაცემების ჩატვირთვა ვერ მოხერხდა");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userData?.clinicId]);

  const cleanSearchDigits = searchTerm.replace(/\D/g, '');
  const filteredPatients = patients.filter((p) => {
    if (!searchTerm.trim()) return true;
    const nameMatch = (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = cleanSearchDigits ? p.personalId?.replace(/\D/g, '').includes(cleanSearchDigits) : false;
    const phoneMatch = cleanSearchDigits ? (p.phone || "").replace(/\D/g, '').includes(cleanSearchDigits) : false;
    const emailMatch = (p.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || phoneMatch || emailMatch;
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface rounded-[40px] border border-border-main">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-brand-purple animate-spin" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            მონაცემები იტვირთება...
          </p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface rounded-[40px] border border-red-500/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <X size={24} />
          </div>
          <h4 className="text-base font-black text-text-main">მონაცემების ჩატვირთვა ვერ მოხერხდა</h4>
          <p className="text-xs text-text-muted">გადაამოწმეთ ინტერნეტ კავშირი ან ბაზის წვდომის პარამეტრები.</p>
        </div>
      </div>
    );
  }

  return (
    // დავამატეთ ref ამ დივზე
    <div ref={tableTopRef} className="bg-surface rounded-[32px] md:rounded-[40px] border border-border-main shadow-sm overflow-hidden flex flex-col h-full relative font-nino">
      
      {/* --- ფორმა 100-ის მოდალი --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative bg-surface w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-text-main tracking-tight">ფორმა 100-ის გენერაცია</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase mt-1 tracking-widest">
                    პაციენტი: {selectedPatient?.fullName}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-surface-soft rounded-full transition-colors"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted ml-1">
                  ექიმის დასკვნა და დანიშნულება
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="ჩაწერეთ დიაგნოზი, ჩატარებული პროცედურები და მკურნალობის გეგმა..."
                  className="w-full h-48 p-6 bg-surface-soft rounded-[24px] border-2 border-transparent focus:border-brand-purple focus:bg-surface outline-none transition-all font-bold text-sm text-text-main resize-none custom-scrollbar"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-surface-soft transition-all"
                >
                  გაუქმება
                </button>
                 <button
                  disabled={isGeneratingForm}
                  onClick={handleFinalGenerate}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingForm ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />} PDF გენერაცია
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-border-main flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="relative w-full sm:max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="მოძებნე პაციენტი (სახელი, პირადი ნომერი, ტელეფონი)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-surface-soft rounded-2xl outline-none font-bold text-sm text-text-main focus:bg-surface focus:border-brand-purple border-2 border-transparent transition-all"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-surface-soft/50 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="py-5 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main">
                პაციენტის ბარათი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main">
                კონტაქტი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main">
                სამედიცინო სტატუსი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main">
                ბოლო ვიზიტი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-main text-right w-64 shrink-0">
                მოქმედება
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main">
            {currentPatients.length > 0 ? (
              currentPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="group hover:bg-surface-soft/80 transition-all cursor-default"
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center font-black group-hover:bg-brand-purple group-hover:text-white transition-all shadow-sm shrink-0">
                        {(patient.fullName || "?")[0]}
                      </div>
                      <div>
                        <p className="font-black text-text-main text-sm tracking-tight">
                          {patient.fullName || "უცნობი პაციენტი"}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                          ID: {patient.personalId || "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-text-main font-bold text-xs">
                        <Phone size={14} className="text-text-muted" />{" "}
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-text-muted font-medium text-[11px]">
                          <History size={12} /> {patient.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-8 whitespace-nowrap">
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                        ⚠ ალერგიული
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                        ✓ ნორმალური
                      </span>
                    )}
                  </td>
                  <td className="py-6 px-8 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-text-main">
                        {patient.lastVisit || "ვიზიტები არ არის"}
                      </span>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">
                        ჯავშნები: {patient.appointmentCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right whitespace-nowrap w-64 shrink-0">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openFormModal(patient);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 shadow-sm active:scale-95 cursor-pointer"
                        title="ფორმა 100-ის გენერაცია"
                      >
                        <FileText size={13} /> ფორმა 100
                      </button>

                      <button 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-purple text-white hover:bg-brand-deep rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-brand-purple/20 active:scale-95 cursor-pointer"
                        title="პაციენტის გვერდი და ბარათი"
                      >
                        <User size={13} /> პაციენტის გვერდი
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <UserCircle2 size={48} />
                    <p className="font-black uppercase text-xs tracking-[0.2em]">
                      პაციენტი ვერ მოიძებნა
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< 768px) */}
      <div className="block md:hidden flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {currentPatients.length > 0 ? (
          currentPatients.map((patient) => (
            <div key={patient.id} className="bg-surface-soft/40 p-4 rounded-2xl border border-border-main space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-sm shrink-0">
                    {(patient.fullName || "?")[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-text-main text-sm leading-snug">{patient.fullName || "უცნობი პაციენტი"}</h4>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                      ID: {patient.personalId || "N/A"}
                    </p>
                  </div>
                </div>
                {patient.allergies ? (
                  <span className="inline-flex px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-red-500/20 shrink-0">
                    ⚠ ალერგია
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 shrink-0">
                    ✓ ნორმა
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-border-main/50 text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-text-muted block">ტელეფონი</span>
                  <a href={`tel:${patient.phone}`} className="font-bold text-text-main hover:text-brand-purple transition-colors flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-text-muted" /> {patient.phone || "N/A"}
                  </a>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-text-muted block">ბოლო ვიზიტი</span>
                  <span className="font-bold text-text-main block mt-0.5 truncate">{patient.lastVisit || "არ ყოფილა"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => openFormModal(patient)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 active:scale-95"
                >
                  <FileText size={13} /> ფორმა 100
                </button>
                <button
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-brand-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                >
                  <User size={13} /> ბარათი
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <UserCircle2 size={40} className="mx-auto text-text-muted opacity-30 mb-2" />
            <p className="font-black uppercase text-[10px] tracking-widest text-text-muted">პაციენტი ვერ მოიძებნა</p>
          </div>
        )}
      </div>

      {/* --- Pagination Footer --- */}
      {totalPages > 1 && (
        <div className="px-4 md:px-8 py-4 md:py-5 border-t border-border-main bg-surface-soft/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            გვერდი {currentPage} / {totalPages} — სულ {filteredPatients.length} პაციენტი
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2.5 cursor-pointer rounded-xl border transition-all ${
                currentPage === 1 
                ? "bg-surface-soft text-text-muted border-border-main cursor-not-allowed" 
                : "bg-surface text-text-main border-border-dark hover:border-brand-purple hover:text-brand-purple active:scale-90"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (totalPages > 5 && (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1)) {
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-text-muted">...</span>;
                    return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-9 cursor-pointer h-9 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === pageNum
                      ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                      : "text-text-muted hover:bg-surface-soft"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2.5 cursor-pointer rounded-xl border transition-all ${
                currentPage === totalPages 
                ? "bg-surface-soft text-text-muted border-border-main cursor-not-allowed" 
                : "bg-surface text-text-main border-border-dark hover:border-brand-purple hover:text-brand-purple active:scale-90"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsTable;