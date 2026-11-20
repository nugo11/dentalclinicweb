import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import PWAInstallBanner from "./components/PWAInstallBanner";
import ScrollToTop from "./components/Common/ScrollToTop";
import SuperAdminRoute from "./components/Admin/SuperAdminRoute";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Finance = lazy(() => import("./pages/Finance"));
const Treatments = lazy(() => import("./pages/Treatments"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Services = lazy(() => import("./pages/Services"));
const OrderArchive = lazy(() => import("./pages/OrderArchive"));
const Staff = lazy(() => import("./pages/Staff"));
const Billing = lazy(() => import("./pages/settings/Billing"));
const ClinicCatalog = lazy(() => import("./pages/ClinicCatalog"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const SuspendedPage = lazy(() => import("./pages/SuspendedPage"));
const Documentation = lazy(() => import("./pages/Documentation"));
const ClinicPortfolio = lazy(() => import("./pages/settings/ClinicPortfolio"));
const ClinicPublicProfile = lazy(() => import("./pages/ClinicPublicProfile"));
const SalaryArchive = lazy(() => import("./pages/SalaryArchive"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Apps = lazy(() => import("./pages/Apps"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));

const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-surface-soft">
    <div className="w-10 h-10 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin" />
  </div>
);

// დამხმარე კომპონენტი დაცული როუტებისთვის (RBAC)
const PrivateRoute = ({ children, title, allowedRoles = [] }) => {
  const { currentUser, activeStaff, clinicData, loading, role } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;

  if (!currentUser || !activeStaff) {
    return <Navigate to="/auth" replace />;
  }

  // როლების მიხედვით წვდომის შემოწმება
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // თუ კლინიკის სტატუსი არ არის აქტიური (გარდა ბილინგის გვერდისა)
  if (clinicData?.subscriptionStatus !== "active" && pathname !== "/settings/billing") {
    return <Navigate to="/suspended" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{title || 'კლინიკის მართვა'} — AiDent</title>
        <meta name="description" content={`AiDent — ${title || 'კლინიკის მართვის სისტემა'}. მართეთ თქვენი კლინიკა ეფექტურად.`} />
      </Helmet>
      {children}
    </>
  );
};

function AppContent() {
  const { currentUser, activeStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Standalone mode check (iOS Add to Home Screen / PWA)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(window.navigator && window.navigator.standalone)
  );

  // Home Screen აპლიკაციით გახსნისას ავტომატურად გადადის დაშბორდზე (ან /auth-ზე თუ არ არის ავტორიზებული)
  if (isStandalone && location.pathname === '/') {
    return <Navigate to={currentUser && activeStaff ? "/dashboard" : "/auth"} replace />;
  }

  return (
    <div className="app-route-enter">
      <ScrollToTop />
      <PWAInstallBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage user={currentUser} />} />

          <Route path="/auth" element={
            currentUser && activeStaff ? <Navigate to="/dashboard" replace /> : <AuthPage />
          } />

          {/* დაცული როუტები როლების მიხედვით */}
          <Route path="/dashboard" element={<PrivateRoute title="სამართავი პანელი"><Dashboard /></PrivateRoute>} />

          <Route path="/patients" element={
            <PrivateRoute title="პაციენტების ბაზა" allowedRoles={['admin', 'manager', 'receptionist', 'doctor']}>
              <Patients />
            </PrivateRoute>
          } />

          <Route path="/patients/:id" element={
            <PrivateRoute title="პაციენტი" allowedRoles={['admin', 'manager', 'receptionist', 'doctor']}>
              <PatientProfile />
            </PrivateRoute>
          } />

          <Route path="/calendar" element={
            <PrivateRoute title="კალენდარი" allowedRoles={['admin', 'manager', 'receptionist', 'doctor']}>
              <CalendarPage />
            </PrivateRoute>
          } />

          <Route path="/finance" element={
            <PrivateRoute title="ფინანსები" allowedRoles={['admin', 'manager', 'accountant']}>
              <Finance />
            </PrivateRoute>
          } />

          <Route path="/treatments" element={
            <PrivateRoute title="ჯავშნები" allowedRoles={['admin', 'manager', 'receptionist', 'accountant']}>
              <Treatments />
            </PrivateRoute>
          } />

          <Route path="/inventory" element={
            <PrivateRoute title="ინვენტარი" allowedRoles={['admin', 'manager', 'accountant']}>
              <Inventory />
            </PrivateRoute>
          } />

          <Route path="/services" element={
            <PrivateRoute title="სერვისები" allowedRoles={['admin']}>
              <Services />
            </PrivateRoute>
          } />

          <Route path="/archive" element={
            <PrivateRoute title="შეკვეთების არქივი" allowedRoles={['admin', 'manager', 'receptionist', 'accountant']}>
              <OrderArchive />
            </PrivateRoute>
          } />

          <Route path="/staff" element={
            <PrivateRoute title="თანამშრომლები" allowedRoles={['admin']}>
              <Staff />
            </PrivateRoute>
          } />

          <Route path="/salary-archive" element={
            <PrivateRoute title="ხელფასების არქივი" allowedRoles={['admin', 'manager', 'accountant']}>
              <SalaryArchive />
            </PrivateRoute>
          } />

          <Route path="/settings/billing" element={
            <PrivateRoute title="პაკეტის მართვა" allowedRoles={['admin']}>
              <Billing />
            </PrivateRoute>
          } />

          <Route path="/settings/portfolio" element={
            <PrivateRoute title="პორტფოლიოს მართვა" allowedRoles={['admin']}>
              <ClinicPortfolio />
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute title="პარამეტრები" allowedRoles={['admin']}>
              <Settings />
            </PrivateRoute>
          } />

          <Route path="/activity-log" element={
            <PrivateRoute title="აქტივობების ჟურნალი" allowedRoles={['admin']}>
              <ActivityLog />
            </PrivateRoute>
          } />

          <Route path="/suspended" element={currentUser ? <SuspendedPage /> : <Navigate to="/auth" replace />} />
          <Route path="/catalog" element={<><Helmet><title>კლინიკების კატალოგი — AiDent</title><meta name="description" content="დაათვალიერეთ საქართველოში მოქმედი წამყვანი სტომატოლოგიური კლინიკები, მათი სერვისები და შეთავაზებები." /></Helmet><ClinicCatalog /></>} />
          <Route path="/catalog/:id" element={<ClinicPublicProfile />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/contact" element={<ContactPage user={currentUser} />} />
          <Route path="/about" element={<AboutPage user={currentUser} />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/superadmin"
            element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin"
            element={<Navigate to="/superadmin" replace />}
          />
          <Route
            path="/documentation"
            element={
              <PrivateRoute title="დოკუმენტაცია" allowedRoles={["admin", "manager", "accountant", "doctor", "receptionist"]}>
                <Documentation />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
