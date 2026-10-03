import { Phone } from 'lucide-react';

const TILES = [
  'bg-blue-50 text-blue-700 ring-blue-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
  'bg-rose-50 text-rose-700 ring-rose-100',
  'bg-teal-50 text-teal-700 ring-teal-100',
];

// Same name always gets the same colour
const tileFor = (name = '') => TILES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILES.length];

/** Name of a customer/vendor with an initial tile and the mobile number underneath. */
export default function PartyCell({ name, mobile }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ring-inset ${tileFor(name)}`}>
        {name?.trim()?.[0]?.toUpperCase() || '?'}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{name || '-'}</p>
        {mobile && (
          <p className="flex items-center gap-1 text-xs font-normal text-slate-500">
            <Phone size={11} /> {mobile}
          </p>
        )}
      </div>
    </div>
  );
}
