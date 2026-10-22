import { useState, useEffect } from 'react';
import api from '../lib/api';
import PlantSelect from './PlantSelect';
import { defaultPlantId } from '../lib/plants';
import useEscapeKey from '../hooks/useEscapeKey';
import PartyFormModal from './PartyFormModal';
import Modal, { ModalSection } from './Modal';
import SaleTransport from './SaleTransport';
import { saleTransportQty } from '../lib/transport';
import AccountPicker, { modeForAccount } from './AccountPicker';
import useAccounts from '../hooks/useAccounts';
import { LoadingState } from './States';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// A new sale starts on the party's own vehicle
const NO_TRANSPORT = { transportMode: 'party', transporter: '', transportBasis: 'per_trip', transportQty: '', transportRate: '', transportLocation: '' };

/**
 * "New Invoice" popup. Loads the parties, brick types, plants, stock and vehicles it needs by
 * itself, so it can be opened from the Sales page or straight from the dashboard.
 * Props: onClose, onSaved (called after a successful save; the caller closes the popup)
 */
export default function SaleFormModal({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [brickStock, setBrickStock] = useState({}); // pcs available per brick type id
  const [form, setForm] = useState(null); // filled in once the lists above have loaded
  const [saving, setSaving] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false); // inline "+ New Party" popup over the invoice form
  const { accounts, defaultAccountId } = useAccounts();
  const accountOf = (id) => accounts.find(a => a._id === (id || defaultAccountId));

  useEscapeKey(!addingCustomer, onClose);

  useEffect(() => {
    Promise.all([
      api.get('/parties'),
      api.get('/products'),
      api.get('/plants'),
      api.get('/stock/bricks'),
      api.get('/vehicles'),
    ]).then(([custRes, prodRes, plantRes, stockRes, vehRes]) => {
      const plantList = plantRes.data || [];
      setVehicles(vehRes.data || []);
      setBrickStock(Object.fromEntries((stockRes.data || []).map(r => [r.product._id, Math.max(r.available, 0)])));
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPlants(plantList);
      setForm({ date: dayjs().format('YYYY-MM-DD'), customer: '', plant: defaultPlantId(plantList), items: [{ product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }], subtotal: 0, gstTotal: 0, transportCharges: 0, discount: 0, totalAmount: 0, paidAmount: 0, account: '', paymentMode: '', vehicleNumber: '', driverName: '', siteAddress: '', notes: '', ...NO_TRANSPORT });
    }).catch(e => { alert(e.message || 'Could not load the form'); onClose(); });
  }, []);

  if (!form) {
    return (
      <Modal title="New Invoice" subtitle="Create a sales invoice for a customer" onClose={onClose} maxWidth="max-w-4xl">
        <LoadingState label="Loading form…" />
      </Modal>
    );
  }

  const calcTotals = (items, trans, disc) => {
    const sub = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const gstTot = items.reduce((s, i) => s + (parseFloat(i.gstAmount) || 0), 0);
    const total = sub + gstTot + (parseFloat(trans) || 0) - (parseFloat(disc) || 0);
    return { subtotal: sub, gstTotal: gstTot, totalAmount: total };
  };

  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx][key] = val;
    if (key === 'quantity' || key === 'rate') {
      const qty = parseFloat(items[idx].quantity) || 0;
      const rate = parseFloat(items[idx].rate) || 0;
      items[idx].amount = qty * rate;
    }
    if (key === 'product') {
      const p = products.find(p => p._id === val);
      if (p) items[idx].rate = p.defaultRate;
    }
    const totals = calcTotals(items, form.transportCharges, form.discount);
    setForm({ ...form, items, ...totals });
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }]
  }));

  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    const totals = calcTotals(items, form.transportCharges, form.discount);
    setForm(f => ({ ...f, items, ...totals }));
  };

  // Pieces of each brick type on this invoice, across all its rows
  const qtyByProduct = form.items.reduce((m, i) => (i.product ? { ...m, [i.product]: (m[i.product] || 0) + (Number(i.quantity) || 0) } : m), {});
  const overStock = Object.keys(qtyByProduct).filter(id => qtyByProduct[id] > (brickStock[id] || 0));
  const pieces = Object.values(qtyByProduct).reduce((s, n) => s + n, 0);

  // Transport changes can change the charge to the party, and so the total
  const setTransport = (patch) => setForm(f => {
    const next = { ...f, ...patch };
    if (next.transportMode === 'party') next.transportCharges = 0;
    return { ...next, ...calcTotals(next.items, next.transportCharges, next.discount) };
  });

  const handleSave = async () => {
    // Blank rows are ignored; everything the invoice needs must be filled in
    const items = form.items.filter(i => i.product);
    const shortName = products.find(p => p._id === overStock[0])?.name;
    const problem =
      !form.plant ? 'Select a plant' :
      !form.customer ? 'Select a party' :
      items.length === 0 ? 'Add at least one product' :
      items.some(i => !(Number(i.quantity) > 0)) ? 'Enter the quantity for each product' :
      items.some(i => i.rate === '' || Number(i.rate) < 0) ? 'Enter the rate for each product' :
      overStock.length ? `Not enough stock: only ${(brickStock[overStock[0]] || 0).toLocaleString('en-IN')} pcs of ${shortName} available` :
      form.transportMode === 'hired' && !form.transporter ? 'Select the transporter the vehicle is hired from' : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      await api.post('/invoices', {
        ...form,
        // GST is not charged for now; the fields stay at 0 so it can be switched back on later
        items: items.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), gstPercent: 0, gstAmount: 0 })),
        ...calcTotals(items, form.transportCharges, form.discount),
        transportCharges: Number(form.transportCharges) || 0,
        discount: Number(form.discount) || 0,
        paidAmount: Number(form.paidAmount) || 0,
        // The cash / bank account the money received now went into
        account: accountOf(form.account)?._id,
        paymentMode: modeForAccount(accountOf(form.account), form.paymentMode),
        transportQty: saleTransportQty(form, pieces),
        transportRate: Number(form.transportRate) || 0,
      });
      setSaving(false);
      onSaved();
    } catch (e) {
      alert(e.message || 'Error');
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title="New Invoice"
        subtitle="Create a sales invoice for a customer"
        onClose={onClose}
        maxWidth="max-w-4xl"
        footer={<>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-8" onClick={handleSave} disabled={saving || overStock.length > 0}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Saving...' : 'Create Invoice'}
          </button>
        </>}
      >
        <ModalSection number={1} title="Invoice Details" tone="blue">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <PlantSelect plants={plants} value={form.plant} onChange={plant => setForm({ ...form, plant })} />
            <div className="col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="label mb-0">Party</label>
                <button type="button" onClick={() => setAddingCustomer(true)} className="text-xs font-semibold text-primary-600 hover:underline">+ New Party</button>
              </div>
              <select className="input" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                <option value="">Select Party</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>)}
              </select>
            </div>
          </div>
        </ModalSection>

        {/* Items */}
        <ModalSection
          number={2}
          title="Invoice Items"
          tone="slate"
          action={<button className="btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>}
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead><tr>
                <th className="table-header">Product</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Rate (₹)</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header"></th>
              </tr></thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">
                      <select className="input min-w-36 py-1.5" value={item.product} onChange={e => updateItem(idx, 'product', e.target.value)}>
                        <option value="">Select</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({(brickStock[p._id] || 0).toLocaleString('en-IN')} pcs)</option>)}
                      </select>
                      {item.product && (
                        <p className={`mt-0.5 whitespace-nowrap text-[11px] font-semibold ${overStock.includes(item.product) ? 'text-rose-600' : 'text-slate-400'}`}>
                          {overStock.includes(item.product) ? 'Not enough stock · ' : ''}{(brickStock[item.product] || 0).toLocaleString('en-IN')} pcs available
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-1.5"><input type="number" {...NON_NEGATIVE} className="input w-24 py-1.5" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                    <td className="px-2 py-1.5"><input type="number" {...NON_NEGATIVE} className="input w-28 py-1.5" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold text-slate-800">{fmt(item.amount)}</td>
                    <td className="px-2 py-1.5"><button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Remove item" onClick={() => removeItem(idx)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalSection>

        <ModalSection number={3} title="Transport" tone="amber">
          <SaleTransport form={form} onChange={setTransport} vehicles={vehicles} parties={customers} plants={plants} pieces={pieces} />
        </ModalSection>

        <ModalSection number={4} title="Charges & Total" tone="purple">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.discount}
                onChange={e => { const d = e.target.value; const tot = calcTotals(form.items, form.transportCharges, d); setForm(f => ({ ...f, discount: d, ...tot })); }} />
            </div>
          </div>

          <div className="mt-3 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-right md:mt-4 md:p-4">
            <div className="text-sm text-slate-600">Subtotal: <span className="font-semibold text-slate-800">{fmt(form.subtotal)}</span></div>
            {Number(form.transportCharges) > 0 && <div className="text-sm text-slate-600">Transport: <span className="font-semibold text-slate-800">{fmt(Number(form.transportCharges))}</span></div>}
            <div className="text-lg font-bold text-slate-900">Total: {fmt(form.totalAmount)}</div>
          </div>
        </ModalSection>

        <ModalSection number={5} title="Payment & Delivery" tone="emerald">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="label">Amount Paid Now (₹)</label>
              <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
            </div>
            <div className="flex items-end">
              <p className="pb-2.5 text-sm text-slate-600">
                Balance due: <span className="font-semibold text-rose-600">{fmt((form.totalAmount || 0) - (Number(form.paidAmount) || 0))}</span>
              </p>
            </div>
            {/* Which cash / bank account only matters when money was received */}
            {Number(form.paidAmount) > 0 && (
              <div className="col-span-2">
                <AccountPicker label="Received In" accounts={accounts} defaultAccountId={defaultAccountId}
                  account={form.account} mode={form.paymentMode}
                  onChange={({ account, mode }) => setForm({ ...form, account, paymentMode: mode })} />
              </div>
            )}
            <div className="col-span-2 md:col-span-1">
              <label className="label">Driver Name</label>
              <input className="input" placeholder="Driver name" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="label">Site / Delivery Address</label>
              <input className="input" placeholder="Delivery site address" value={form.siteAddress} onChange={e => setForm({ ...form, siteAddress: e.target.value })} />
            </div>
          </div>
        </ModalSection>
      </Modal>

    {/* New party from the invoice form; it is selected once saved */}
    {addingCustomer && (
      <PartyFormModal
        onClose={() => setAddingCustomer(false)}
        onSaved={party => {
          setCustomers(list => [...list, party].sort((a, b) => a.name.localeCompare(b.name)));
          setForm(f => ({ ...f, customer: party._id }));
        }}
      />
    )}
    </>
  );
}
