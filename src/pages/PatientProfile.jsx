import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import PatientHistory from "../components/Patients/PatientHistory";
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Phone,
  Calendar,
  HeartPulse,
  Loader2,
  Edit3,
  Mail,
  BadgeInfo,
  Activity,
  Check,
  AlertTriangle,
  X,
  ShieldAlert,
} from "lucide-react";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import DentalChart from "../components/Patients/DentalChart/DentalChart";
import { useAuth } from "../context/AuthContext";
import { transliterateToGeorgian } from "../utils/transliterateKa";
import { logActivity } from "../utils/activityLogger";

const PatientProfile = () => {
  const { id } = useParams();
  const { userData, currentUser, activeStaff } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [toothComment, setToothComment] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const clinicId = userData?.clinicId || currentUser?.uid;
          if (clinicId && data.clinicId !== clinicId) {
            navigate("/patients");
            return;
          }
          setPatientData(data);
        } else {
          navigate("/patients");
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, navigate, userData?.clinicId, currentUser?.uid]);

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      const clinicId = userData?.clinicId || currentUser?.uid;
      if (!clinicId || patientData?.clinicId !== clinicId) {
        navigate("/patients");
        return;
      }
      const patientRef = doc(db, "patients", id);
      await updateDoc(patientRef, patientData);
      
      // LOG ACTIVITY
      await logActivity(clinicId, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'patient_update', `განახლდა პაციენტის (${patientData.fullName}) მონაცემები`, { patientId: id, patientName: patientData.fullName });

      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const clinicId = userData?.clinicId || currentUser?.uid;
      if (!clinicId || patientData?.clinicId !== clinicId) {
        navigate("/patients");
        return;
      }
      await deleteDoc(doc(db, "patients", id));

      // LOG ACTIVITY
      await logActivity(clinicId, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'patient_delete', `წაიშალა პაციენტი: ${patientData.fullName}`, { patientId: id, patientName: patientData.fullName });

      navigate("/patients");
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToothUpdate = async (toothNumber, newStatus, comment = "") => {
    const patientRef = doc(db, "patients", id);
    const updatedTeeth = {
      ...(patientData.teethStatus || {}),
      [toothNumber]: {
        status:
          newStatus ||
          patientData.teethStatus?.[toothNumber]?.status ||
          "healthy",
        comment: comment,
        updatedAt: new Date().toISOString(),
      },
    };
    try {
      const clinicId = userData?.clinicId || currentUser?.uid;
      await updateDoc(patientRef, { teethStatus: updatedTeeth });
      
      // LOG ACTIVITY
      await logActivity(clinicId, activeStaff || userData || { uid: currentUser.uid, fullName: 'Unknown', role: 'unknown' }, 'tooth_update', `შეიცვალა კბილის (#${toothNumber}) სტატუსი: ${newStatus || 'update'} პაციენტისთვის: ${patientData.fullName}`, { patientId: id, tooth: toothNumber, status: newStatus });

      setPatientData({ ...patientData, teethStatus: updatedTeeth });
      setIsStatusModalOpen(false);
    } catch (error) {
      console.error("Error updating tooth:", error);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-surface-soft">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );

  return (
    <>
      <Helmet>
        <title>{patientData?.fullName || "პაციენტი"} — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/patients")}
                className="flex items-center gap-2 text-text-muted hover:text-text-main font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer"
              >
                <ArrowLeft size={16} /> უკან სიაში
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-4 bg-surface border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/10 transition-all shadow-sm cursor-pointer"
                >
                  <Trash2 size={20} />
                </button>

                <button
                  onClick={() =>
                    isEditing ? handleUpdate() : setIsEditing(true)
                  }
                  disabled={actionLoading}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all cursor-pointer disabled:opacity-70 ${
                    isEditing
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-purple text-white"
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : isEditing ? (
                    <>
                      <Save size={18} /> შენახვა
                    </>
                  ) : (
                    <>
                      <Edit3 size={18} /> რედაქტირება
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-surface rounded-[40px] p-10 border border-border-main shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="w-28 h-28 bg-brand-purple/10 rounded-[32px] flex items-center justify-center text-brand-purple text-4xl font-black shrink-0">
                {patientData.fullName ? patientData.fullName[0] : "?"}
              </div>
              <div className="text-center md:text-left flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={patientData.fullName}
                    onChange={(e) =>
                      setPatientData({
                        ...patientData,
                        fullName: transliterateToGeorgian(e.target.value),
                      })
                    }
                    className="text-4xl font-black text-text-main italic tracking-tighter mb-3 bg-surface-soft border-b-2 border-brand-purple outline-none px-2 w-full max-w-md"
                  />
                ) : (
                  <h1 className="text-4xl font-black text-text-main italic tracking-tighter mb-3">
                    {patientData.fullName}
                  </h1>
                )}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {isEditing ? (
                    <input 
                      type="text"
                      maxLength={11}
                      value={patientData.personalId}
                      onChange={e => setPatientData({...patientData, personalId: e.target.value})}
                      className="px-4 py-2 bg-surface-soft rounded-xl text-[10px] font-black uppercase text-brand-purple tracking-widest border border-brand-purple/20 outline-none w-32"
                    />
                  ) : (
                    <span className="px-4 py-2 bg-surface-soft rounded-xl text-[10px] font-black uppercase text-text-muted tracking-widest border border-border-main italic">
                      ID: {patientData.personalId}
                    </span>
                  )}
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl text-[10px] font-black uppercase text-blue-500 tracking-widest border border-blue-500/20 italic text-nowrap	">
                    <HeartPulse size={12} /> ჯგუფი:{" "}
                    {isEditing ? (
                      <select
                        value={patientData.bloodGroup}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            bloodGroup: e.target.value,
                          })
                        }
                        className="bg-transparent outline-none cursor-pointer font-black"
                      >
                        {[
                          "N/A",
                          "A+",
                          "A-",
                          "B+",
                          "B-",
                          "O+",
                          "O-",
                          "AB+",
                          "AB-",
                        ].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    ) : (
                      patientData.bloodGroup || "N/A"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* პერსონალური და სამედიცინო ინფო */}
              <div className="lg:col-span-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <InfoBlock
                    label="სქესი"
                    icon={User}
                    value={
                      patientData.gender === "male"
                        ? "მამრობითი"
                        : patientData.gender === "female"
                          ? "მდედრობითი"
                          : "---"
                    }
                    editable={isEditing}
                    type="select"
                    options={[
                      { value: "male", label: "მამრობითი" },
                      { value: "female", label: "მდედრობითი" },
                    ]}
                    onChange={(val) =>
                      setPatientData({ ...patientData, gender: val })
                    }
                  />
                  <InfoBlock
                    label="დაბადების თარიღი"
                    icon={Calendar}
                    value={patientData.birthDate}
                    editable={isEditing}
                    type="date"
                    onChange={(val) =>
                      setPatientData({ ...patientData, birthDate: val })
                    }
                  />
                </div>

                <InfoBlock
                  label="ტელეფონი"
                  icon={Phone}
                  value={patientData.phone}
                  editable={isEditing}
                  onChange={(val) =>
                    setPatientData({ ...patientData, phone: val })
                  }
                />

                <InfoBlock
                  label="ელ-ფოსტის მისამართი"
                  icon={Mail}
                  value={patientData.email}
                  editable={isEditing}
                  type="email"
                  onChange={(val) =>
                    setPatientData({ ...patientData, email: val })
                  }
                />

                <div
                  className={`bg-surface p-6 rounded-[28px] border-2 transition-all ${patientData.allergies ? "border-red-500/20 shadow-red-50" : "border-border-main shadow-sm"}`}
                >
                  <label className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3 block italic flex items-center gap-2">
                    <ShieldAlert size={12} /> ალერგიები
                  </label>
                  {isEditing ? (
                    <textarea
                      value={patientData.allergies || ""}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          allergies: e.target.value,
                        })
                      }
                      placeholder="მაგ: პენიცილინი..."
                      className="w-full bg-red-500/10/30 border-none rounded-xl p-3 outline-none font-bold text-sm text-red-600 min-h-[80px] resize-none"
                    />
                  ) : (
                    <p
                      className={`font-black text-sm italic ${patientData.allergies ? "text-red-500" : "text-text-muted"}`}
                    >
                      {patientData.allergies || "არ არის დაფიქსირებული"}
                    </p>
                  )}
                </div>

                <div className="bg-surface p-6 rounded-[28px] border border-border-main shadow-sm">
                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 block italic flex items-center gap-2">
                    <Activity size={12} /> ქრონიკული დაავადებები
                  </label>
                  {isEditing ? (
                    <textarea
                      value={patientData.diseases || ""}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          diseases: e.target.value,
                        })
                      }
                      placeholder="მაგ: დიაბეტი..."
                      className="w-full bg-blue-500/10/30 border-none rounded-xl p-3 outline-none font-bold text-sm text-blue-600 min-h-[80px] resize-none"
                    />
                  ) : (
                    <p
                      className={`font-black text-sm italic ${patientData.diseases ? "text-blue-500" : "text-text-muted"}`}
                    >
                      {patientData.diseases || "არ არის დაფიქსირებული"}
                    </p>
                  )}
                </div>
              </div>

              {/* სამედიცინო სვეტი */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface p-10 rounded-[40px] border border-border-main shadow-sm relative overflow-hidden">
                  <h3 className="text-2xl font-black text-text-main italic tracking-tighter flex items-center gap-3 mb-10">
                    <Activity className="text-brand-purple" size={24} />{" "}
                    სტომატოლოგიური სტატუსი
                  </h3>
                  <DentalChart
                    data={patientData.teethStatus || {}}
                    onToothUpdate={(num) => {
                      setSelectedTooth(num);
                      setIsStatusModalOpen(true);
                    }}
                  />
                </div>
                <PatientHistory patientId={id} />
              </div>
            </div>
          </div>

          {/* Delete Confirm Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md"
                onClick={() => setShowDeleteConfirm(false)}
              />
              <div className="bg-surface rounded-[40px] w-full max-w-sm p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} />
                </div>
                <h3 className="text-xl font-black text-text-main italic mb-2">
                  ბარათის წაშლა
                </h3>
                <p className="text-xs text-text-muted font-bold leading-relaxed mb-8 uppercase tracking-widest">
                  პაციენტის ყველა მონაცემი სამუდამოდ წაიშლება.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin mx-auto" size={16} />
                    ) : (
                      "წაშლა"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tooth Status Modal */}
          {isStatusModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-brand-deep/40 backdrop-blur-sm"
                onClick={() => setIsStatusModalOpen(false)}
              />
              <div className="bg-surface rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-text-main italic">
                      კბილი #{selectedTooth}
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                      სტატუსი და შენიშვნები
                    </p>
                  </div>
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="text-text-muted hover:text-text-main cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "healthy",
                        label: "ჯანმრთელი",
                        color: "bg-emerald-500/10 text-emerald-600",
                      },
                      {
                        id: "caries",
                        label: "კარიესი",
                        color: "bg-amber-500/10 text-amber-600",
                      },
                      {
                        id: "pulpitis",
                        label: "პულპიტი",
                        color: "bg-red-500/10 text-red-600",
                      },
                      {
                        id: "implant",
                        label: "იმპლანტი",
                        color: "bg-blue-500/10 text-blue-600",
                      },
                      {
                        id: "missing",
                        label: "ამოღებული",
                        color: "bg-surface-soft text-text-muted",
                      },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          handleToothUpdate(selectedTooth, s.id, toothComment);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:scale-[1.02] cursor-pointer ${
                          patientData.teethStatus?.[selectedTooth]?.status ===
                          s.id
                            ? `${s.color} ring-2 ring-offset-1 ring-current`
                            : "bg-surface-soft text-text-muted"
                        }`}
                      >
                        {s.label}
                        {patientData.teethStatus?.[selectedTooth]?.status ===
                          s.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 italic flex items-center gap-2">
                      <Edit3 size={12} /> ექიმის შენიშვნა
                    </label>
                    <textarea
                      value={toothComment}
                      onChange={(e) => setToothComment(e.target.value)}
                      placeholder="მაგ: არხები დასაბჟენია..."
                      className="w-full h-32 bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl p-4 outline-none font-bold text-sm text-text-main resize-none transition-all"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const status =
                        patientData.teethStatus?.[selectedTooth]?.status ||
                        "healthy";
                      handleToothUpdate(selectedTooth, status, toothComment);
                    }}
                    className="w-full py-4 bg-brand-deep text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-deep/20 hover:bg-black transition-all cursor-pointer"
                  >
                    მონაცემების შენახვა
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

const InfoBlock = ({
  label,
  icon: Icon,
  value,
  editable,
  onChange,
  type = "text",
  options = [],
}) => (
  <div className="bg-surface p-6 rounded-[28px] border border-border-main shadow-sm group">
    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3 block italic">
      {label}
    </label>
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-surface-soft rounded-xl text-text-muted group-focus-within:text-brand-purple transition-colors">
        <Icon size={18} />
      </div>
      {editable ? (
        type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-xl px-4 py-2 outline-none font-bold text-text-main text-sm cursor-pointer"
          >
            <option value="">აირჩიე...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-xl px-4 py-2 outline-none font-bold text-text-main text-sm"
          />
        )
      ) : (
        <p className="font-black text-text-main tracking-tight text-sm italic">
          {value || "—"}
        </p>
      )}
    </div>
  </div>
);

export default PatientProfile;
