import { useState, useEffect } from 'react';
import api from '../lib/api';
import PlantSelect from './PlantSelect';
import { defaultPlantId } from '../lib/plants';
import OptionPicker from './OptionPicker';
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
import { PAID_TYPES, paidType } from '../lib/paidWith';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const num = (n) => (n || 0).toLocaleString('en-IN');

// A new sale starts on the party's own vehicle
const NO_TRANSPORT = { transportMode: 'party', transporter: '', transportBasis: 'per_trip', transportQty: '', transportRate: '', transportLocation: '' };

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

// The form filled in from a saved sale, with what was received at the sale and into which account
const formFromInvoice = (inv) => ({
  date: dayjs(inv.date).format('YYYY-MM-DD'),
  customer: idOf(inv.customer),
  plant: idOf(inv.plant),
  items: (inv.items || []).map(i => ({ product: idOf(i.product), quantity: i.quantity, rate: i.rate, amount: i.amount, gstPercent: 0, gstAmount: 0 })),
  subtotal: inv.subtotal || 0, gstTotal: inv.gstTotal || 0,
  transportCharges: inv.transportCharges || 0, discount: inv.discount || 0, totalAmount: inv.totalAmount || 0,
  paidAmount: inv.atSale?.amount || 0, account: idOf(inv.atSale?.account), paymentMode: inv.atSale?.mode || '',
  vehicleNumber: inv.vehicleNumber || '', driverName: inv.driverName || '', siteAddress: inv.siteAddress || '', notes: inv.notes || '',
  transportMode: inv.transportMode || 'party', transporter: idOf(inv.transporter), transportBasis: inv.transportBasis || 'per_trip',
  transportQty: inv.transportQty || '', transportRate: inv.transportRate || '', transportLocation: inv.transportLocation || '',
});

/**
 * "New Invoice" / "Edit Invoice" popup. Loads the parties, brick types, plants, stock and vehicles it
 * needs by itself, so it can be opened from the Sales page or straight from the dashboard.
 * Props: invoiceId (edit that sale; leave out for a new one), onClose,
 * onSaved (called after a successful save; the caller closes the popup)
 */
