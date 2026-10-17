import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { Wallet, History, Search, Filter, Download, ArrowLeft, Edit, X, Loader2, Printer, FileDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logActivity } from "../utils/activityLogger";

const SalaryArchive = () => {
  const { userData, isAdmin, role, clinicData, activeStaff } = useAuth();
  const navigate = useNavigate();
  // ... (states remain same)

  const [printingId, setPrintingId] = useState(null);

  const handlePrint = async (h) => {
    setPrintingId(h.id);
    const content = `
      <html>
        <head>
          <title>ქვითარი - ${h.description}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; line-height: 1.5; }
            .card { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 24px; position: relative; }
            .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo-img { height: 50px; object-fit: contain; }
            .clinic-legal { font-size: 10px; color: #64748b; margin-top: 5px; }
            .title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
            .item { margin-bottom: 20px; }
            .label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 700; color: #0f172a; }
            .amount-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 30px; display: flex; justify-content: space-between; align-items: center; position: relative; }
            .stamp { display: block; margin-top: 30px; margin-left: auto; width: 150px; height: 150px; object-fit: contain; transform: rotate(-5deg); pointer-events: none; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
            @media print { .card { border: none; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="clinic-branding">
                ${clinicData?.logoUrl ? `<img src="${clinicData.logoUrl}" class="logo-img" />` : `<div style="font-weight:900; font-size:20px; color:#6366f1;">${clinicData?.clinicName || 'AiDent'}</div>`}
                <div class="clinic-legal">
                  ${clinicData?.legalName ? `<div>${clinicData.legalName}</div>` : ''}
                  ${clinicData?.idCode ? `<div>ს/კ: ${clinicData.idCode}</div>` : ''}
                </div>
              </div>
              <div class="title text-right">ხელფასის ამონაწერი</div>
            </div>
            <div class="item">
              <div class="label">თანამშრომელი</div>
              <div class="value">${h.description?.replace('ხელფასი: ', '')}</div>
            </div>
            <div class="item">
              <div class="label">თარიღი და პერიოდი</div>
              <div class="value">${new Date(h.date).toLocaleDateString('ka-GE')} (${h.paidMonth || 'მიმდინარე'})</div>
            </div>
            <div class="amount-box">
              <div class="label" style="margin:0">გადახდილი თანხა</div>
              <div class="value" style="font-size: 24px; color: #10b981;">${h.amount} ₾</div>
            </div>

            ${clinicData?.stampUrl ? `<img src="${clinicData.stampUrl}" class="stamp" />` : ''}

            <div class="footer">დოკუმენტი გენერირებულია ავტომატურად</div>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
            }
          </script>
        </body>
      </html>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    pri.document.open();
    pri.document.write(content);
    pri.document.close();

    return new Promise((resolve) => {
      setTimeout(() => {
        document.body.removeChild(iframe);
        setPrintingId(null);
        resolve();
      }, 1500);
    });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editTarget, setEditTarget] = useState(null);
  const [newAmount, setNewAmount] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [payModal, setPayModal] = useState({ isOpen: false, staffId: "", amount: "" });
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!userData?.clinicId) return;
    const qStaff = query(
      collection(db, "users"),
      where("clinicId", "==", userData.clinicId)
    );
    const unsub = onSnapshot(qStaff, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.role !== 'admin');
      setStaffList(list);
    });
    return () => unsub();
  }, [userData?.clinicId]);

  useEffect(() => {
    if (!userData?.clinicId) return;

    const q = query(
      collection(db, "finance"),
      where("clinicId", "==", userData.clinicId),
      where("category", "==", "ხელფასი")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // სორტირება კლიენტის მხარეს
      setHistory(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleUpdateAmount = async () => {
    if (!editTarget) return;
    if (isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი თანხა");
      return;
    }

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "finance", editTarget.id), {
        amount: Number(newAmount)
      });
      
      // LOG ACTIVITY
      await logActivity(
        userData?.clinicId, 
        activeStaff || userData || { uid: auth.currentUser?.uid, fullName: 'Unknown', role: 'unknown' }, 
        'salary_update', 
        `შეიცვალა ხელფასის თანხა (${editTarget.description}): ${editTarget.amount}₾ -> ${newAmount}₾`, 
        { salaryId: editTarget.id, oldAmount: editTarget.amount, newAmount: Number(newAmount) }
      );
      
      // მყისიერი განახლება ლოკალურ სთეითში უკეთესი UX-სთვის
      setHistory(prev => prev.map(item => 
        item.id === editTarget.id ? { ...item, amount: Number(newAmount) } : item
      ));
      
      setEditTarget(null);
    } catch (error) {
      console.error("Error updating salary:", error);
      alert("ჩასწორება ვერ მოხერხდა");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIssueSalary = async (e) => {
    e.preventDefault();
    const targetStaff = staffList.find(s => s.id === payModal.staffId);
    if (!targetStaff) return;
    const amt = Number(payModal.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("გთხოვთ შეიყვანოთ ვალიდური თანხა");
      return;
    }
    setIsPaying(true);
    try {
      const docRef = await addDoc(collection(db, "finance"), {
        clinicId: userData.clinicId,
        type: 'expense',
        category: 'ხელფასი',
        amount: amt,
        description: `ხელფასი: ${targetStaff.fullName} (${targetStaff.salaryType === 'commission' ? 'გამომუშავება' : 'ფიქსირებული'})`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        staffId: targetStaff.id,
        paidMonth: new Date().toISOString().slice(0, 7)
      });
      await logActivity(
        userData.clinicId,
        activeStaff || userData,
        'salary_payment',
        `გაიცა ხელფასი: ${targetStaff.fullName} (თანხა: ${amt}₾)`,
        { financeId: docRef.id, staffId: targetStaff.id, amount: amt }
      );
      setPayModal({ isOpen: false, staffId: "", amount: "" });
    } catch (err) {
      console.error(err);
      alert("ხელფასის გაცემა ვერ მოხერხდა");
    } finally {
      setIsPaying(false);
    }
  };

  const filteredHistory = history.filter(h => 
    h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.paidMonth?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(h.date).toLocaleDateString('ka-GE', { month: 'long' }).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>ხელფასების არქივი — AiDent</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 hover:text-brand-purple transition-colors"
                >
                  <ArrowLeft size={14} /> უკან დაბრუნება
                </button>
                <h1 className="text-3xl font-black text-text-main italic tracking-tighter">ხელფასების არქივი</h1>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1 italic">
                  გაცემული ხელფასების სრული ისტორია
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative group w-full sm:w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder="ძებნა (სახელი ან თვე)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-surface border border-border-main rounded-2xl outline-none font-bold text-sm shadow-sm focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/5 transition-all"
                  />
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      const first = staffList[0];
                      setPayModal({
                        isOpen: true,
                        staffId: first?.id || "",
                        amount: first?.salaryAmount ? first.salaryAmount.toString() : ""
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                  >
                    <Plus size={16} /> ხელფასის გაცემა
                  </button>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-[40px] border border-border-main shadow-sm overflow-hidden">
              <div className="p-8 border-b border-border-main flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <h3 className="text-xl font-black text-text-main italic">ტრანზაქციების ისტორია</h3>
                </div>
                <span className="px-4 py-2 bg-surface-soft rounded-xl text-[10px] font-black uppercase text-text-muted tracking-widest border border-border-main italic">
                  სულ: {filteredHistory.length} ჩანაწერი
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-soft/50">
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">თანამშრომელი / აღწერა</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">თარიღი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest">პერიოდი</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest text-right">თანხა</th>
                      <th className="p-6 text-[10px] font-black uppercase text-text-muted tracking-widest text-center">მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-text-muted uppercase font-black text-[10px] tracking-widest">
                           იტვირთება...
                        </td>
                      </tr>
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-surface-soft/50 transition-colors group">
                          <td className="p-6">
                            <h5 className="font-bold text-text-main">{h.description?.replace('ხელფასი: ', '')}</h5>
                            <p className="text-[9px] text-text-muted uppercase font-black mt-0.5 tracking-tighter">
                               ხელფასის გაცემა
                            </p>
                          </td>
                          <td className="p-6 text-sm font-medium text-text-muted italic">
                            {new Date(h.date).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-brand-purple/5 text-brand-purple text-[10px] font-black rounded-lg uppercase tracking-widest">
                               {h.paidMonth || new Date(h.date).toISOString().slice(0, 7)}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <p className="text-lg font-black text-emerald-500 italic">
                               ₾ {Number(h.amount).toLocaleString()}
                            </p>
                          </td>
                          <td className="p-6">
                             <div className="flex items-center justify-center gap-2">
                                <button 
                                 disabled={printingId === h.id}
                                 onClick={() => handlePrint(h)}
                                 className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all disabled:opacity-50"
                                 title="ბეჭდვა"
                                >
                                   {printingId === h.id ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                                </button>
                                <button 
                                 disabled={printingId === h.id}
                                 onClick={() => handlePrint(h)}
                                 className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all disabled:opacity-50"
                                 title="PDF ჩამოტვირთვა"
                                >
                                   {printingId === h.id ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
                                </button>
                               {isAdmin && (
                                 <button 
                                  onClick={() => {
                                    setEditTarget(h);
                                    setNewAmount(h.amount.toString());
                                  }}
                                  className="p-2 text-text-muted hover:text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all"
                                  title="თანხის ჩასწორება"
                                 >
                                    <Edit size={16} />
                                 </button>
                               )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="p-20 text-center text-text-muted uppercase font-black text-[10px] tracking-widest">
                           ჩანაწერები არ მოიძებნა
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Amount Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md" onClick={() => setEditTarget(null)} />
          <div className="bg-surface rounded-[40px] w-full max-w-sm p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-brand-purple/10 text-brand-purple rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Edit size={40} />
                </div>
                <h3 className="text-2xl font-black text-text-main italic tracking-tighter">თანხის ჩასწორება</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">
                   {editTarget.description?.replace('ხელფასი: ', '')}
                </p>
             </div>

             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-4">ახალი ოდენობა (₾)</label>
                   <input 
                      type="number" 
                      autoFocus
                      className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-6 py-5 outline-none font-black text-xl text-text-main transition-all"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                      onClick={() => setEditTarget(null)}
                      className="py-5 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-soft transition-all"
                   >
                      გაუქმება
                   </button>
                   <button 
                      onClick={handleUpdateAmount}
                      disabled={isUpdating}
                      className="py-5 bg-brand-purple text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:bg-brand-deep transition-all flex items-center justify-center"
                   >
                      {isUpdating ? <Loader2 className="animate-spin" size={18} /> : "შენახვა"}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Issue Salary Modal */}
      {payModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="app-overlay fixed inset-0 touch-none" onClick={() => setPayModal({ isOpen: false, staffId: "", amount: "" })} />
          <div className="bg-surface rounded-[40px] w-full max-w-md p-8 sm:p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-main italic">ხელფასის გაცემა</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">ახალი ტრანზაქცია</p>
                </div>
              </div>
              <button onClick={() => setPayModal({ isOpen: false, staffId: "", amount: "" })} className="p-2 text-text-muted hover:text-text-main cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueSalary} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">თანამშრომელი</label>
                <select
                  value={payModal.staffId}
                  onChange={(e) => {
                    const sel = staffList.find(s => s.id === e.target.value);
                    setPayModal({
                      ...payModal,
                      staffId: e.target.value,
                      amount: sel?.salaryAmount ? sel.salaryAmount.toString() : ""
                    });
                  }}
                  className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-5 py-4 outline-none font-bold text-sm text-text-main cursor-pointer"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.salaryType === 'commission' ? 'გამომუშავება' : `₾${s.salaryAmount ?? 0}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">თანხა (₾)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={payModal.amount}
                  onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })}
                  className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-2xl px-5 py-4 outline-none font-black text-xl text-text-main transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModal({ isOpen: false, staffId: "", amount: "" })}
                  className="py-4 bg-surface-soft text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isPaying || !payModal.amount}
                  className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="animate-spin mx-auto" size={18} /> : "გაცემა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default SalaryArchive;
