const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// A positive balance is what the party owes you; a negative one is what you owe them
export const balanceText = (n) => (n > 0 ? `${fmt(n)} to receive` : n < 0 ? `${fmt(-n)} to pay` : 'Settled, nothing due');
export const balanceClass = (n) => (n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-600' : 'text-slate-800');

export default function BalanceCell({ n }) {
  return (
    <span className={balanceClass(n)}>
      {fmt(Math.abs(n))}
      {n !== 0 && <span className="ml-1 text-[10px] font-semibold uppercase">{n > 0 ? 'Rec' : 'Pay'}</span>}
    </span>
  );
}
