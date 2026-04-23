import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import kaLocale from "@fullcalendar/core/locales/ka"; // ქართული ენის იმპორტი
import Sidebar from "../components/Dashboard/Sidebar";
import TopNav from "../components/Dashboard/TopNav";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import AddAppointmentModal from "../components/Dashboard/AddAppointmentModal";
import EditAppointmentModal from "../components/Dashboard/EditAppointmentModal";

const CalendarPage = () => {
  const { userData, role, activeStaff } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!userData || !userData.clinicId) return;

    let unsub;
    let isMounted = true;

    const fetchGlobalAppointments = async () => {
      try {
        // 1. ჯერ გავიგოთ ამ კლინიკის ყველა ექიმის ID
        const doctorsQuery = query(
          collection(db, "users"),
          where("clinicId", "==", userData.clinicId),
          where("role", "==", "doctor")
        );
        const doctorsSnap = await getDocs(doctorsQuery);
        
        if (!isMounted) return;

        const doctorIds = doctorsSnap.docs.map(d => d.id);

        if (doctorIds.length === 0 && role !== "admin") {
          setEvents([]);
          return;
        }

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        let q;
        if (role === "doctor") {
          q = query(
            collection(db, "appointments"),
            where("doctorId", "==", activeStaff?.id || userData?.uid)
          );
        } else if (doctorIds.length > 0) {
          if (doctorIds.length > 30) {
              q = query(
                collection(db, "appointments"),
                where("clinicId", "==", userData.clinicId)
              );
          } else {
              q = query(
                collection(db, "appointments"),
                where("doctorId", "in", doctorIds)
              );
          }
        } else {
          q = query(
            collection(db, "appointments"),
            where("clinicId", "==", userData.clinicId)
          );
        }

        unsub = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

          const allEvents = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter(data => new Date(data.start) >= twoMonthsAgo) // კლიენტის მხარეს ფილტრაცია
            .map((data) => {
              const isInternal = data.clinicId === userData.clinicId;
              const startDate = new Date(data.start);
              const endDate = new Date(data.end);

              let title = "";
              let backgroundColor = data.color || "#7C3AED";
              
              if (isInternal) {
                title = (role === "admin" || role === "receptionist") && data.doctorName 
                  ? `${data.patientName} - ${data.doctorName}` 
                  : data.patientName;
              } else {
                title = data.doctorName ? `დაკავებულია (${data.doctorName})` : "დაკავებულია (სხვა კლინიკა)";
                backgroundColor = "#94A3B8"; 
              }

              return {
                id: data.id,
                title,
                start: startDate,
                end: endDate,
                backgroundColor,
                borderColor: "transparent",
                allDay: false,
                extendedProps: { ...data, isInternal },
              };
            });
          setEvents(allEvents);
        });
      } catch (err) {
        console.error("Firestore error:", err);
      }
    };

    fetchGlobalAppointments();
    
    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [userData, role, activeStaff]);

  const canBookPast = role === "admin";

  const handleDateSelection = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today && !canBookPast) {
      // არაფერს ვაკეთებთ თუ წარსულია და არ არის ადმინი
      return;
    }

    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-nino">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center text-brand-purple">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-brand-deep italic tracking-tighter">
                    განრიგი
                  </h1>
                  <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">
                    ვიზიტების მართვა
                  </p>
                </div>
              </div>

              {role !== 'manager' && (
                <button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-3 bg-brand-purple text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl shadow-xl shadow-brand-purple/20 hover:bg-brand-deep transition-all active:scale-95 w-full sm:w-auto"
                >
                  <Plus size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    ჩანიშვნა
                  </span>
                </button>
              )}
            </div>

            {/* კალენდრის კონტეინერი */}
            <div className="flex-1 bg-white rounded-[28px] sm:rounded-[40px] p-3 sm:p-6 border border-gray-200 shadow-sm overflow-hidden calendar-container">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
                locales={[kaLocale]} 
                locale="ka"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: isMobile ? "timeGridDay,dayGridMonth" : "timeGridDay,timeGridWeek,dayGridMonth",
                }}
                eventDisplay="block"
                events={events}
                slotMinTime="00:00:00" 
                slotMaxTime="24:00:00" 
                scrollTime={`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:00`}
                initialDate={new Date()} 
                slotDuration="00:30:00" 
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                allDaySlot={false}
                height="100%"
                selectable={true}
                nowIndicator={true}
                expandRows={true}
                stickyHeaderDates={true}
                eventClick={(info) => {
                  setSelectedAppointment({
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.start,
                    end: info.event.end,
                    extendedProps: info.event.extendedProps,
                  });
                  setIsEditModalOpen(true);
                }}
                dateClick={(info) => {
                  handleDateSelection(info.date);
                }}
                select={(info) => {
                  handleDateSelection(info.start);
                }}
              />
            </div>
          </div>

          <AddAppointmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedDate}
          />
          <EditAppointmentModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            appointmentData={selectedAppointment}
          />
        </main>
      </div>

      <style>{`
        .calendar-container .fc { 
          --fc-border-color: #E2E8F0; 
          --fc-today-bg-color: #F8FAFC; 
          --fc-now-indicator-color: #FF0000; 
          font-family: 'nino', sans-serif; 
        }

        /* მიმდინარე დროის ხაზის გაძლიერება */
        .calendar-container .fc-timegrid-now-indicator-line {
          border-width: 3px !important;
          z-index: 5;
        }
        
        .calendar-container .fc-timegrid-now-indicator-arrow {
          border-width: 6px !important;
          border-left-color: #FF0000 !important;
          margin-top: -5px !important;
        }

        .calendar-container .fc-timegrid-now-indicator-line::before {
          content: '';
          position: absolute;
          left: -8px;
          top: -5px;
          width: 10px;
          height: 10px;
          background: #FF0000;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* უჯრების გამოკვეთა - კონტურული სტილი */
        .calendar-container .fc-timegrid-slot {
          border-bottom: 1px solid #CBD5E1 !important; /* უფრო მუქი კონტური */
        }
        
        .calendar-container .fc-timegrid-slot-minor {
          border-bottom: 1px solid #E2E8F0 !important;
        }

        .calendar-container .fc-timegrid-slot:hover {
          background-color: #F8FAFC !important;
          cursor: cell;
        }

        .calendar-container .fc-timegrid-col {
          border-left: 1.5px solid #CBD5E1 !important;
        }

        .calendar-container .fc-daygrid-day {
          border: 1px solid #CBD5E1 !important;
        }
        
        .calendar-container .fc-header-toolbar { margin-bottom: 1rem !important; gap: 0.5rem; flex-wrap: wrap; }
        .calendar-container .fc-toolbar-title { font-size: 1rem !important; font-weight: 900 !important; color: #1E293B; font-style: italic; }
        
        .calendar-container .fc-button { 
          background: #F1F5F9 !important; 
          border: none !important; 
          color: #475569 !important; 
          font-weight: 800 !important; 
          font-size: 11px !important; 
          text-transform: uppercase !important; 
          letter-spacing: 0.05em !important; 
          padding: 0.45rem 0.75rem !important; 
          border-radius: 12px !important; 
          transition: all 0.2s; 
          box-shadow: none !important;
        }
        .calendar-container .fc-button:hover { background: #E2E8F0 !important; color: #1E293B !important; }
        .calendar-container .fc-button-active { background: #7C3AED !important; color: white !important; }
        
        .calendar-container .fc-timegrid-axis { background-color: #F8FAFC; border-right: 2px solid #E2E8F0; }
        .calendar-container .fc-timegrid-slot-label-cushion { font-weight: 900 !important; color: #64748B; font-size: 11px; padding: 4px 8px !important; }
        
        .calendar-container .fc-event { 
          border-radius: 8px !important; 
          padding: 4px 6px !important; 
          font-size: 10px !important; 
          font-weight: 800 !important; 
          border: none !important; 
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05) !important;
          transition: transform 0.1s;
        }

        .calendar-container .fc-daygrid-event {
          margin-top: 2px !important;
          margin-bottom: 2px !important;
        }
        
        .calendar-container .fc-daygrid-event-dot {
          border-color: #7C3AED !important;
        }

        .calendar-container .fc-event:hover { transform: scale(1.02); z-index: 10; cursor: pointer; }
        
        .calendar-container .fc-col-header-cell-cushion { font-weight: 900 !important; color: #1E293B; text-transform: uppercase; font-size: 10px; padding: 8px 0 !important; }
        @media (min-width: 768px) {
          .calendar-container .fc-header-toolbar { margin-bottom: 2rem !important; }
          .calendar-container .fc-toolbar-title { font-size: 1.25rem !important; }
          .calendar-container .fc-button { padding: 0.6rem 1rem !important; }
          .calendar-container .fc-col-header-cell-cushion { font-size: 11px; padding: 12px 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
