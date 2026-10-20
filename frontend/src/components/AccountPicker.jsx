import { Link } from 'react-router-dom';
import { Banknote, Landmark, Plus } from 'lucide-react';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

// How money moved through a bank account
export const BANK_MODES = [
  { key: 'upi', label: 'UPI' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
  { key: 'cheque', label: 'Cheque' },
];

/** The mode saved with an entry for the chosen account: cash, or the bank mode picked (UPI by default). */
export const modeForAccount = (account, mode) =>
  account?.type === 'cash' ? 'cash' : BANK_MODES.some(m => m.key === mode) ? mode : 'upi';

/**
 * Pick the cash / bank account money went into ("Received In") or came out of ("Paid From"),
 * and for a bank account how (UPI, bank transfer, cheque). An empty `account` means the default account.
 * Props: label, accounts / defaultAccountId (from useAccounts), account, mode, onChange({ account, mode })
 */
export default function AccountPicker({ label, accounts, defaultAccountId, account, mode, onChange }) {
  const selectedId = account || defaultAccountId;
  const selected = accounts.find(a => a._id === selectedId);
  const pick = (a) => onChange({ account: a._id, mode: modeForAccount(a, mode) });

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="label mb-0">{label}</label>
        <Link to="/accounts" className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700" target="_blank" title="Add or edit your cash and bank accounts">
          <Plus size={12} /> Add account
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {accounts.map(a => {
          const Icon = a.type === 'cash' ? Banknote : Landmark;
          const active = a._id === selectedId;
          return (
            <button
              key={a._id}
              type="button"
              onClick={() => pick(a)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <Icon size={18} className={`shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${active ? 'text-emerald-800' : 'text-slate-700'}`}>{a.name}</span>
                <span className={`block text-[11px] ${a.balance < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{fmt(a.balance)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {selected?.type === 'bank' && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BANK_MODES.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => onChange({ account: selected._id, mode: m.key })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${modeForAccount(selected, mode) === m.key ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
