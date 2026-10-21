import { useState, useEffect } from 'react';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useEscapeKey from '../hooks/useEscapeKey';
import useOpenOnNew from '../hooks/useOpenOnNew';
import SaleFormModal from '../components/SaleFormModal';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { modeLabel } from '../lib/transport';
import AccountPicker, { modeForAccount } from '../components/AccountPicker';
import useAccounts from '../hooks/useAccounts';
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
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  useEscapeKey(!!showPayModal, () => setShowPayModal(null));
  const manyPlants = hasManyPlants(plants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', account: '', mode: '', referenceNumber: '', notes: '', date: dayjs().format('YYYY-MM-DD') });
  const { accounts, defaultAccountId } = useAccounts();
  const accountOf = (id) => accounts.find(a => a._id === (id || defaultAccountId));
  const payMode = modeForAccount(accountOf(payForm.account), payForm.mode);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, plantRes] = await Promise.all([
        api.get('/invoices', { params: { limit: 1000 } }),
        api.get('/plants'),
      ]);
      setInvoices(invRes.data || []);
      setPlants(plantRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

  const handleAddPayment = async () => {
    setSaving(true);
    try {
      await api.post(`/invoices/${showPayModal}/payment`, { ...payForm, account: accountOf(payForm.account)?._id, mode: payMode });
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
                            {manyPlants && inv.plant?.name && <span className="flex items-center gap-1"><MapPin size={11} /> {inv.plant.name}</span>}
                            {(inv.vehicleNumber || inv.transportMode === 'hired' || inv.transportMode === 'own') && (
                              <span className="flex items-center gap-1" title={inv.transportMode === 'hired' ? `Hired from ${inv.transporter?.name || '-'} · ${fmt(inv.transportCost)} to pay` : ''}>
                                <Truck size={11} /> {[inv.vehicleNumber, inv.transportMode && inv.transportMode !== 'party' ? modeLabel(inv.transportMode) : ''].filter(Boolean).join(' · ')}
                              </span>
                            )}
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
                              onClick={() => { setShowPayModal(inv._id); setPayForm({ amount: inv.balanceDue, account: '', mode: '', referenceNumber: '', notes: '', date: dayjs().format('YYYY-MM-DD') }); }}>
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

      {showForm && (
        <SaleFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
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
            <AccountPicker label="Received In" accounts={accounts} defaultAccountId={defaultAccountId}
              account={payForm.account} mode={payForm.mode}
              onChange={picked => setPayForm({ ...payForm, ...picked })} />
            {payMode !== 'cash' && (
              <div>
                <label className="label">{payMode === 'cheque' ? 'Cheque No.' : 'Reference / UTR No.'} (optional)</label>
                <input className="input" placeholder={payMode === 'cheque' ? 'Cheque number' : 'UPI / bank reference number'} value={payForm.referenceNumber} onChange={e => setPayForm({ ...payForm, referenceNumber: e.target.value })} />
              </div>
            )}
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
