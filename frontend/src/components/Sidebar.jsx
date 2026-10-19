import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Activity, Hammer, Package, ShoppingCart, FileText,
  Users, Building2, HardHat, DollarSign, BarChart3,
  Settings, LogOut, Layers, AlertTriangle, Ruler, Tags, Boxes, HandCoins, Send, X
} from 'lucide-react';
import Logo from './Logo';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/activity', icon: Activity, label: 'Activity Center' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/production', icon: Hammer, label: 'Production' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/purchases', icon: ShoppingCart, label: 'Purchases' },
      { to: '/sales', icon: FileText, label: 'Sales & Invoices' },
      { to: '/receipts', icon: HandCoins, label: 'Money Received' },
      { to: '/payments', icon: Send, label: 'Money Paid' },
      { to: '/expenses', icon: DollarSign, label: 'Expenses' },
    ]
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/low-stock', icon: AlertTriangle, label: 'Low Stock Alerts' },
    ]
  },
  {
    label: 'Masters',
    items: [
      { to: '/masters/parties', icon: Users, label: 'Parties' },
      { to: '/masters/labour', icon: HardHat, label: 'Labour' },
      { to: '/masters/plants', icon: Building2, label: 'Plants' },
      { to: '/masters/brick-types', icon: Layers, label: 'Brick Types' },
      { to: '/masters/raw-materials', icon: Boxes, label: 'Raw Materials' },
      { to: '/masters/units', icon: Ruler, label: 'Units' },
      { to: '/masters/expense-categories', icon: Tags, label: 'Expense Categories' },
    ]
  }
];

const NavItem = ({ to, icon: Icon, label, isActive }) => (
  <Link
    to={to}
    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'bg-white/20 text-white'
          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-primary-600'
      }`}
    >
      <Icon size={18} />
    </span>
    <span className="truncate">{label}</span>
  </Link>
);

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Close the mobile drawer after navigating
  useEffect(() => {
    onClose?.();
  }, [location.pathname, onClose]);

  // While the mobile drawer is open: Esc closes it and the page behind stops scrolling
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <div className="relative flex h-full flex-col">
      {/* Logo */}
      <div className="flex-none px-4 pb-4 pt-5">
        <div className="flex items-center justify-center">
          <Link to="/dashboard" className="flex items-center justify-center">
            <Logo subtitle={user?.organization?.name || 'Brick Management'} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="mx-5 h-px bg-slate-200" />

      {/* Nav */}
      <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{group.label}</p>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} isActive={isActivePath(item.to)} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Settings / User / Logout */}
      <div className="flex-none space-y-2 border-t border-slate-200 p-3">
        <NavItem to="/settings" icon={Settings} label="Settings" isActive={isActivePath('/settings')} />
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-800">{user?.name || 'User'}</p>
            <p className="truncate text-[11px] capitalize text-slate-400">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-slate-200 bg-white lg:flex">
        {content}
      </aside>

      {/* Mobile: slide-in drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {content}
        </aside>
      </div>
    </>
  );
}
