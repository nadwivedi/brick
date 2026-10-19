import { useState, useEffect } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import useOpenOnNew from '../hooks/useOpenOnNew';
import PartyFormModal from '../components/PartyFormModal';
import Modal, { ModalSection } from '../components/Modal';
import SearchInput from '../components/SearchInput';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [plants, setPlants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addingVendor, setAddingVendor] = useState(false); // inline "+ New Party" popup over the purchase form
  useEscapeKey(showForm && !addingVendor, () => setShowForm(false));
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    vendor: '', plant: '',
    items: [{ material: '', quantity: '', unit: 'kg', rate: '', amount: 0 }],
    totalAmount: 0, transportCharges: 0, paidAmount: 0, paymentMode: 'credit', billNumber: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, vRes, plRes, mRes] = await Promise.all([
        api.get('/purchases'), api.get('/vendors'), api.get('/plants'), api.get('/materials')
      ]);
      setPurchases(pRes.data || []);
      setVendors(vRes.data || []);
      setPlants(plRes.data || []);
      setMaterials(mRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx][key] = val;
    if (key === 'quantity' || key === 'rate') {
      items[idx].amount = (parseFloat(items[idx].quantity) || 0) * (parseFloat(items[idx].rate) || 0);
    }
    if (key === 'material') {
      const mat = materials.find(m => m._id === val);
      if (mat) items[idx].unit = mat.unit;
    }
    const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    setForm({ ...form, items, totalAmount: total });
  };

  const openForm = () => {
    setForm({
      date: dayjs().format('YYYY-MM-DD'),
      vendor: '', plant: plants[0]?._id || '',
      items: [{ material: '', quantity: '', unit: 'kg', rate: '', amount: 0 }],
      totalAmount: 0, transportCharges: 0, paidAmount: 0, paymentMode: 'credit', billNumber: '', notes: ''
    });
    setShowForm(true);
  };

  useOpenOnNew(!loading, openForm);

  const handleSave = async () => {
    // Blank rows are ignored; everything the purchase needs must be filled in
    const items = form.items.filter(i => i.material);
    const problem =
      !form.vendor ? 'Select a vendor' :
      !form.plant ? 'Select a plant' :
      items.length === 0 ? 'Add at least one material' :
      items.some(i => !(Number(i.quantity) > 0)) ? 'Enter the quantity for each material' :
      items.some(i => i.rate === '' || Number(i.rate) < 0) ? 'Enter the rate for each material' : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      await api.post('/purchases', {
        ...form,
        items: items.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate) })),
        totalAmount: items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0),
        transportCharges: Number(form.transportCharges) || 0,
        paidAmount: Number(form.paidAmount) || 0,
      });
      setShowForm(false);
      fetchData();
    } catch (e) { alert(e.message || 'Error'); }
    setSaving(false);
  };

  const filtered = purchases.filter(p =>
    (p.vendor?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 fade-in">
      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Material Purchases</h1>
              <p className="page-subtitle">Record raw material purchases from vendors</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search by vendor..." />
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Purchase</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading purchases…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No purchases found" hint={search ? 'Try a different search.' : 'Record your first raw material purchase.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr>
                <th className="table-header">Date</th>
                <th className="table-header">Vendor</th>
                <th className="table-header">Materials</th>
                <th className="table-header">Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Bill No.</th>
                <th className="table-header text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell whitespace-nowrap">{dayjs(p.date).format('DD MMM YYYY')}</td>
                    <td className="table-cell font-semibold text-slate-800">{p.vendor?.name}</td>
                    <td className="table-cell">{p.items?.map(i => i.material?.name || '').join(', ')}</td>
                    <td className="table-cell font-semibold text-slate-800">{fmt(p.totalAmount)}</td>
                    <td className="table-cell text-emerald-700">{fmt(p.paidAmount)}</td>
                    <td className="table-cell font-semibold text-rose-600">{fmt(p.balanceDue)}</td>
                    <td className="table-cell">{p.billNumber || '-'}</td>
                    <td className="table-cell">
                      <div className="flex justify-end">
                        <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={async () => {
                          if (confirm('Delete purchase?')) { await api.delete(`/purchases/${p._id}`); fetchData(); }
                        }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="table-footer">Showing {filtered.length} of {purchases.length} purchases</p>
      </section>

      {showForm && (
        <Modal
          title="New Purchase"
          subtitle="Record raw materials bought from a vendor"
          onClose={() => setShowForm(false)}
          maxWidth="max-w-3xl"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Purchase
            </button>
          </>}
        >
          <ModalSection number={1} title="Purchase Details" tone="blue">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="label">Bill Number</label><input className="input" placeholder="Bill no." value={form.billNumber} onChange={e => setForm({ ...form, billNumber: e.target.value })} /></div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="label mb-0">Vendor</label>
                  <button type="button" onClick={() => setAddingVendor(true)} className="text-xs font-semibold text-primary-600 hover:underline">+ New Party</button>
                </div>
                <select className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div><label className="label">Plant</label>
                <select className="input" value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}>
                  <option value="">Select Plant</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </ModalSection>

          <ModalSection
            number={2}
            title="Materials"
            tone="slate"
            action={
              <button className="btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, { material: '', quantity: '', unit: 'kg', rate: '', amount: 0 }] }))}>
                <Plus size={14} /> Add Item
              </button>
            }
          >
            {form.items.map((item, idx) => {
              // Quantity and rate are always in the selected material's own unit
              const unit = materials.find(m => m._id === item.material)?.unit || '';
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.rate) || 0;
              return (
                <div key={idx} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 last:mb-0">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end md:gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="label">Material</label>
                      <select className="input" value={item.material} onChange={e => updateItem(idx, 'material', e.target.value)}>
                        <option value="">Select Material</option>
                        {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{unit ? `How many ${unit}?` : 'Quantity'}</label>
                      <div className="relative">
                        <input type="number" {...NON_NEGATIVE} className="input pr-14 font-semibold" placeholder="0" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">{unit || 'unit'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">{unit ? `Rate per ${unit}` : 'Rate per unit'}</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">₹</span>
                        <input type="number" {...NON_NEGATIVE} className="input pl-7 pr-14 font-semibold" placeholder="0" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">/ {unit || 'unit'}</span>
                      </div>
                    </div>
                    <button className="icon-btn col-span-2 justify-self-end hover:bg-red-50 hover:text-red-600 md:col-span-1 md:mb-0.5" title="Remove item" onClick={() => setForm(f => { const items = f.items.filter((_, i) => i !== idx); const total = items.reduce((s, i) => s + i.amount, 0); return { ...f, items, totalAmount: total }; })}><Trash2 size={16} /></button>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <span>{qty.toLocaleString('en-IN')} {unit || 'unit'} × {fmt(rate)} per {unit || 'unit'}</span>
                    <span className="text-sm font-bold text-slate-900">= {fmt(item.amount)}</span>
                  </p>
                </div>
              );
            })}
          </ModalSection>

          <ModalSection number={3} title="Payment Information" tone="purple">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div><label className="label">Transport Charges (₹)</label><input type="number" {...NON_NEGATIVE} className="input font-semibold" value={form.transportCharges} onChange={e => setForm({ ...form, transportCharges: e.target.value })} /></div>
              <div><label className="label">Amount Paid (₹)</label><input type="number" {...NON_NEGATIVE} className="input font-semibold" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} /></div>
              <div><label className="label">Payment Mode</label>
                <select className="input" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="credit">Credit</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-right md:mt-4 md:p-4">
              <p className="text-lg font-bold text-slate-900">Total: {fmt(form.totalAmount)}</p>
              <p className="text-sm text-slate-600">Balance Due: <span className="font-semibold text-rose-600">{fmt(form.totalAmount - (parseFloat(form.paidAmount) || 0))}</span></p>
            </div>
          </ModalSection>
        </Modal>
      )}

      {/* New vendor from the purchase form; it is selected once saved */}
      {addingVendor && (
        <PartyFormModal
          fixedType="vendor"
          onClose={() => setAddingVendor(false)}
          onSaved={party => {
            setVendors(list => [...list, party].sort((a, b) => a.name.localeCompare(b.name)));
            setForm(f => ({ ...f, vendor: party._id }));
          }}
        />
      )}
    </div>
  );
}
