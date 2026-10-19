import React, { useState, useEffect } from "react";
import { X, Sparkles, Building2, Check, Shield, AlertTriangle, Loader2, Users } from "lucide-react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../../firebase";
import { logAdminAudit } from "../../utils/superAdmin";
import { normalizePlanId } from "../../config/plans";

const ClinicPlanModal = ({ clinic, isOpen, onClose, adminEmail, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [customMaxDoctors, setCustomMaxDoctors] = useState("15");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clinic) {
      const currentPlan = normalizePlanId(clinic.plan);
      setSelectedPlan(currentPlan);
      setCustomMaxDoctors(clinic.customMaxDoctors ? String(clinic.customMaxDoctors) : "15");
      setError("");
    }
  }, [clinic, isOpen]);

  if (!isOpen || !clinic) return null;

  const currentPlanNormalized = normalizePlanId(clinic.plan);
  const currentMaxDoctors = clinic.customMaxDoctors || (currentPlanNormalized === "custom" ? 15 : null);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const clinicRef = doc(db, "clinics", clinic.id);
      const updates = {
        plan: selectedPlan,
        planUpdatedAt: new Date().toISOString(),
        planUpdatedBy: adminEmail || "superadmin",
      };

      if (selectedPlan === "custom") {
        const parsedDocs = parseInt(customMaxDoctors, 10);
        if (isNaN(parsedDocs) || parsedDocs <= 0) {
          setError("გთხოვთ მიუთითოთ ექიმების ვალიდური რაოდენობა (მინიმუმ 1)");
          setIsSubmitting(false);
          return;
        }
        updates.customMaxDoctors = parsedDocs;
      }

      await updateDoc(clinicRef, updates);

      const planSummary = selectedPlan === "custom"
        ? `CUSTOM (${updates.customMaxDoctors} ექიმის ლიმიტი)`
        : selectedPlan.toUpperCase();

      await logAdminAudit({
        adminEmail: adminEmail || "superadmin",
        action: "PLAN_CHANGED",
        targetType: "clinic",
        targetId: clinic.id,
        targetName: clinic.clinicName || "კლინიკა",
        clinicId: clinic.id,
        clinicName: clinic.clinicName || "კლინიკა",
        details: `კლინიკის ტარიფი განახლდა: ${currentPlanNormalized.toUpperCase()} ➔ ${planSummary}`,
        metadata: {
          previousPlan: currentPlanNormalized,
          newPlan: selectedPlan,
          customMaxDoctors: selectedPlan === "custom" ? updates.customMaxDoctors : null,
        },
      });

      onSuccess?.(selectedPlan, updates.customMaxDoctors);
      onClose();
    } catch (err) {
      console.error("Error updating clinic plan:", err);
      setError("ტარიფის განახლება ვერ მოხერხდა: " + (err.message || "უცნობი შეცდომა"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const planOptions = [
    {
      id: "free",
      name: "FREE",
      subName: "სატესტო ტარიფი",
      price: "უფასო",
      doctors: "3 ექიმი",
      features: ["50 პაციენტის ლიმიტი", "10 ინვენტარის ნივთი", "10 სერვისი", "საბაზისო ფუნქციები"],
      badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      activeRing: "ring-slate-500 border-slate-500",
    },
    {
      id: "business",
      name: "BUSINESS",
      subName: "სტანდარტული ბიზნესი",
      price: "49 ₾ / თვე",
      doctors: "6 ექიმი",
      features: ["ულიმიტო პაციენტები", "ულიმიტო საწყობი & სერვისები", "VIP პოზიცია კატალოგში", "ტექნიკური მხარდაჭერა"],
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      activeRing: "ring-blue-500 border-blue-500",
    },
    {
      id: "custom",
      name: "CUSTOM",
      subName: "ინდივიდუალური პაკეტი",
      price: "შეთანხმებით",
      doctors: "ინდივიდუალური ლიმიტი",
      features: ["მორგებული ექიმების რაოდენობა", "EHR სინქრონიზაცია", "ულიმიტო შესაძლებლობები", "პრიორიტეტული VIP მხარდაჭერა"],
      badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      activeRing: "ring-purple-500 border-purple-500",
      isCustom: true,
    },
  ];

  const presets = [5, 10, 15, 20, 25, 30, 50, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-xl w-full max-h-[92vh] bg-surface rounded-[32px] p-6 md:p-8 shadow-2xl border border-border-main relative flex flex-col overflow-hidden">
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-purple via-blue-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border-main shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-tight">
                ტარიფის მართვა & შეცვლა
              </h3>
              <p className="text-xs text-text-muted font-bold mt-0.5">
                {clinic.clinicName} (@{clinic.loginName || clinic.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 custom-scrollbar pr-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-border-main flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">
                ამჟამინდელი ტარიფი ბაზაში
              </span>
              <span className="text-sm font-black text-text-main uppercase mt-0.5 inline-block">
                {currentPlanNormalized.toUpperCase()}
                {currentPlanNormalized === "custom" && currentMaxDoctors && ` (${currentMaxDoctors} ექიმი)`}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              მიმდინარე
            </span>
          </div>

          {/* Plan Selection Cards */}
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
              აირჩიეთ ახალი ტარიფი
            </label>

            <div className="grid grid-cols-1 gap-3">
              {planOptions.map((opt) => {
                const isSelected = selectedPlan === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPlan(opt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? `bg-brand-purple/5 border-brand-purple ring-2 ring-brand-purple/40 shadow-sm`
                        : "bg-surface-soft/60 hover:bg-surface-soft border-border-main"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-brand-purple bg-brand-purple text-white"
                              : "border-border-dark bg-surface"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-text-main tracking-tight uppercase">
                              {opt.name}
                            </span>
                            <span className="text-[11px] text-text-muted font-bold">
                              • {opt.subName}
                            </span>
                          </div>
                          <span className="text-xs text-brand-purple font-bold">
                            {opt.doctors}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-text-main block">
                          {opt.price}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-border-main/60 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
                      {opt.features.map((feat, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-text-muted/60" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Doctors Limit Section */}
          {selectedPlan === "custom" && (
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-brand-purple">
                <Users size={16} />
                <label className="text-xs font-black uppercase tracking-wider">
                  ექიმების მაქსიმალური რაოდენობა (Custom ლიმიტი)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customMaxDoctors}
                  onChange={(e) => setCustomMaxDoctors(e.target.value)}
                  placeholder="მაგ: 15"
                  className="w-32 px-4 py-2.5 rounded-xl bg-surface border border-purple-500/40 text-text-main font-black text-base focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
                <span className="text-xs font-bold text-text-muted">
                  ექიმი კლინიკაში
                </span>
              </div>

              {/* Fast Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">
                  სწრაფი არჩევა:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomMaxDoctors(String(num))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        String(customMaxDoctors) === String(num)
                          ? "bg-brand-purple text-white shadow-sm"
                          : "bg-surface hover:bg-border-main text-text-main border border-border-main"
                      }`}
                    >
                      {num} {num >= 100 ? "(ულიმიტო)" : "ექიმი"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                CAD/CAM STOMATOLOGY-ს მსგავსი პარტნიორი კლინიკებისთვის მიუთითეთ შეთანხმებული ექიმების რაოდენობა (მაგ: <strong>15</strong>). ახალი ექიმის დამატებისას სისტემა ავტომატურად გააკონტროლებს ამ ზღვარს.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-border-main flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl bg-surface-soft hover:bg-border-main text-text-main text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            გაუქმება
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl bg-brand-purple hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-purple/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>ინახება...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>შენახვა</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicPlanModal;
