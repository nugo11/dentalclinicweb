import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients"; 
import PatientProfile from "./pages/PatientProfile";
import CalendarPage from "./pages/CalendarPage";
import Finance from "./pages/Finance";
import Treatments from './pages/Treatments';
import Inventory from "./pages/Inventory";
import Services from "./pages/Services";
import OrderArchive from "./pages/OrderArchive";
import Staff from "./pages/Staff";
import Billing from "./pages/settings/Billing";
import ClinicCatalog from "./pages/ClinicCatalog";
import Settings from "./pages/settings/Settings";
import SuspendedPage from "./pages/SuspendedPage";
import Documentation from "./pages/Documentation";
import ClinicPortfolio from "./pages/settings/ClinicPortfolio";
import ClinicPublicProfile from "./pages/ClinicPublicProfile";
import SalaryArchive from "./pages/SalaryArchive";
import ActivityLog from "./pages/ActivityLog";
import Apps from "./pages/Apps";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PWAInstallBanner from "./components/PWAInstallBanner";
import ScrollToTop from "./components/Common/ScrollToTop";
import GlobalLoader from "./components/Common/GlobalLoader";

// დამხმარე კომპონენტი დაცული როუტებისთვის (RBAC)
const PrivateRoute = ({ children, title, allowedRoles = [] }) => {
  const { currentUser, activeStaff, clinicData, loading, role } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <GlobalLoader />; 

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
        <title>{title || 'კლინიკის მართვა'} — DentalHub</title>
        <meta name="description" content={`DentalHub — ${title || 'კლინიკის მართვის სისტემა'}. მართეთ თქვენი კლინიკა ეფექტურად.`} />
      </Helmet>
      {children}
    </>
  );
};

function AppContent() {
  const { currentUser, activeStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GlobalLoader />;

  return (
    <div className="app-route-enter">
      <ScrollToTop />
      <PWAInstallBanner />
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
          <PrivateRoute title="ჯავშნები" allowedRoles={['admin', 'manager', 'receptionist', 'doctor', 'accountant']}>
            <Treatments />
          </PrivateRoute>
        } />
        
        <Route path="/inventory" element={
          <PrivateRoute title="ინვენტარი" allowedRoles={['admin', 'manager', 'doctor', 'accountant']}>
            <Inventory />
          </PrivateRoute>
        } />
        
        <Route path="/services" element={
          <PrivateRoute title="სერვისები" allowedRoles={['admin', 'manager']}>
            <Services />
          </PrivateRoute>
        } />
        
        <Route path="/archive" element={
          <PrivateRoute title="შეკვეთების არქივი" allowedRoles={['admin', 'manager', 'accountant']}>
            <OrderArchive />
          </PrivateRoute>
        } />
        
        <Route path="/staff" element={
          <PrivateRoute title="თანამშრომლები" allowedRoles={['admin', 'manager', 'accountant']}>
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
          <PrivateRoute title="პარამეტრები" allowedRoles={['admin', 'manager', 'doctor']}>
            <Settings />
          </PrivateRoute>
        } />

        <Route path="/activity-log" element={
          <PrivateRoute title="აქტივობების ჟურნალი" allowedRoles={['admin', 'manager']}>
            <ActivityLog />
          </PrivateRoute>
        } />

        <Route path="/suspended" element={currentUser ? <SuspendedPage /> : <Navigate to="/auth" replace />} />
        <Route path="/catalog" element={<><Helmet><title>კლინიკების კატალოგი — DentalHub</title><meta name="description" content="დაათვალიერეთ საქართველოში მოქმედი წამყვანი სტომატოლოგიური კლინიკები, მათი სერვისები და შეთავაზებები." /></Helmet><ClinicCatalog /></>} />
        <Route path="/catalog/:id" element={<ClinicPublicProfile />} />
        <Route path="/apps" element={<Apps />} />
        <Route path="/contact" element={<ContactPage user={currentUser} />} />
        <Route path="/about" element={<AboutPage user={currentUser} />} />
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