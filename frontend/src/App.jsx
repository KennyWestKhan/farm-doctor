import { Routes, Route, Outlet } from 'react-router-dom';
import MobileGate from './components/MobileGate.jsx';
import TabBar from './components/TabBar.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Home from './screens/Home.jsx';
import DiagnoseFlow from './screens/DiagnoseFlow.jsx';
import Shops from './screens/Shops.jsx';
import Reports from './screens/Reports.jsx';
import ReportDetail from './screens/ReportDetail.jsx';
import Scan from './screens/Scan.jsx';
import ScanCrop from './screens/ScanCrop.jsx';
import ScanLabel from './screens/ScanLabel.jsx';
import Dashboard from './screens/Dashboard.jsx';

// Layout for the four tabbed screens: scrollable content + fixed bottom nav.
function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
      <TabBar />
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <MobileGate>
      <Routes>
        {/* Desktop-allowed judges' view, outside the mobile shell */}
        <Route path="/dashboard" element={<Dashboard />} />

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
    </MobileGate>
  );
}