export default function SaleFormModal({ invoiceId, onClose, onSaved }) {
  const editing = Boolean(invoiceId);
  const title = editing ? 'Edit Invoice' : 'New Invoice';
  const subtitle = editing ? 'Change this sale; the party ledger and stock follow the change' : 'Create a sales invoice for a customer';
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [brickStock, setBrickStock] = useState({}); // pcs available per brick type id
  const [form, setForm] = useState(null); // filled in once the lists above have loaded
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(''); // this invoice's number, or the one a new invoice will get
  const [addingCustomer, setAddingCustomer] = useState(false); // inline "+ New Party" popup over the invoice form
  const { accounts, defaultAccountId } = useAccounts();
  const accountOf = (id) => accounts.find(a => a._id === (id || defaultAccountId));

  useEscapeKey(!addingCustomer, onClose);

  useEffect(() => {
    Promise.all([
      api.get('/parties'),
      api.get('/products'),
      api.get('/plants'),
      // When editing, this sale's own bricks count as available
      api.get('/stock/bricks', { params: editing ? { excludeInvoice: invoiceId } : {} }),
      api.get('/vehicles'),
      editing ? api.get(`/invoices/${invoiceId}`) : api.get('/invoices/next-number'),
    ]).then(([custRes, prodRes, plantRes, stockRes, vehRes, invRes]) => {
      const plantList = plantRes.data || [];
      setVehicles(vehRes.data || []);
      setBrickStock(Object.fromEntries((stockRes.data || []).map(r => [r.product._id, Math.max(r.available, 0)])));
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPlants(plantList);
      if (editing) { setInvoiceNumber(invRes.data.invoiceNumber); setForm(formFromInvoice(invRes.data)); return; }
      setInvoiceNumber(invRes.data);
      setForm({ date: dayjs().format('YYYY-MM-DD'), customer: '', plant: defaultPlantId(plantList), items: [{ product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }], subtotal: 0, gstTotal: 0, transportCharges: 0, discount: 0, totalAmount: 0, paidAmount: 0, account: '', paymentMode: '', vehicleNumber: '', driverName: '', siteAddress: '', notes: '', ...NO_TRANSPORT });
    }).catch(e => { alert(e.message || 'Could not load the form'); onClose(); });
  }, []);

  if (!form) {
    return (
      <Modal title={title} subtitle={subtitle} onClose={onClose} maxWidth="max-w-4xl">
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
    items[idx] = { ...items[idx], [key]: val };
    const qty = parseFloat(items[idx].quantity) || 0;
    if (key === 'product') {
      const p = products.find(p => p._id === val);
      if (p) items[idx].rate = p.defaultRate;
    }
    if (key === 'amount') {
      // The amount typed sets the rate per brick
      if (qty > 0) items[idx].rate = Math.round(((parseFloat(val) || 0) / qty) * 100) / 100;
    } else if (key === 'quantity' || key === 'rate' || key === 'product') {
      items[idx].amount = Math.round(qty * (parseFloat(items[idx].rate) || 0) * 100) / 100;
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

  // Searchable lists: parties by name or mobile, brick types with the stock available to sell
  const partyOptions = customers.map(c => ({ value: c._id, label: c.name, hint: c.mobile }));
  const productOptions = products.filter(p => p.isActive !== false || form.items.some(i => i.product === p._id)).map(p => {
    const left = brickStock[p._id] || 0;
    return { value: p._id, label: p.name, hint: p.size, badge: { text: `${num(left)} pcs in stock`, tone: left > 0 ? 'green' : 'gray' } };
  });

  // What is received now; the rest goes on the party's balance
  const saleType = paidType(form.paidAmount, form.totalAmount);
  const onCredit = (form.totalAmount || 0) - (Number(form.paidAmount) || 0);

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
      const save = editing ? (data) => api.put(`/invoices/${invoiceId}`, data) : (data) => api.post('/invoices', data);
      await save({
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
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        maxWidth="max-w-4xl"
        footer={<>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-8" onClick={handleSave} disabled={saving || overStock.length > 0}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Invoice'}
          </button>
        </>}
      >
        <ModalSection number={1} title="Invoice Details" tone="blue">
          <div className="space-y-3 md:space-y-4">
            {/* Equal columns for however many fields show (the plant only shows with more than one plant) */}
            <div className="grid grid-cols-2 gap-3 md:auto-cols-fr md:grid-flow-col md:gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Invoice No.</label>
                {/* Given by the system when the invoice is saved */}
                <div className="input flex items-center justify-between gap-2 bg-slate-50 font-bold text-slate-800" title={editing ? undefined : 'The number this invoice will get when you save it'}>
                  {invoiceNumber || '—'}
                  {!editing && <span className="text-[11px] font-semibold text-slate-400">Auto</span>}
                </div>
              </div>
              <PlantSelect className="col-span-2 md:col-span-1" plants={plants} value={form.plant} onChange={plant => setForm({ ...form, plant })} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="label mb-0">Party <span className="text-rose-500">*</span></label>
                <button type="button" onClick={() => setAddingCustomer(true)} className="text-xs font-semibold text-primary-600 hover:underline">+ New Party</button>
              </div>
              <OptionPicker options={partyOptions} value={form.customer} onChange={customer => setForm(f => ({ ...f, customer }))}
                placeholder="Select Party" searchPlaceholder="Search party name or mobile..." />
            </div>
          </div>
        </ModalSection>

        <ModalSection number={2} title="Bricks Sold" tone="emerald">
          <div className="space-y-2">
            <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_2.25rem] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Brick Type</span><span>Quantity</span><span>Rate</span><span>Amount</span><span />
            </div>
            {form.items.map((item, idx) => {
              const short = item.product && overStock.includes(item.product);
              return (
                <div key={idx} className="rounded-lg bg-white p-2 ring-1 ring-inset ring-emerald-100 md:bg-transparent md:p-0 md:ring-0">
                  <div className="grid grid-cols-2 items-center gap-2 md:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_2.25rem]">
                    <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                      <OptionPicker className="min-w-0 flex-1" options={productOptions} value={item.product} onChange={id => updateItem(idx, 'product', id)}
                        placeholder="Select Brick Type" searchPlaceholder="Search brick types..." />
                      <button type="button" className="icon-btn shrink-0 hover:bg-red-50 hover:text-red-600 md:hidden" title="Remove item" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                    </div>
                    <div className="relative">
                      <input type="number" {...NON_NEGATIVE} className={`input pr-10 font-semibold ${short ? 'border-rose-400 text-rose-700' : ''}`} placeholder="Qty"
                        value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">pcs</span>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                      <input type="number" {...NON_NEGATIVE} className="input pl-7 font-semibold" placeholder="Rate"
                        value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                    </div>
                    {/* Typing the amount works out the rate per brick */}
                    <div className="relative col-span-2 md:col-span-1">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                      <input type="number" {...NON_NEGATIVE} className="input pl-7 font-bold text-slate-900" placeholder="Amount" title="Type the amount to work out the rate per brick"
                        value={!item.amount && !item.quantity ? '' : item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} />
                    </div>
                    <button type="button" className="icon-btn hidden hover:bg-red-50 hover:text-red-600 md:inline-flex" title="Remove item" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                  </div>
                  {short && (
                    <p className="mt-1 px-1 text-xs font-semibold text-rose-600">
                      Not enough stock · only {num(brickStock[item.product] || 0)} pcs available
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-emerald-200 bg-white/70 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-white"
          >
            <Plus size={16} /> Add another brick type
          </button>

          {/* Live summary of the bricks on this invoice */}
          <div className="mt-3 grid grid-cols-2 divide-x divide-slate-100 overflow-hidden rounded-lg bg-white text-center ring-1 ring-inset ring-emerald-200 md:mt-4">
            <div className="px-2 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pieces</p>
              <p className="font-bold text-slate-800">{num(pieces)}</p>
            </div>
            <div className="bg-emerald-50/60 px-2 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Bricks amount</p>
              <p className="text-lg font-bold leading-tight text-emerald-700">{fmt(form.subtotal)}</p>
            </div>
          </div>
        </ModalSection>

        <ModalSection number={3} title="Transport" tone="amber">
          <SaleTransport form={form} onChange={setTransport} vehicles={vehicles} parties={customers} plants={plants} pieces={pieces}
            onVehicleAdded={v => setVehicles(list => [...list, v])} />
        </ModalSection>

        <ModalSection number={4} title="Bill & Payment" tone="purple">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              {/* Same height as the label row beside it, which has a button */}
              <div className="mb-1 flex min-h-[1.25rem] items-center"><label className="label mb-0">Discount</label></div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                <input type="number" {...NON_NEGATIVE} className="input pl-7 font-semibold" placeholder="0" value={form.discount}
                  onChange={e => { const d = e.target.value; setForm(f => ({ ...f, discount: d, ...calcTotals(f.items, f.transportCharges, d) })); }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex min-h-[1.25rem] items-center justify-between gap-2">
                <label className="label mb-0">Received Now</label>
                <button type="button" onClick={() => setForm({ ...form, paidAmount: form.totalAmount || 0 })} className="text-xs font-semibold text-primary-600 hover:underline">Full amount</button>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                <input type="number" {...NON_NEGATIVE} className="input pl-7 font-semibold text-emerald-700" placeholder="0 = on credit" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
            </div>
          </div>
          {/* Which cash / bank account only matters when money was received */}
          {Number(form.paidAmount) > 0 && (
            <div className="mt-3 md:mt-4">
              <AccountPicker label="Received In" accounts={accounts} defaultAccountId={defaultAccountId}
                account={form.account} mode={form.paymentMode}
                onChange={({ account, mode }) => setForm({ ...form, account, paymentMode: mode })} />
            </div>
          )}

          {/* The bill, and what is not received now goes on the party's balance */}
          <div className="mt-3 overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-purple-200 md:mt-4">
            <div className="space-y-1 px-3 py-2.5 text-sm md:px-4">
              <p className="flex justify-between text-slate-600"><span>Bricks</span><span className="font-semibold text-slate-800">{fmt(form.subtotal)}</span></p>
              {Number(form.transportCharges) > 0 && <p className="flex justify-between text-slate-600"><span>Transport</span><span className="font-semibold text-slate-800">{fmt(Number(form.transportCharges))}</span></p>}
              {Number(form.discount) > 0 && <p className="flex justify-between text-slate-600"><span>Discount</span><span className="font-semibold text-rose-600">−{fmt(Number(form.discount))}</span></p>}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-purple-100 bg-purple-50/50 px-3 py-2.5 md:px-4">
              <span className={PAID_TYPES[saleType].badge}>{PAID_TYPES[saleType].label} Sale</span>
              <span className="text-lg font-bold text-slate-900">Total: {fmt(form.totalAmount)}</span>
            </div>
            {onCredit !== 0 && (
              <p className="border-t border-purple-100 px-3 py-2 text-right text-sm md:px-4">
                {onCredit > 0
                  ? <><span className="font-semibold text-slate-800">{fmt(onCredit)} on credit</span><span className="text-slate-600">, added to the party's balance. Receive it later from Money Received.</span></>
                  : <span className="font-semibold text-emerald-700">{fmt(-onCredit)} extra received as advance</span>}
              </p>
            )}
          </div>
        </ModalSection>

        <ModalSection number={5} title="Delivery" tone="slate">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            <div>
              <label className="label">Driver Name <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" placeholder="Driver name" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
            </div>
            <div>
              <label className="label">Site / Delivery Address <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" placeholder="Delivery site address" value={form.siteAddress} onChange={e => setForm({ ...form, siteAddress: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" placeholder="Anything worth remembering about this sale" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
