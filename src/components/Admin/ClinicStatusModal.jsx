import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, X, Power, Loader2, ShieldAlert } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { logAdminAudit } from "../../utils/superAdmin";

const ClinicStatusModal = ({ clinic, isOpen, onClose, adminEmail, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !clinic) return null;

  const currentStatus = clinic.subscriptionStatus || "active";
  const isCurrentlyActive = currentStatus === "active";
  const newStatus = isCurrentlyActive ? "suspended" : "active";

  const handleToggle = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const clinicRef = doc(db, "clinics", clinic.id);
      const updates = {
        subscriptionStatus: newStatus,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: adminEmail,
        statusUpdateReason: reason.trim() || (newStatus === "suspended" ? "ადმინისტრატორის მიერ შეჩერება" : "ადმინისტრატორის მიერ გააქტიურება"),
      };

      await updateDoc(clinicRef, updates);

      // Audit log
      await logAdminAudit({
        adminEmail,
        action: newStatus === "suspended" ? "CLINIC_SUSPENDED" : "CLINIC_ACTIVATED",
        targetType: "clinic",
        targetId: clinic.id,
        targetName: clinic.clinicName || "კლინიკა",
        clinicId: clinic.id,
        clinicName: clinic.clinicName || "კლინიკა",
        details: `კლინიკის სტატუსი შეიცვალა: ${currentStatus} ➔ ${newStatus}. მიზეზი: ${updates.statusUpdateReason}`,
        metadata: {
          previousStatus: currentStatus,
          newStatus,
          reason: updates.statusUpdateReason,
        },
      });

      onSuccess?.(newStatus);
      onClose();
    } catch (err) {
      console.error("Error toggling clinic status:", err);
      setError("სტატუსის შეცვლა ვერ მოხერხდა: " + (err.message || "უცნობი შეცდომა"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-surface rounded-[32px] p-6 md:p-8 shadow-2xl border border-border-main relative overflow-hidden">
        {/* Top Decorative bar */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${newStatus === "suspended" ? "bg-red-500" : "bg-emerald-500"}`} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${newStatus === "suspended" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
              {newStatus === "suspended" ? <Power size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-tight">
                {newStatus === "suspended" ? "კლინიკის გათიშვა" : "კლინიკის ჩართვა"}
              </h3>
              <p className="text-xs text-text-muted font-bold">
                {clinic.clinicName} (@{clinic.loginName || clinic.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6 p-4 rounded-2xl bg-surface-soft border border-border-main text-xs space-y-2">
          {newStatus === "suspended" ? (
            <div className="flex items-start gap-2.5 text-red-500 font-bold">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <span>
                <strong>ყურადღება:</strong> გათიშვის შემდეგ ამ კლინიკის ყველა თანამშრომელი (ექიმები, ადმინისტრაცია) მყისიერად გადამისამართდება დაბლოკილ გვერდზე და ვერ შეძლებს სისტემაში მუშაობას.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>
                კლინიკის სტატუსი გახდება <strong>აქტიური</strong>. ყველა ექიმი და თანამშრომელი ჩვეულებრივ შეძლებს სისტემაში შესვლას.
              </span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider mb-2">
            ცვლილების მიზეზი (არასავალდებულო)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={newStatus === "suspended" ? "მაგ: გადასახადის დავალიანება, შემოწმება..." : "მაგ: გადახდა დადასტურდა..."}
            className="w-full px-4 py-3 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xs font-bold focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-surface-soft hover:bg-border-main text-text-main rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
          >
            გაუქმება
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isSubmitting}
            className={`flex-1 py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              newStatus === "suspended"
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : newStatus === "suspended" ? (
              <>
                <Power size={16} /> გათიშვა
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> ჩართვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicStatusModal;
