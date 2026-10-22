import { useState, useEffect } from 'react';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useOpenOnNew from '../hooks/useOpenOnNew';
import PurchaseFormModal from '../components/PurchaseFormModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, ShoppingCart, CalendarDays, Wallet, Scale, MapPin, Truck, Receipt } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const qtyFmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// What the bill comes to: materials plus transport
const billOf = (p) => (p.totalAmount || 0) + (p.transportCharges || 0);

// Purchases have no stored status; it follows from what is still due
const statusOf = (p) => (p.balanceDue > 0 ? ((p.paidAmount || 0) > 0 ? 'partial' : 'unpaid') : 'paid');

const STATUS_COLORS = { unpaid: 'badge-orange', partial: 'badge-orange', paid: 'badge-green' };

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const manyPlants = hasManyPlants(plants);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, plantRes] = await Promise.all([api.get('/purchases'), api.get('/plants')]);
      setPurchases(pRes.data || []);
      setPlants(plantRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

  const handleDelete = async (id) => {
    if (!confirm('Delete purchase?')) return;
    await api.delete(`/purchases/${id}`);
    fetchData();
  };

  const q = search.toLowerCase();
  const searched = purchases.filter(p =>
    (p.vendor?.name || '').toLowerCase().includes(q) ||
    (p.billNumber || '').toLowerCase().includes(q) ||
    (p.items || []).some(i => (i.material?.name || '').toLowerCase().includes(q))
  );
  const filtered = searched.filter(p => !statusFilter || statusOf(p) === statusFilter);
  const statusCounts = searched.reduce((acc, p) => ({ ...acc, [statusOf(p)]: (acc[statusOf(p)] || 0) + 1 }), {});

  const sumBills = (list) => list.reduce((t, p) => t + billOf(p), 0);
  const sum = (list, key) => list.reduce((t, p) => t + (p[key] || 0), 0);
  const unpaid = purchases.filter(p => p.balanceDue > 0);
  const monthPurchases = purchases.filter(p => dayjs(p.date).isSame(dayjs(), 'month'));

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="This Month" hint={`${monthPurchases.length} purchase${monthPurchases.length === 1 ? '' : 's'} in ${dayjs().format('MMMM')}`} value={fmt(sumBills(monthPurchases))} tone="blue" />
        <StatCard icon={ShoppingCart} label="Total Purchases" hint={`${purchases.length} purchase${purchases.length === 1 ? '' : 's'} in all`} value={fmt(sumBills(purchases))} tone="indigo" />
        <StatCard icon={Wallet} label="Paid" hint="Paid along with the purchases" value={fmt(sum(purchases, 'paidAmount'))} tone="emerald" />
        <StatCard icon={Scale} label="To Pay" hint={`${unpaid.length} purchase${unpaid.length === 1 ? '' : 's'} not fully paid`} value={fmt(sum(unpaid, 'balanceDue'))} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Material Purchases</h1>
              <p className="page-subtitle">Raw materials bought, from whom, and how much is still to be paid</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search party, bill no. or material..." />
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Purchase</span>
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
          <LoadingState label="Loading purchases…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No purchases found" hint={search || statusFilter ? 'Try a different search or filter.' : 'Record your first raw material purchase.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Party</th>
                  <th className="table-header">Materials</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const bill = billOf(p);
                  const paidPct = bill > 0 ? Math.min(100, ((p.paidAmount || 0) / bill) * 100) : 100;
                  const status = statusOf(p);
                  const items = p.items || [];
                  const names = items.map(i => i.material?.name).filter(Boolean);
                  return (
                    <tr key={p._id} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-bold text-slate-800">{dayjs(p.date).format('DD MMM YYYY')}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          {p.billNumber ? <><Receipt size={11} /> Bill {p.billNumber}</> : dayjs(p.date).format('dddd')}
                        </p>
                      </td>
                      <td className="table-cell">
                        <PartyCell name={p.vendor?.name} mobile={p.vendor?.mobile} />
                      </td>
                      <td className="table-cell">
                        <div className="max-w-[240px]">
                          {/* First material in full, the rest as names */}
                          {items[0] && (
                            <p className="truncate font-semibold text-slate-800">
                              {items[0].material?.name || '-'}{' '}
                              <span className="font-normal text-slate-500">· {qtyFmt(items[0].quantity)} {items[0].unit || items[0].material?.unit} @ {fmt(items[0].rate)}</span>
                            </p>
                          )}
                          {items.length > 1 && (
                            <p className="truncate text-xs text-slate-500" title={names.join(', ')}>+ {names.slice(1).join(', ')}</p>
                          )}
                          {((manyPlants && p.plant?.name) || p.transportCharges > 0) && (
                            <p className="flex items-center gap-2 truncate text-xs text-slate-400">
                              {manyPlants && p.plant?.name && <span className="flex items-center gap-1"><MapPin size={11} /> {p.plant.name}</span>}
                              {p.transportCharges > 0 && <span className="flex items-center gap-1"><Truck size={11} /> {fmt(p.transportCharges)} transport</span>}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <p className="text-base font-bold text-slate-900">{fmt(bill)}</p>
                        <span className={`${STATUS_COLORS[status]} capitalize`}>{status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="w-40">
                          <p className="whitespace-nowrap text-xs">
                            <span className="font-semibold text-emerald-700">{fmt(p.paidAmount)} paid</span>
                            {p.balanceDue > 0 && <span className="font-semibold text-rose-600"> · {fmt(p.balanceDue)} due</span>}
                          </p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" title={`${paidPct.toFixed(0)}% paid`}>
                            <div className={`h-full rounded-full ${paidPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${paidPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-end">
                          <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(p._id)}>
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
          <span>Showing {filtered.length} of {purchases.length} purchases</span>
          <span className="font-semibold text-rose-600">
            Total To Pay: {fmt(filtered.reduce((s, p) => s + Math.max(p.balanceDue || 0, 0), 0))}
          </span>
        </div>
      </section>

      {showForm && (
        <PurchaseFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
    </div>
  );
}
