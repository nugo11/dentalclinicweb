import React from "react";
import { X, Building2, Mail, Phone, Calendar, Package, Users, Shield, Globe, MapPin, CheckCircle2, AlertOctagon, Trash2 } from "lucide-react";
import { getRoleLabel } from "../../utils/roleUtils";

const ClinicDetailsModal = ({ clinic, staffList = [], inventoryItems = [], isOpen, onClose, onToggleStatus, onSelectStaffPin, onSelectClinicInventory, onDeleteClinic }) => {
  if (!isOpen || !clinic) return null;

  const isSuspended = clinic.subscriptionStatus === "suspended";
  const clinicStaff = staffList.filter((s) => s.clinicId === clinic.id);
  const clinicInventory = inventoryItems.filter((i) => i.clinicId === clinic.id);
  const totalInventoryValue = clinicInventory.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.pricePerUnit || 0)), 0);

  const formattedDate = clinic.createdAt
    ? new Date(clinic.createdAt).toLocaleDateString("ka-GE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "უცნობია";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-2xl w-full max-h-[90vh] bg-surface rounded-[36px] shadow-2xl border border-border-main flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border-main flex items-center justify-between shrink-0 bg-surface-soft/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shadow-sm">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-text-main tracking-tight">
                  {clinic.clinicName || "კლინიკა"}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isSuspended
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  {isSuspended ? "გათიშული" : "აქტიური"}
                </span>
              </div>
              <p className="text-xs text-text-muted font-bold mt-0.5">
                @{clinic.loginName || "login"} • რეგისტრირებულია: {formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-text-muted hover:text-text-main hover:bg-surface-soft transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface-soft border border-border-main text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">ტარიფი</p>
              <p className="text-sm font-black text-brand-purple uppercase mt-1">
                {clinic.plan || "Free"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-soft border border-border-main text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">პერსონალი</p>
              <p className="text-sm font-black text-text-main mt-1">
                {clinicStaff.length} თანამშრომელი
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-soft border border-border-main text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">საწყობი</p>
              <p className="text-sm font-black text-text-main mt-1">
                {clinicInventory.length} ერთეული
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-soft border border-border-main text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">ღირებულება</p>
              <p className="text-sm font-black text-emerald-500 mt-1">
                {totalInventoryValue.toLocaleString()} ₾
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-surface-soft rounded-2xl p-5 border border-border-main space-y-3">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">
              საკონტაქტო და სისტემური ინფორმაცია
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-text-muted">
                <Mail size={16} className="text-brand-purple shrink-0" />
                <span className="font-bold text-text-main truncate">
                  {clinic.ownerEmail || "ელ-ფოსტა არ არის"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-muted">
                <Phone size={16} className="text-brand-purple shrink-0" />
                <span className="font-bold text-text-main">
                  {clinic.phone || clinic.contactPhone || "ტელეფონი არ არის"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-muted">
                <MapPin size={16} className="text-brand-purple shrink-0" />
                <span className="font-bold text-text-main">
                  {clinic.address || clinic.city || "მისამართი არ არის"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-muted">
                <Globe size={16} className="text-brand-purple shrink-0" />
                <span className="font-bold text-text-main">
                  საჯარო კატალოგი: {clinic.isPublic ? "ჩართულია" : "გამორთულია"}
                </span>
              </div>
            </div>
          </div>

          {/* Staff Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Users size={16} /> კლინიკის ექიმები და პერსონალი ({clinicStaff.length})
              </h4>
            </div>

            {clinicStaff.length === 0 ? (
              <p className="text-xs text-text-muted font-bold p-4 bg-surface-soft rounded-2xl border border-border-main text-center">
                ამ კლინიკაში პერსონალი ჯერ არ არის დამატებული
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {clinicStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3 bg-surface-soft rounded-2xl border border-border-main flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-brand-purple/10 text-brand-purple font-black flex items-center justify-center shrink-0">
                        {staff.fullName ? staff.fullName.charAt(0) : "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-text-main truncate">
                          {staff.fullName}
                        </p>
                        <p className="text-[10px] font-bold text-text-muted">
                          {getRoleLabel(staff.role)} • {staff.phone || staff.email || "—"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectStaffPin?.(staff, clinic.clinicName);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white font-black text-[11px] tracking-wider uppercase transition-all shrink-0 cursor-pointer"
                    >
                      PIN-ის შეცვლა
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-main flex flex-wrap items-center justify-between gap-3 shrink-0 bg-surface-soft/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onSelectClinicInventory?.(clinic.id);
              }}
              className="px-4 py-3 bg-surface border border-border-dark text-text-main hover:border-brand-purple rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package size={16} /> საწყობის ნახვა
            </button>

            <button
              onClick={() => {
                onClose();
                onDeleteClinic?.(clinic);
              }}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              title="კლინიკის სრული წაშლა"
            >
              <Trash2 size={16} /> წაშლა
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onToggleStatus?.(clinic);
            }}
            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              isSuspended
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
            }`}
          >
            {isSuspended ? (
              <>
                <CheckCircle2 size={16} /> კლინიკის ჩართვა
              </>
            ) : (
              <>
                <AlertOctagon size={16} /> კლინიკის გათიშვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailsModal;
