import React, { useState, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import { logActivity } from "../../utils/activityLogger";
import {
  downloadPatientExcelTemplate,
  parseAndValidatePatientExcel,
} from "../../utils/patientExcelUtils";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Trash2,
} from "lucide-react";

const ImportPatientsModal = ({ isOpen, onClose, currentCount = 0, maxPatients = Infinity }) => {
  useLockBodyScroll(isOpen);
  const { userData, activeStaff, role } = useAuth();
  const fileInputRef = useRef(null);

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [limitError, setLimitError] = useState(null);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importSuccessCount, setImportSuccessCount] = useState(null);
  const [importError, setImportError] = useState(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setLimitError(null);
    setImportProgress({ done: 0, total: 0 });
    setImportSuccessCount(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadPatientExcelTemplate();
    } catch (err) {
      console.error("Template download error:", err);
      setImportError("ექსელის ფორმის გენერაცია ვერ მოხერხდა.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const processSelectedFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setValidationResult(null);
    setLimitError(null);
    setImportSuccessCount(null);
    setImportError(null);
    setIsValidating(true);

    try {
      const user = auth.currentUser;
      const clinicId = userData?.clinicId || user?.uid;
      if (!clinicId) {
        setValidationResult({
          validPatients: [],
          errors: [],
          totalRows: 0,
          skippedSampleRow: false,
          fileError: "კლინიკის იდენტიფიკატორი ვერ მოიძებნა.",
        });
        return;
      }

      // Fetch existing personal IDs in this clinic for duplicate prevention
      const existingSnap = await getDocs(
        query(collection(db, "patients"), where("clinicId", "==", clinicId))
      );
      const existingPersonalIds = new Set();
      existingSnap.docs.forEach((d) => {
        const pid = String(d.data()?.personalId || "").replace(/\D/g, "");
        if (pid) existingPersonalIds.add(pid);
      });

      const result = await parseAndValidatePatientExcel(file, existingPersonalIds);
      setValidationResult(result);

      if (
        !result.fileError &&
        result.errors.length === 0 &&
        result.validPatients.length > 0 &&
        maxPatients !== Infinity
      ) {
        const remainingSlots = Math.max(0, maxPatients - currentCount);
        if (result.validPatients.length > remainingSlots) {
          setLimitError(
            `პაკეტის ლიმიტი გადაჭარბებულია: ფაილშია ${result.validPatients.length} პაციენტი, დარჩენილი თავისუფალი ადგილი კი არის ${remainingSlots} (მაქს. ${maxPatients}).`
          );
        }
      }
    } catch (err) {
      console.error("File validation error:", err);
      setValidationResult({
        validPatients: [],
        errors: [],
        totalRows: 0,
        skippedSampleRow: false,
        fileError: "ფაილის შემოწმებისას დაფიქსირდა შეცდომა.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isValidating || isImporting) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const canImport =
    Boolean(validationResult) &&
    !validationResult.fileError &&
    validationResult.errors.length === 0 &&
    validationResult.validPatients.length > 0 &&
    !limitError &&
    !isValidating &&
    !isImporting;

  const handleImportPatients = async () => {
    if (!canImport) return;
    if (role === "doctor" || role === "accountant") {
      setImportError("თქვენს როლს არ აქვს პაციენტების იმპორტის უფლება.");
      return;
    }

    const user = auth.currentUser;
    const clinicId = userData?.clinicId || user?.uid;
    if (!user || !clinicId) {
      setImportError("ავტორიზაცია საჭიროა.");
      return;
    }

    const patientsToImport = validationResult.validPatients;
    setIsImporting(true);
    setImportError(null);
    setImportProgress({ done: 0, total: patientsToImport.length });

    try {
      const BATCH_SIZE = 450;
      const patientsCollectionRef = collection(db, "patients");

      for (let i = 0; i < patientsToImport.length; i += BATCH_SIZE) {
        const chunk = patientsToImport.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((patient) => {
          const newDocRef = doc(patientsCollectionRef);
          batch.set(newDocRef, {
            ...patient,
            clinicId,
            createdAt: serverTimestamp(),
            lastVisit: null,
            appointmentCount: 0,
            status: "active",
          });
        });

        await batch.commit();
        setImportProgress({
          done: Math.min(i + chunk.length, patientsToImport.length),
          total: patientsToImport.length,
        });
      }

      await logActivity(
        clinicId,
        activeStaff || userData || { uid: user.uid, fullName: "Unknown", role: "unknown" },
        "patient_import",
        `ექსელიდან დაიმპორტდა ${patientsToImport.length} პაციენტი (${selectedFile?.name || "import.xlsx"})`,
        { count: patientsToImport.length, fileName: selectedFile?.name || "import.xlsx" }
      );

      setImportSuccessCount(patientsToImport.length);
    } catch (err) {
      console.error("Batch patient import error:", err);
      setImportError("პაციენტების ბაზაში შენახვა ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.");
    } finally {
      setIsImporting(false);
    }
  };

  const hasValidationErrors =
    Boolean(validationResult?.fileError) ||
    Boolean(limitError) ||
    (validationResult?.errors && validationResult.errors.length > 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 font-nino">
      <div
        className="app-overlay fixed inset-0 touch-none animate-in fade-in duration-200"
        onClick={handleClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      <div className="app-sheet relative z-10 w-full max-w-3xl bg-surface rounded-t-[32px] md:rounded-[36px] shadow-2xl border border-border-main flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 overscroll-contain">
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 md:hidden shrink-0" />

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border-main bg-surface-soft/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/20 shrink-0">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-text-main italic tracking-tight">
                პაციენტების იმპორტი (Excel)
              </h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                შაბლონის ჩამოტვირთვა, შემოწმება და ბაზაში ატვირთვა
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isImporting}
            onClick={handleClose}
            className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {importSuccessCount !== null ? (
            <div className="py-12 px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={44} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-text-main italic">
                  იმპორტი წარმატებით დასრულდა!
                </h3>
                <p className="text-sm font-bold text-text-muted">
                  კლინიკის ბაზას დაემატა{" "}
                  <span className="text-emerald-500 font-black">{importSuccessCount}</span> ახალი
                  პაციენტი.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-10 py-4 bg-brand-purple hover:bg-brand-deep text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-purple/20 transition-all cursor-pointer"
              >
                დახურვა
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Template Download */}
              <div className="p-5 md:p-6 bg-surface-soft rounded-[28px] border border-border-main flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple text-[9px] font-black uppercase tracking-widest">
                    ნაბიჯი 1
                  </div>
                  <h3 className="text-sm font-black text-text-main">
                    ჩამოტვირთეთ ოფიციალური ექსელის ფორმა (.xlsx)
                  </h3>
                  <p className="text-xs font-bold text-text-muted leading-relaxed">
                    სავალდებულო ველები:{" "}
                    <span className="text-text-main">
                      სახელი და გვარი *, ტელეფონი *, რეგიონი / ქალაქი *, ფაქტობრივი მისამართი *
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="shrink-0 flex items-center justify-center gap-2.5 px-5 py-3.5 bg-brand-purple hover:bg-brand-deep text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-brand-purple/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingTemplate ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>ექსელის ფორმა</span>
                </button>
              </div>

              {/* Step 2: File Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">
                    ნაბიჯი 2 — შევსებული ფაილის ატვირთვა
                  </div>
                  {selectedFile && !isImporting && (
                    <button
                      type="button"
                      onClick={resetState}
                      className="flex items-center gap-1.5 text-[10px] font-black text-text-muted hover:text-red-500 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} /> გასუფთავება
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="patients-excel-upload"
                  disabled={isValidating || isImporting}
                />

                <label
                  htmlFor="patients-excel-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center p-8 rounded-[28px] border-2 border-dashed transition-all cursor-pointer text-center ${
                    isDragging
                      ? "border-brand-purple bg-brand-purple/10"
                      : selectedFile
                        ? "border-brand-purple/40 bg-surface-soft/70 hover:border-brand-purple"
                        : "border-border-main bg-surface-soft/50 hover:bg-surface-soft hover:border-brand-purple/50"
                  }`}
                >
                  {isValidating ? (
                    <div className="space-y-3 py-2">
                      <Loader2 size={32} className="animate-spin text-brand-purple mx-auto" />
                      <p className="text-xs font-black text-text-main uppercase tracking-widest">
                        ფაილი მოწმდება...
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center mx-auto">
                        <FileCheck2 size={24} />
                      </div>
                      <p className="text-sm font-black text-text-main">{selectedFile.name}</p>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        სხვა ფაილის ასარჩევად დააჭირეთ ან გადმოათრიეთ აქ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-surface text-brand-purple border border-border-main flex items-center justify-center mx-auto shadow-xs">
                        <Upload size={22} />
                      </div>
                      <p className="text-xs font-black text-text-main uppercase tracking-wider">
                        აირჩიეთ ან გადმოათრიეთ .xlsx ფაილი
                      </p>
                      <p className="text-[10px] font-bold text-text-muted">
                        მაქსიმალური ზომა: 5 MB • მაქსიმუმ 1000 ჩანაწერი
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Validation Error Results (All-or-Nothing) */}
              {!isValidating && hasValidationErrors && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                        იმპორტი შეჩერებულია — ფაილში აღმოჩნდა შეცდომები
                      </p>
                      <p className="text-xs font-bold text-text-main leading-relaxed">
                        {validationResult?.fileError ||
                          limitError ||
                          `გთხოვთ გამოასწოროთ ${validationResult.errors.length} შეცდომა ექსელის ფაილში და ატვირთოთ ხელახლა. სრულად სწორი ფაილის გარეშე პაციენტები არ დაემატება.`}
                      </p>
                    </div>
                  </div>

                  {validationResult?.errors?.length > 0 && (
                    <div className="border border-red-500/20 rounded-2xl overflow-hidden bg-surface">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-red-500/10 sticky top-0">
                            <tr>
                              <th className="py-2.5 px-4 font-black text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">
                                სტრიქონი
                              </th>
                              <th className="py-2.5 px-4 font-black text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">
                                ველი
                              </th>
                              <th className="py-2.5 px-4 font-black text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">
                                შეცდომა
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-main">
                            {validationResult.errors.map((err, idx) => (
                              <tr key={idx} className="hover:bg-surface-soft/50">
                                <td className="py-2.5 px-4 font-black text-text-main whitespace-nowrap">
                                  #{err.rowNumber}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-text-muted whitespace-nowrap">
                                  {err.field}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-red-600 dark:text-red-400">
                                  {err.message}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Success & Preview */}
              {!isValidating &&
                validationResult &&
                !hasValidationErrors &&
                validationResult.validPatients.length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            ყველა მონაცემი სწორია!
                          </p>
                          <p className="text-xs font-bold text-text-main">
                            მზადაა იმპორტისთვის: {validationResult.validPatients.length} პაციენტი
                          </p>
                        </div>
                      </div>
                      {validationResult.skippedSampleRow && (
                        <span className="px-3 py-1 rounded-full bg-surface text-text-muted border border-border-main text-[10px] font-bold">
                          სანიმუშო სტრიქონი გამოტოვებულია
                        </span>
                      )}
                    </div>

                    <div className="border border-border-main rounded-2xl overflow-hidden bg-surface">
                      <div className="px-4 py-2.5 bg-surface-soft/60 border-b border-border-main flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          წინასწარი ნახვა
                        </span>
                        {validationResult.validPatients.length > 10 && (
                          <span className="text-[10px] font-bold text-text-muted">
                            ნაჩვენებია პირველი 10 / {validationResult.validPatients.length}
                          </span>
                        )}
                      </div>
                      <div className="max-h-56 overflow-y-auto overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs min-w-[600px]">
                          <thead className="bg-surface-soft/40 border-b border-border-main">
                            <tr>
                              <th className="py-2.5 px-4 text-[10px] font-black uppercase text-text-muted">
                                სახელი და გვარი
                              </th>
                              <th className="py-2.5 px-4 text-[10px] font-black uppercase text-text-muted">
                                ტელეფონი
                              </th>
                              <th className="py-2.5 px-4 text-[10px] font-black uppercase text-text-muted">
                                პირადი ნომერი
                              </th>
                              <th className="py-2.5 px-4 text-[10px] font-black uppercase text-text-muted">
                                მისამართი
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-main">
                            {validationResult.validPatients.slice(0, 10).map((p, idx) => (
                              <tr key={idx} className="hover:bg-surface-soft/40">
                                <td className="py-2.5 px-4 font-black text-text-main">
                                  {p.fullName}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-text-main whitespace-nowrap">
                                  {p.phone}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-text-muted">
                                  {p.personalId || "—"}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-text-muted truncate max-w-[220px]">
                                  {p.actualRegion}, {p.actualResidenceAddress}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              {importError && (
                <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 text-xs font-bold text-red-600 dark:text-red-400">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {importSuccessCount === null && (
          <div className="p-6 md:px-8 border-t border-border-main bg-surface-soft/50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isImporting}
              onClick={handleClose}
              className="px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-text-muted hover:bg-surface border border-transparent hover:border-border-main transition-all cursor-pointer disabled:opacity-40"
            >
              გაუქმება
            </button>

            <button
              type="button"
              disabled={!canImport}
              onClick={handleImportPatients}
              className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    იტვირთება ({importProgress.done}/{importProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>
                    პაციენტების იმპორტი
                    {canImport ? ` (${validationResult.validPatients.length})` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPatientsModal;
