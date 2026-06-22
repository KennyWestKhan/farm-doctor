import { Routes, Route, Outlet } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import MobileGate from './components/MobileGate.jsx';
import TabBar from './components/TabBar.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import { useAuth } from './auth/useAuth.js';
import Home from './screens/Home.jsx';
import DiagnoseFlow from './screens/DiagnoseFlow.jsx';
import Shops from './screens/Shops.jsx';
import Reports from './screens/Reports.jsx';
import ReportDetail from './screens/ReportDetail.jsx';
import Scan from './screens/Scan.jsx';
import ScanCrop from './screens/ScanCrop.jsx';
import ScanLabel from './screens/ScanLabel.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Welcome from './screens/Welcome.jsx';
import Profile from './screens/Profile.jsx';

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
      <TabBar />
      <InstallPrompt />
    </div>
  );
}

function WelcomeGate({ children }) {
  const { welcomed, loading } = useAuth();
  if (loading) return null;
  if (!welcomed) return <Welcome />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
    <MobileGate>
      <WelcomeGate>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/diagnose" element={<DiagnoseFlow />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/scan/crop" element={<ScanCrop />} />
            <Route path="/scan/label" element={<ScanLabel />} />
          </Route>
        </Routes>
      </WelcomeGate>
    </MobileGate>
    </ErrorBoundary>
  );
}
