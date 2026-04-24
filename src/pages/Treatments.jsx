import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import OrderCompletionModal from "../components/Finance/OrderCompletionModal";
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Inbox,
  Search,
} from "lucide-react";

const Treatments = () => {
  const { userData, role, activeStaff } = useAuth();
  const isReadOnly = role === 'accountant';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ძებნის სტეიტი
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const clinicId = userData?.clinicId || user.uid;

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", clinicId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // ფილტრაცია როლის მიხედვით:
      // ექიმი ხედავს მხოლოდ თავისას, სხვები (ადმინი, მენეჯერი, ბუღალტერი, რეგისტრატორი) ხედავენ ყველასას
      const activeOrders = data.filter((order) => {
        const isNotFinalized = order.status !== "completed_and_billed" && order.status !== "cancelled";
        if (role === 'doctor') {
          return isNotFinalized && order.doctorId === (activeStaff?.id || userData?.uid);
        }
        return isNotFinalized;
      });

      // სორტირება: უახლესი ჯავშნები (თარიღით) იყოს თავში
      const sortedData = activeOrders.sort(
        (a, b) => new Date(b.start) - new Date(a.start),
      );
      setOrders(sortedData);
    });

    return () => unsubscribe();
  }, [refreshTrigger, userData?.clinicId]);

  // ძებნის ფილტრაცია კოდის დონეზე (ოპტიმიზირებული useMemo-თი)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.patientName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [orders, searchTerm]);

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);

    if (selectedOrder) {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== selectedOrder.id),
      );
    }

    setSelectedOrder(null);
    setRefreshTrigger((prev) => prev + 1);
  }, [selectedOrder]);

  return (
    <>
      <Helmet>
        <title>შეკვეთები — DentalHub</title>
      </Helmet>
      <div className="h-screen w-full bg-surface-soft flex overflow-hidden font-nino text-text-main">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header & Search Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-text-main italic tracking-tighter">
                  შეკვეთების მართვა
                </h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  ნაპოვნია: {filteredOrders.length}
                </p>
              </div>

              {/* Search Input Bar */}
              <div className="relative w-full md:w-80 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="მოძებნე პაციენტი..."
                  className="w-full bg-surface border border-border-main rounded-[24px] py-4 pl-12 pr-6 outline-none shadow-sm focus:ring-2 ring-brand-purple/20 focus:border-brand-purple transition-all font-bold text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="grid gap-4 pb-10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isPending =
                    !order.billedServices || order.billedServices.length === 0;

                  return (
                    <div
                      key={order.id}
                      className="bg-surface p-8 rounded-[40px] border border-border-main shadow-sm flex flex-col md:flex-row items-center justify-between group hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="flex items-center gap-8 w-full md:w-auto">
                        <div
                          className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-500 ${
                            isPending
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {isPending ? (
                            <Clock size={28} className="animate-pulse" />
                          ) : (
                            <CheckCircle2 size={28} />
                          )}
                        </div>

                          <div className="space-y-1">
                            <h4 className="font-black text-text-main text-xl italic tracking-tight uppercase">
                              {order.patientName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-4">
                              <span
                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                  order.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }`}
                              >
                                {order.status === "completed"
                                  ? "ვიზიტი დასრულებულია"
                                  : "ჩანიშნული ვიზიტი"}
                              </span>
                              <span className="text-[10px] text-brand-purple font-black uppercase tracking-widest">
                                👨‍⚕️ {order.doctorName || "ექიმი უცნობია"}
                              </span>
                              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest italic">
                                {new Date(order.start).toLocaleDateString(
                                  "ka-GE",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                        {(() => {
                          const canFinalize = 
                            role === 'admin' || 
                            role === 'manager' || 
                            role === 'receptionist' || 
                            (role === 'doctor' && order.doctorId === (activeStaff?.id || userData?.uid));
                          
                          const btnReadOnly = !canFinalize;

                          return (
                            <button
                              onClick={() => handleOpenModal(order)}
                              className={`flex-1 md:flex-none px-8 py-4 ${btnReadOnly ? 'bg-surface-soft text-text-muted' : 'bg-brand-purple text-white'} rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-lg ${btnReadOnly ? '' : 'shadow-brand-purple/20 hover:bg-brand-deep'} transition-all flex items-center justify-center gap-3 cursor-pointer`}
                            >
                              {btnReadOnly ? <FileText size={18} /> : <Plus size={18} />}
                              {btnReadOnly ? 'ნახვა' : 'გაფორმება'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-24 bg-surface rounded-[40px] border-2 border-dashed border-border-main flex flex-col items-center justify-center opacity-40">
                  <div className="w-20 h-20 bg-surface-soft rounded-full flex items-center justify-center mb-4 text-text-muted">
                    <Inbox size={40} />
                  </div>
                  <p className="font-black text-xs uppercase tracking-[0.3em]">
                    {searchTerm
                      ? "პაციენტი ვერ მოიძებნა"
                      : "ამჟამად შეკვეთები არ არის"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedOrder && (
        <OrderCompletionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          orderData={selectedOrder}
        />
      )}
    </div>
    </>
  );
};

export default Treatments;
