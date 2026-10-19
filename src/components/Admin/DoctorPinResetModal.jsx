import React, { useState } from "react";
import { KeyRound, Sparkles, Copy, Check, X, AlertTriangle, ShieldCheck, Unlock, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { hashPinSha256, generateSecurePin, logAdminAudit } from "../../utils/superAdmin";
import { getRoleLabel } from "../../utils/roleUtils";

const DoctorPinResetModal = ({ staff, clinicName, isOpen, onClose, adminEmail, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPin, setSuccessPin] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !staff) return null;

  const handleGenerate = () => {
    const generated = generateSecurePin();
    setPin(generated);
    setError("");
  };

  const handleCopy = () => {
    if (!successPin) return;
    navigator.clipboard.writeText(successPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPin = pin.trim();

    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError("PIN კოდი უნდა შედგებოდეს ზუსტად 4 ციფრისგან (0-9)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const pinHash = await hashPinSha256(cleanPin);
      const userRef = doc(db, "users", staff.id);

      const updates = {
        pinHash: pinHash,
        failedPinAttempts: 0,
        pinLockedUntil: null,
        pinResetAt: new Date().toISOString(),
        pinResetBy: adminEmail,
        updatedAt: new Date().toISOString(),
      };

      // თუ მომხმარებელი არის კლინიკის ადმინი ან ჰქონდა adminPinHash
      if (staff.role === "admin" || staff.adminPinHash) {
        updates.adminPinHash = pinHash;
      }

      await updateDoc(userRef, updates);

      // აუდიტის ჟურნალში ჩაწერა
      await logAdminAudit({
        adminEmail,
        action: "STAFF_PIN_RESET",
        targetType: "user",
        targetId: staff.id,
        targetName: staff.fullName || "თანამშრომელი",
        clinicId: staff.clinicId,
        clinicName: clinicName || "კლინიკა",
        details: `დარესეტდა PIN კოდი: ${staff.fullName} (${getRoleLabel(staff.role)}). განულდა ბრუტფორსის მცდელობები და მოეხსნა დაბლოკვა.`,
        metadata: {
          staffId: staff.id,
          role: staff.role,
        },
      });

      setSuccessPin(cleanPin);
      onSuccess?.(staff.id, cleanPin);
    } catch (err) {
      console.error("Error resetting staff PIN:", err);
      setError("PIN-ის განახლება ვერ მოხერხდა: " + (err.message || "უცნობი შეცდომა"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setPin("");
    setError("");
    setSuccessPin(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-surface rounded-[32px] p-6 md:p-8 shadow-2xl border border-border-main relative overflow-hidden">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-brand-purple" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <KeyRound size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-tight">
                PIN-ის დარესეტება
              </h3>
              <p className="text-xs text-text-muted font-bold">
                {clinicName || "კლინიკა"}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Doctor Info Pill */}
        <div className="mb-6 p-4 rounded-2xl bg-surface-soft border border-border-main flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/15 text-brand-purple font-black text-sm flex items-center justify-center">
            {staff.fullName ? staff.fullName.charAt(0) : "D"}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-text-main truncate">
              {staff.fullName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-md">
                {getRoleLabel(staff.role)}
              </span>
              {staff.phone && (
                <span className="text-[11px] font-bold text-text-muted font-mono">
                  {staff.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successPin ? (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <Check size={24} />
              </div>
              <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                PIN წარმატებით განახლდა!
              </h4>
              <p className="text-xs text-text-muted font-bold mb-4">
                ექიმის ანგარიში განბლოკილია და მზადაა გამოსაყენებლად:
              </p>

              {/* Big PIN Box */}
              <div className="py-4 px-6 bg-surface rounded-2xl border-2 border-emerald-500/30 text-3xl font-black font-mono tracking-[0.4em] text-text-main shadow-inner inline-block">
                {successPin}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-3.5 bg-brand-purple text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={16} /> PIN დაკოპირდა!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> PIN-ის კოპირება
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-6 py-3.5 bg-surface-soft hover:bg-border-main text-text-main rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                დახურვა
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-wider">
                  ახალი 4-ნიშნა PIN
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-[11px] font-black text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  შემთხვევითი PIN
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPin(val);
                    setError("");
                  }}
                  placeholder="მაგ: 1234"
                  className="w-full px-4 py-3.5 rounded-2xl bg-surface-soft border border-border-dark text-text-main text-xl font-mono font-black text-center tracking-[0.4em] focus:outline-none focus:border-brand-purple"
                />
              </div>
              <p className="mt-2 text-[10px] text-text-muted font-bold text-center">
                შეიყვანეთ 4 ციფრი ან დააჭირეთ „შემთხვევითი PIN“-ს
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-soft border border-border-main flex items-center gap-2.5 text-xs text-text-muted font-bold">
              <ShieldCheck size={18} className="text-brand-purple shrink-0" />
              <span>
                დარესეტებისას ავტომატურად განულდება არასწორი მცდელობების რაოდენობა და მოეხსნება ბლოკი.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-surface-soft hover:bg-border-main text-text-main rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4}
                className="flex-1 py-3.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <KeyRound size={16} /> PIN-ის შეცვლა
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorPinResetModal;
