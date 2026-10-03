import { useCallback, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Logo from './Logo';
import { Menu, ChevronLeft } from 'lucide-react';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mobileOpen={menuOpen} onClose={closeMenu} />

      {/* Mobile topbar */}
      <nav className="fixed inset-x-0 top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/80 px-2 backdrop-blur-md lg:hidden">
        <div className="relative z-10 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          {location.pathname !== '/dashboard' && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <Link to="/dashboard" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo />
        </Link>
      </nav>

      {/* Page content */}
      <div className="lg:ml-[260px]">
        <div className="pt-16 lg:pt-0">
          <main className="w-full px-3 pb-8 pt-4 lg:px-6 lg:pt-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
