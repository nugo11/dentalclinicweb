import React, { useState } from "react";
import { 
  X, AlertTriangle, Trash2, Loader2, ShieldAlert, 
  Building2, CheckCircle2, Lock, AlertOctagon, Info
} from "lucide-react";
import { deleteClinicPermanently } from "../../utils/deleteClinicCascade";

const ClinicDeleteModal = ({ 
  clinic, 
  isOpen, 
  onClose, 
  superAdminEmail, 
  onSuccess 
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !clinic) return null;

  const targetConfirm = (clinic.loginName || clinic.id || "").toLowerCase().trim();
  const isMatch = confirmInput.toLowerCase().trim() === targetConfirm;

  const handleDelete = async () => {
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg("");
    setProgressStep("პროცესის ინიციალიზაცია...");

    try {
      const result = await deleteClinicPermanently(
        clinic, 
        superAdminEmail, 
        (step) => setProgressStep(step)
      );

      setIsDeleting(false);
      onClose();
      onSuccess?.(result);
    } catch (err) {
      console.error("Clinic delete error:", err);
      setIsDeleting(false);
      setErrorMsg(err.message || "კლინიკის წაშლისას დაფიქსირდა შეცდომა.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 font-nino">
      <div className="max-w-lg w-full bg-surface rounded-[36px] shadow-2xl border border-red-500/30 flex flex-col overflow-hidden text-text-main animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-red-500/10 border-b border-red-500/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
              <Trash2 size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-600 font-black text-[10px] uppercase tracking-wider mb-1">
                <AlertOctagon size={12} /> შეუქცევადი ქმედება
              </div>
              <h2 className="text-xl font-black text-text-main tracking-tight">
                კლინიკის სამუდამო წაშლა
              </h2>
              <p className="text-xs text-text-muted font-bold mt-0.5">
                {clinic.clinicName || "კლინიკა"} (@{clinic.loginName || clinic.id})
              </p>
            </div>
          </div>

          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Warning Message Box */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-border-main space-y-2 text-xs">
            <p className="font-black text-text-main uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-500" />
              სისტემიდან სრულად წაიშლება:
            </p>
            <ul className="space-y-1.5 text-text-muted font-bold pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <strong>კლინიკის პროფილი და კონფიგურაცია</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <strong>Firebase Authentication ანგარიში ({clinic.ownerEmail || "მფლობელის მეილი"})</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                ყველა პაციენტი, სამედიცინო ისტორია და რენტგენები
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                ვიზიტების კალენდარი, ჯავშნები და მკურნალობები
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                საწყობი, მასალების ნაშთები და მომსახურებები
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                ფინანსური ტრანზაქციები და ხელფასების ისტორია
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                ექიმებისა და პერსონალის ანგარიშები
              </li>
            </ul>
          </div>

          {/* Progress Indicator when Deleting */}
          {isDeleting ? (
            <div className="p-6 rounded-2xl bg-surface-soft border border-border-main text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-red-500" />
              <p className="font-black text-xs text-text-main uppercase tracking-wider">
                მიმდინარეობს მონაცემების გასუფთავება...
              </p>
              <p className="text-xs text-text-muted font-bold animate-pulse">
                {progressStep}
              </p>
            </div>
          ) : (
            /* Security Confirmation Input */
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black text-text-main block">
                დასადასტურებლად ჩაწერეთ კლინიკის ლოგინი:{" "}
                <span className="text-red-500 font-mono font-black">{targetConfirm}</span>
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`ჩაწერეთ: ${targetConfirm}`}
                className="w-full px-4 py-3 rounded-2xl bg-surface-soft border-2 border-border-dark focus:border-red-500 text-text-main font-mono text-sm font-bold outline-none transition-all"
                autoFocus
              />
              <p className="text-[10px] text-text-muted font-bold">
                ღილაკი გააქტიურდება მხოლოდ ზუსტი ლოგინის შეყვანის შემდეგ.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-main flex items-center justify-end gap-3 bg-surface-soft/40">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-3 rounded-2xl bg-surface border border-border-dark text-text-muted hover:text-text-main font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            გაუქმება
          </button>

          <button
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
              isMatch && !isDeleting
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:scale-[1.02]"
                : "bg-red-500/30 cursor-not-allowed opacity-60"
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>იშლება...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>სამუდამოდ წაშლა</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDeleteModal;
