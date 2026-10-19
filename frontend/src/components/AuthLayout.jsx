import { AlertCircle, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export const authInputCls = 'w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-[15px] font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 disabled:opacity-60';
export const authButtonCls = 'flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-3.5 text-[15px] font-bold text-white shadow-md shadow-primary-700/20 transition hover:bg-primary-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';
export const authLinkCls = 'font-semibold text-primary-700 hover:text-primary-900 hover:underline';

// Input with a leading icon, matching the bimaone login fields.
export function AuthField({ icon: Icon, className = '', children, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <Icon size={20} />
      </span>
      <input className={`${authInputCls} ${className}`} {...props} />
      {children}
    </div>
  );
}

// Split card shared by the login and register pages: promo panel on the left, form on the right.
export default function AuthLayout({ title, subtitle, error, children }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="grid w-full max-w-[1000px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/60 lg:grid-cols-2">
        {/* Left - promotional panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1f2a3c] via-[#27374f] to-[#314866] p-12 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/[0.05]" />
          <div className="pointer-events-none absolute bottom-16 right-12 h-24 w-24 rounded-full bg-sky-400/15" />

          <div className="relative">
            {/* Not an <h1>: this panel is hidden on mobile, and the form heading carries the page's h1. */}
            <p className="text-[2.5rem] font-bold leading-[1.15]">
              Your Brick Plant,<br />Simplified.
            </p>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-slate-300">
              Manage production, sales, stock and parties from one simple dashboard.
            </p>

            <div className="mt-10 flex items-center gap-3 border-t border-white/30 pt-6">
              <ShieldCheck size={24} />
              <span className="font-medium">Safe & Secure</span>
            </div>
          </div>
        </div>

        {/* Right - form */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-12">
          <div className="mb-10 flex justify-center">
            <Logo size="lg" subtitle="Brick Manufacturing Management" />
          </div>

          <div className="mb-6">
            <h1 className="text-[1.75rem] font-bold text-slate-900 sm:text-[2rem]">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5">
              <AlertCircle size={20} className="shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
