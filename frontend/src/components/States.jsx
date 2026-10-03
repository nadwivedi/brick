import { Inbox } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

const EMPTY_TONES = {
  slate: 'bg-slate-100 text-slate-400',
  emerald: 'bg-emerald-50 text-emerald-600',
};

export function EmptyState({ icon: Icon = Inbox, title, hint, tone = 'slate' }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${EMPTY_TONES[tone] || EMPTY_TONES.slate}`}>
        <Icon size={26} />
      </span>
      <p className="font-semibold text-slate-800">{title}</p>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
