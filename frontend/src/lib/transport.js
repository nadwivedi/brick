// Whose vehicle carries a sale. Also the ownership of a vehicle in the master.
export const TRANSPORT_MODES = [
  { key: 'party', label: 'Party Vehicle', hint: "Party's own vehicle, no charge" },
  { key: 'own', label: 'My Vehicle', hint: 'I charge the party transport' },
  { key: 'hired', label: 'Hired Vehicle', hint: 'I pay a transporter' },
];

// How a hired vehicle is paid
export const TRANSPORT_BASES = [
  { key: 'per_trip', label: 'Per Trip', unit: 'trip' },
  { key: 'per_ton', label: 'Per Ton', unit: 'ton' },
  { key: 'per_km', label: 'Per KM', unit: 'km' },
  { key: 'per_1000', label: 'Per 1000 Bricks', unit: '1000 pcs' },
  { key: 'fixed', label: 'Fixed Amount', unit: '' },
];

// Vehicle numbers are kept in capitals with no spaces, e.g. MH04AB1234 (at most 10 characters)
export const VEHICLE_NUMBER_MAX = 10;
export const cleanVehicleNumber = (value) => String(value || '').replace(/\s+/g, '').toUpperCase().slice(0, VEHICLE_NUMBER_MAX);

export const modeLabel = (mode) => TRANSPORT_MODES.find(m => m.key === mode)?.label || 'Party Vehicle';
export const basisOf = (basis) => TRANSPORT_BASES.find(b => b.key === basis) || TRANSPORT_BASES[0];

// A fixed amount ignores the quantity
export const transportCost = (basis, qty, rate) => {
  const r = Math.max(0, Number(rate) || 0);
  return Math.round((basis === 'fixed' ? r : Math.max(0, Number(qty) || 0) * r) * 100) / 100;
};

// Quantity the transporter is paid for on a sale: bricks come from the sale itself, a trip is 1 unless typed
export const saleTransportQty = (form, pieces) => {
  if (form.transportBasis === 'fixed') return 1;
  if (form.transportBasis === 'per_1000') return Math.round((pieces / 1000) * 1000) / 1000;
  if (form.transportBasis === 'per_trip') return Number(form.transportQty) || 1;
  return Number(form.transportQty) || 0;
};
