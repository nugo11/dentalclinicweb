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
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateForm100 } from "../../utils/generateForm100";
import { useAuth } from "../../context/AuthContext";

const PatientsTable = ({ externalSearch = "" }) => {
  const navigate = useNavigate();
  const { clinicData, userData } = useAuth();
  
  // რეფერენსი ცხრილის მთავარი დივისთვის
  const tableTopRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userData?.clinicId]);

  const filteredPatients = patients.filter(
    (p) =>
      (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.personalId?.includes(searchTerm) ||
      (p.phone || "").includes(searchTerm),
  );

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-[40px] border border-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-brand-purple animate-spin" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            მონაცემები იტვირთება...
          </p>
        </div>
      </div>
    );
  }

  return (
    // დავამატეთ ref ამ დივზე
    <div ref={tableTopRef} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full relative font-nino">
      
      {/* --- ფორმა 100-ის მოდალი --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-brand-deep tracking-tight">ფორმა 100-ის გენერაცია</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                    პაციენტი: {selectedPatient?.fullName}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 ml-1">
                  ექიმის დასკვნა და დანიშნულება
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="ჩაწერეთ დიაგნოზი, ჩატარებული პროცედურები და მკურნალობის გეგმა..."
                  className="w-full h-48 p-6 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-sm text-brand-deep resize-none custom-scrollbar"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
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
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="relative w-full sm:max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple transition-colors"
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
            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-brand-deep focus:bg-white focus:border-brand-purple border-2 border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                პაციენტის ბარათი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                კონტაქტი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                სამედიცინო სტატუსი
              </th>
              <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                ბოლო ვიზიტი
              </th>
              <th className="py-5 px-8 border-b border-gray-100"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentPatients.length > 0 ? (
              currentPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="group hover:bg-slate-50/50 transition-all cursor-default"
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center font-black group-hover:bg-brand-purple group-hover:text-white transition-all shadow-sm">
                        {(patient.fullName || "?")[0]}
                      </div>
                      <div>
                        <p className="font-black text-brand-deep text-sm tracking-tight">
                          {patient.fullName || "უცნობი პაციენტი"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          ID: {patient.personalId || "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-brand-deep font-bold text-xs">
                        <Phone size={14} className="text-gray-400" />{" "}
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-gray-400 font-medium text-[11px]">
                          <History size={12} /> {patient.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">
                        ⚠ ალერგიული
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                        ✓ ნორმალური
                      </span>
                    )}
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-brand-deep">
                        {patient.lastVisit || "ვიზიტები არ არის"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        ჯავშნები: {patient.appointmentCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openFormModal(patient);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                      >
                        <FileText size={14} /> ფორმა 100
                      </button>

                      <button 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-deep transition-all shadow-lg shadow-brand-purple/20 active:scale-95 cursor-pointer"
                      >
                        ბარათის გახსნა <ArrowRight size={14} />
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

      {/* --- Pagination Footer --- */}
      {totalPages > 1 && (
        <div className="px-8 py-5 border-t border-gray-50 bg-slate-50/30 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            გვერდი {currentPage} / {totalPages} — სულ {filteredPatients.length} პაციენტი
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2.5 cursor-pointer rounded-xl border transition-all ${
                currentPage === 1 
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                : "bg-white text-brand-deep border-gray-200 hover:border-brand-purple hover:text-brand-purple active:scale-90"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (totalPages > 5 && (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1)) {
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-gray-300">...</span>;
                    return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-9 cursor-pointer h-9 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === pageNum
                      ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20"
                      : "text-gray-400 hover:bg-gray-100"
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
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                : "bg-white text-brand-deep border-gray-200 hover:border-brand-purple hover:text-brand-purple active:scale-90"
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