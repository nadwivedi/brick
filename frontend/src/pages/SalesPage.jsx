import { useState, useEffect } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import useOpenOnNew from '../hooks/useOpenOnNew';
import Modal, { ModalSection } from '../components/Modal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, Loader2, CreditCard, FileText, Wallet, Scale, CalendarDays, MapPin, Truck } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const STATUS_COLORS = {
  issued: 'badge-orange',
  partial: 'badge-orange',
  paid: 'badge-green',
  draft: 'badge-gray',
  cancelled: 'badge-gray',
};

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'issued', label: 'Issued' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function SalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [brickStock, setBrickStock] = useState({}); // pcs available per brick type id
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  // Esc closes the top-most popup first (payment popup, then invoice form)
  useEscapeKey(!!showPayModal, () => setShowPayModal(null));
  useEscapeKey(showForm && !showPayModal, () => setShowForm(false));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    customer: '', plant: '',
    items: [{ product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }],
    subtotal: 0, gstTotal: 0, transportCharges: 0, loadingCharges: 0, discount: 0, totalAmount: 0,
    paidAmount: 0, paymentMode: 'cash', vehicleNumber: '', driverName: '', siteAddress: '', notes: ''
  });
  const [payForm, setPayForm] = useState({ amount: '', mode: 'cash', referenceNumber: '', notes: '', date: dayjs().format('YYYY-MM-DD') });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, prodRes, plantRes, stockRes] = await Promise.all([
        api.get('/invoices', { params: { limit: 1000 } }),
        api.get('/customers'),
        api.get('/products'),
        api.get('/plants'),
        api.get('/stock/bricks'),
      ]);
      setBrickStock(Object.fromEntries((stockRes.data || []).map(r => [r.product._id, Math.max(r.available, 0)])));
      setInvoices(invRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPlants(plantRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => {
    setForm({ date: dayjs().format('YYYY-MM-DD'), customer: '', plant: plants[0]?._id || '', items: [{ product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }], subtotal: 0, gstTotal: 0, transportCharges: 0, loadingCharges: 0, discount: 0, totalAmount: 0, paidAmount: 0, paymentMode: 'cash', vehicleNumber: '', driverName: '', siteAddress: '', notes: '' });
    setShowForm(true);
  };
  useOpenOnNew(!loading, openForm);

  const calcTotals = (items, trans, load, disc) => {
    const sub = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const gstTot = items.reduce((s, i) => s + (parseFloat(i.gstAmount) || 0), 0);
    const total = sub + gstTot + (parseFloat(trans) || 0) + (parseFloat(load) || 0) - (parseFloat(disc) || 0);
    return { subtotal: sub, gstTotal: gstTot, totalAmount: total };
  };

  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx][key] = val;
    if (key === 'quantity' || key === 'rate') {
      const qty = parseFloat(items[idx].quantity) || 0;
      const rate = parseFloat(items[idx].rate) || 0;
      items[idx].amount = qty * rate;
      const gstPct = parseFloat(items[idx].gstPercent) || 0;
      items[idx].gstAmount = (items[idx].amount * gstPct) / 100;
    }
    if (key === 'product') {
      const p = products.find(p => p._id === val);
      if (p) { items[idx].rate = p.defaultRate; items[idx].gstPercent = p.gstPercent || 0; }
    }
    const totals = calcTotals(items, form.transportCharges, form.loadingCharges, form.discount);
    setForm({ ...form, items, ...totals });
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { product: '', quantity: '', rate: '', amount: 0, gstPercent: 0, gstAmount: 0 }]
  }));

  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    const totals = calcTotals(items, form.transportCharges, form.loadingCharges, form.discount);
    setForm(f => ({ ...f, items, ...totals }));
  };

  // Pieces of each brick type on this invoice, across all its rows
  const qtyByProduct = form.items.reduce((m, i) => (i.product ? { ...m, [i.product]: (m[i.product] || 0) + (Number(i.quantity) || 0) } : m), {});
  const overStock = Object.keys(qtyByProduct).filter(id => qtyByProduct[id] > (brickStock[id] || 0));

  const handleSave = async () => {
    // Blank rows are ignored; everything the invoice needs must be filled in
    const items = form.items.filter(i => i.product);
    const shortName = products.find(p => p._id === overStock[0])?.name;
    const problem =
      !form.plant ? 'Select a plant' :
      !form.customer ? 'Select a customer' :
      items.length === 0 ? 'Add at least one product' :
      items.some(i => !(Number(i.quantity) > 0)) ? 'Enter the quantity for each product' :
      items.some(i => i.rate === '' || Number(i.rate) < 0) ? 'Enter the rate for each product' :
      overStock.length ? `Not enough stock: only ${(brickStock[overStock[0]] || 0).toLocaleString('en-IN')} pcs of ${shortName} available` : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      await api.post('/invoices', {
        ...form,
        items: items.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), gstPercent: Number(i.gstPercent) || 0 })),
        ...calcTotals(items, form.transportCharges, form.loadingCharges, form.discount),
        transportCharges: Number(form.transportCharges) || 0,
        loadingCharges: Number(form.loadingCharges) || 0,
        discount: Number(form.discount) || 0,
        paidAmount: Number(form.paidAmount) || 0,
      });
      setShowForm(false);
      fetchData();
    } catch (e) { alert(e.message || 'Error'); }
    setSaving(false);
  };

  const handleAddPayment = async () => {
    setSaving(true);
    try {
      await api.post(`/invoices/${showPayModal}/payment`, payForm);
      setShowPayModal(null);
      fetchData();
    } catch (e) { alert(e.message || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete invoice?')) return;
    await api.delete(`/invoices/${id}`);
    fetchData();
  };

  const searched = invoices.filter(inv =>
    (inv.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
  );
  const filtered = searched.filter(inv => !statusFilter || inv.status === statusFilter);
  // Cancelled and draft invoices are left out of the money totals
  const sum = (list, key) => list.reduce((t, i) => t + (i[key] || 0), 0);
  const billable = invoices.filter(i => !['cancelled', 'draft'].includes(i.status));
  const unpaid = billable.filter(i => i.balanceDue > 0);
  const monthInvoices = billable.filter(i => dayjs(i.date).isSame(dayjs(), 'month'));
  const statusCounts = searched.reduce((acc, inv) => ({ ...acc, [inv.status]: (acc[inv.status] || 0) + 1 }), {});

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="This Month" hint={`${monthInvoices.length} invoice${monthInvoices.length === 1 ? '' : 's'} in ${dayjs().format('MMMM')}`} value={fmt(sum(monthInvoices, 'totalAmount'))} tone="blue" />
        <StatCard icon={FileText} label="Total Sales" hint={`${billable.length} invoice${billable.length === 1 ? '' : 's'} in all`} value={fmt(sum(billable, 'totalAmount'))} tone="indigo" />
        <StatCard icon={Wallet} label="Received" hint="Payments received so far" value={fmt(sum(billable, 'paidAmount'))} tone="emerald" />
        <StatCard icon={Scale} label="Outstanding" hint={`${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'} not fully paid`} value={fmt(sum(unpaid, 'balanceDue'))} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Sales & Invoices</h1>
              <p className="page-subtitle">Every invoice, what was sold, and how much is still to be received</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search customer or invoice no..." />
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Status filter */}
          <div className="scrollbar-hide mt-2.5 flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map(({ key, label }) => {
              const active = statusFilter === key;
              const count = key ? statusCounts[key] || 0 : searched.length;
              return (
                <button
                  key={key || 'all'}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {label}{' '}
                  <span className={active ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState label="Loading invoices…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices found" hint={search || statusFilter ? 'Try a different search or filter.' : 'Create your first invoice to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const total = inv.totalAmount || 0;
                  const paidPct = total > 0 ? Math.min(100, ((inv.paidAmount || 0) / total) * 100) : 0;
                  const pieces = (inv.items || []).reduce((t, i) => t + (i.quantity || 0), 0);
                  const names = [...new Set((inv.items || []).map(i => i.product?.name).filter(Boolean))];
                  return (
                    <tr key={inv._id} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-bold text-primary-700">{inv.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">{dayjs(inv.date).format('DD MMM YYYY')} · {dayjs(inv.date).format('ddd')}</p>
                      </td>
                      <td className="table-cell">
                        <PartyCell name={inv.customer?.name} mobile={inv.customer?.mobile} />
                      </td>
                      <td className="table-cell">
                        <div className="max-w-[220px]">
                          <p className="whitespace-nowrap font-semibold text-slate-800">{pieces.toLocaleString('en-IN')} pcs</p>
                          <p className="truncate text-xs text-slate-500" title={names.join(', ')}>{names.join(', ') || '-'}</p>
                          <p className="flex items-center gap-2 truncate text-xs text-slate-400">
                            {inv.plant?.name && <span className="flex items-center gap-1"><MapPin size={11} /> {inv.plant.name}</span>}
                            {inv.vehicleNumber && <span className="flex items-center gap-1"><Truck size={11} /> {inv.vehicleNumber}</span>}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <p className="text-base font-bold text-slate-900">{fmt(total)}</p>
                        <span className={`${STATUS_COLORS[inv.status] || 'badge-gray'} capitalize`}>{inv.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="w-40">
                          <p className="whitespace-nowrap text-xs">
                            <span className="font-semibold text-emerald-700">{fmt(inv.paidAmount)} paid</span>
                            {inv.balanceDue > 0 && <span className="font-semibold text-rose-600"> · {fmt(inv.balanceDue)} due</span>}
                          </p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" title={`${paidPct.toFixed(0)}% paid`}>
                            <div className={`h-full rounded-full ${paidPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${paidPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== 'paid' && (
                            <button className="btn-secondary btn-sm mr-1 whitespace-nowrap" title="Add Payment"
                              onClick={() => { setShowPayModal(inv._id); setPayForm({ amount: inv.balanceDue, mode: 'cash', referenceNumber: '', notes: '', date: dayjs().format('YYYY-MM-DD') }); }}>
                              <CreditCard size={14} /> Receive
                            </button>
                          )}
                          <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(inv._id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer flex items-center justify-between gap-3">
          <span>Showing {filtered.length} of {invoices.length} invoices</span>
          <span className="font-semibold text-rose-600">
            Total Outstanding: {fmt(filtered.filter(i => i.status !== 'paid').reduce((s, i) => s + i.balanceDue, 0))}
          </span>
        </div>
      </section>

      {/* Invoice Form Modal */}
      {showForm && (
        <Modal
          title="New Invoice"
          subtitle="Create a sales invoice for a customer"
          onClose={() => setShowForm(false)}
          maxWidth="max-w-4xl"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
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
              <div>
                <label className="label">Plant</label>
                <select className="input" value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}>
                  <option value="">Select Plant</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Customer</label>
                <select className="input" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                  <option value="">Select Customer</option>
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
                  <th className="table-header">GST %</th>
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
                      <td className="px-2 py-1.5"><input type="number" {...NON_NEGATIVE} className="input w-20 py-1.5" placeholder="0" value={item.gstPercent} onChange={e => updateItem(idx, 'gstPercent', e.target.value)} /></td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold text-slate-800">{fmt(item.amount + item.gstAmount)}</td>
                      <td className="px-2 py-1.5"><button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Remove item" onClick={() => removeItem(idx)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModalSection>

          <ModalSection number={3} title="Charges & Total" tone="purple">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div>
                <label className="label">Transport Charges (₹)</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.transportCharges}
                  onChange={e => { const t = e.target.value; const tot = calcTotals(form.items, t, form.loadingCharges, form.discount); setForm(f => ({ ...f, transportCharges: t, ...tot })); }} />
              </div>
              <div>
                <label className="label">Loading Charges (₹)</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.loadingCharges}
                  onChange={e => { const l = e.target.value; const tot = calcTotals(form.items, form.transportCharges, l, form.discount); setForm(f => ({ ...f, loadingCharges: l, ...tot })); }} />
              </div>
              <div>
                <label className="label">Discount (₹)</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.discount}
                  onChange={e => { const d = e.target.value; const tot = calcTotals(form.items, form.transportCharges, form.loadingCharges, d); setForm(f => ({ ...f, discount: d, ...tot })); }} />
              </div>
            </div>

            <div className="mt-3 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-right md:mt-4 md:p-4">
              <div className="text-sm text-slate-600">Subtotal: <span className="font-semibold text-slate-800">{fmt(form.subtotal)}</span></div>
              <div className="text-sm text-slate-600">GST: <span className="font-semibold text-slate-800">{fmt(form.gstTotal)}</span></div>
              <div className="text-lg font-bold text-slate-900">Total: {fmt(form.totalAmount)}</div>
            </div>
          </ModalSection>

          <ModalSection number={4} title="Payment & Delivery" tone="emerald">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="label">Amount Paid Now (₹)</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
              <div>
                <label className="label">Payment Mode</label>
                <select className="input" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="label">Vehicle Number</label>
                <input className="input" placeholder="e.g. MH 04 AB 1234" value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">Driver Name</label>
                <input className="input" placeholder="Driver name" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Site / Delivery Address</label>
                <input className="input" placeholder="Delivery site address" value={form.siteAddress} onChange={e => setForm({ ...form, siteAddress: e.target.value })} />
              </div>
            </div>
          </ModalSection>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <Modal
          title="Record Payment"
          subtitle="Add a payment received against this invoice"
          onClose={() => setShowPayModal(null)}
          maxWidth="max-w-md"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowPayModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleAddPayment} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Record Payment
            </button>
          </>}
        >
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="label">Payment Date</label>
                <input type="date" className="input" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={payForm.mode} onChange={e => setPayForm({ ...payForm, mode: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="label">Reference / Cheque No.</label>
              <input className="input" placeholder="UTR / Cheque number" value={payForm.referenceNumber} onChange={e => setPayForm({ ...payForm, referenceNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
