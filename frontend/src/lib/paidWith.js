// How a sale or purchase was paid when it was made. Money moved later is recorded against the
// party (Money Received / Money Paid), so what is still due lives in the party's ledger.
export const PAID_TYPES = {
  cash: { label: 'Cash', badge: 'badge-green' },
  partial: { label: 'Partial', badge: 'badge-orange' },
  credit: { label: 'Credit', badge: 'badge-red' },
};

export const paidType = (paid, total) => {
  const p = Number(paid) || 0;
  if (p <= 0) return 'credit';
  return p >= (Number(total) || 0) ? 'cash' : 'partial';
};
