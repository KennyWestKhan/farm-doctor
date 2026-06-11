import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';

// Minimal stroke icons. `on` switches to a filled look for the active tab.
const Icon = ({ name, on }) => {
  const sw = on ? 2.4 : 2;
  const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case 'diagnose':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
    case 'shops':
      return <svg {...common}><path d="M4 9h16l-1 11H5z" /><path d="M4 9 6 4h12l2 5" /><path d="M9 13h6" /></svg>;
    case 'reports':
      return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
    default:
      return null;
  }
};

const TABS = [
  { to: '/', icon: 'home', key: 'tab_home' },
  { to: '/diagnose', icon: 'diagnose', key: 'tab_diagnose' },
  { to: '/shops', icon: 'shops', key: 'tab_shops' },
  { to: '/reports', icon: 'reports', key: 'tab_reports' },
];

export default function TabBar() {
  const { t } = useLang();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => {
        const active = isActive(tab.to);
        return (
          <button
            key={tab.to}
            className={`tab ${active ? 'tab--active' : ''}`}
            onClick={() => nav(tab.to)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab__icon"><Icon name={tab.icon} on={active} /></span>
            {t(tab.key)}
          </button>
        );
      })}
    </nav>
  );
}
