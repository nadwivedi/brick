import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useOpenOnNew from '../hooks/useOpenOnNew';
import SaleFormModal from '../components/SaleFormModal';
import PartyPaymentModal from '../components/PartyPaymentModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { balanceText, balanceClass } from '../components/BalanceCell';
import { modeLabel } from '../lib/transport';
import { PAID_TYPES, paidType } from '../lib/paidWith';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, HandCoins, FileText, CreditCard, Scale, CalendarDays, MapPin, Truck } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const TYPE_FILTERS = [
  { key: '', label: 'All' },
  { key: 'cash', label: 'Cash' },
  { key: 'partial', label: 'Partial' },
  { key: 'credit', label: 'Credit' },
];

// Draft and cancelled invoices are not sales
const NOT_SOLD = ['draft', 'cancelled'];

export default function SalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [plants, setPlants] = useState([]);
  const [parties, setParties] = useState([]);
  const [balances, setBalances] = useState({}); // party ledger balance per party id
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // invoice open in the edit popup
  const [receiving, setReceiving] = useState(null); // party id the Receive Money popup starts on ('' = none picked)
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const manyPlants = hasManyPlants(plants);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, plantRes, partyRes, balRes] = await Promise.all([
        api.get('/invoices', { params: { limit: 1000 } }),
        api.get('/plants'),
        api.get('/parties'),
        api.get('/party-balances'),
      ]);
      setInvoices(invRes.data || []);
      setPlants(plantRes.data || []);
      setParties((partyRes.data || []).sort((a, b) => a.name.localeCompare(b.name)));
      setBalances(balRes.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

  const handleDelete = async (inv) => {
    if (!confirm(`Delete invoice ${inv.invoiceNumber}?${inv.paidAmount > 0 ? ` The ${fmt(inv.paidAmount)} received with it is removed too.` : ''}`)) return;
    try {
      await api.delete(`/invoices/${inv._id}`);
      fetchData();
    } catch (e) { alert(e.message || 'Could not delete the invoice'); }
  };

  const typeOf = (inv) => paidType(inv.paidAmount, inv.totalAmount);
  const creditOf = (inv) => Math.max((inv.totalAmount || 0) - (inv.paidAmount || 0), 0);

  const q = search.toLowerCase();
  const searched = invoices.filter(inv =>
    (inv.customer?.name || '').toLowerCase().includes(q) ||
    (inv.invoiceNumber || '').toLowerCase().includes(q)
  );
  const filtered = searched.filter(inv => !typeFilter || (!NOT_SOLD.includes(inv.status) && typeOf(inv) === typeFilter));
  const typeCounts = searched.filter(i => !NOT_SOLD.includes(i.status)).reduce((acc, inv) => ({ ...acc, [typeOf(inv)]: (acc[typeOf(inv)] || 0) + 1 }), {});

  const sold = invoices.filter(i => !NOT_SOLD.includes(i.status));
  const total = (list) => list.reduce((t, i) => t + (i.totalAmount || 0), 0);
  const credit = (list) => list.reduce((t, i) => t + creditOf(i), 0);
  const monthSales = sold.filter(i => dayjs(i.date).isSame(dayjs(), 'month'));
  const creditSales = sold.filter(i => typeOf(i) !== 'cash');
  // What parties owe right now: their ledger balance after every sale and every payment received
  const receivable = Object.values(balances).reduce((t, b) => t + Math.max(b.balance || 0, 0), 0);
  const owingParties = Object.values(balances).filter(b => b.balance > 0).length;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="This Month" hint={`${monthSales.length} invoice${monthSales.length === 1 ? '' : 's'} in ${dayjs().format('MMMM')}`} value={fmt(total(monthSales))} tone="blue" />
        <StatCard icon={FileText} label="Total Sales" hint={`${sold.length} invoice${sold.length === 1 ? '' : 's'} in all`} value={fmt(total(sold))} tone="indigo" />
        <StatCard icon={CreditCard} label="Sold on Credit" hint="Not received at the time of sale" value={fmt(credit(creditSales))} tone="amber" />
        <StatCard icon={Scale} label="To Receive" hint={`${owingParties} part${owingParties === 1 ? 'y owes' : 'ies owe'} you, after all payments`} value={fmt(receivable)} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Sales & Invoices</h1>
              <p className="page-subtitle">Every sale and what was received with it. Money received later goes against the party.</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-64 md:flex-none" value={search} onChange={setSearch} placeholder="Search party or invoice no..." />
              <button className="btn-secondary flex-shrink-0" onClick={() => setReceiving('')} title="Record money received from a party">
                <HandCoins size={18} />
                <span className="hidden sm:inline">Receive Money</span>
              </button>
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Cash / credit filter */}
          <div className="scrollbar-hide mt-2.5 flex gap-2 overflow-x-auto">
            {TYPE_FILTERS.map(({ key, label }) => {
              const active = typeFilter === key;
              const count = key ? typeCounts[key] || 0 : searched.length;
              return (
                <button
                  key={key || 'all'}
                  type="button"
                  onClick={() => setTypeFilter(key)}
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
          <EmptyState icon={FileText} title="No invoices found" hint={search || typeFilter ? 'Try a different search or filter.' : 'Create your first invoice to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Party</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Paid at Sale</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const pieces = (inv.items || []).reduce((t, i) => t + (i.quantity || 0), 0);
                  const names = [...new Set((inv.items || []).map(i => i.product?.name).filter(Boolean))];
                  const type = PAID_TYPES[typeOf(inv)];
                  const notSold = NOT_SOLD.includes(inv.status);
                  const partyId = inv.customer?._id;
                  const balance = balances[partyId]?.balance;
                  return (
                    <tr key={inv._id} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-bold text-primary-700">{inv.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">{dayjs(inv.date).format('DD MMM YYYY')} · {dayjs(inv.date).format('ddd')}</p>
                      </td>
                      <td className="table-cell">
                        <PartyCell name={inv.customer?.name} mobile={inv.customer?.mobile} />
                        {/* Only what the party owes us; what we owe them is in their ledger */}
                        {partyId && balance > 0 && (
                          <Link to={`/masters/parties/${partyId}/ledger`} className={`mt-1 block whitespace-nowrap pl-[52px] text-xs font-semibold hover:underline ${balanceClass(balance)}`} title="Open the party's ledger">
                            {balanceText(balance)}
                          </Link>
                        )}
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
                        <p className="text-base font-bold text-slate-900">{fmt(inv.totalAmount)}</p>
                        {notSold
                          ? <span className="badge-gray capitalize">{inv.status}</span>
                          : <span className={type.badge}>{type.label}</span>}
                      </td>
                      <td className="table-cell whitespace-nowrap text-xs">
                        {inv.paidAmount > 0 && <p className="font-semibold text-emerald-700">{fmt(inv.paidAmount)} received</p>}
                        {creditOf(inv) > 0 && <p className="font-semibold text-slate-600">{fmt(creditOf(inv))} on credit</p>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          {partyId && balance > 0 && (
                            <button className="btn-secondary btn-sm mr-1 whitespace-nowrap" title={`Record money received from ${inv.customer?.name}`} onClick={() => setReceiving(partyId)}>
                              <HandCoins size={14} /> Receive
                            </button>
                          )}
                          <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => setEditingId(inv._id)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(inv)}>
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
          <span className="font-semibold text-slate-600">
            On credit in this list: {fmt(credit(filtered.filter(i => !NOT_SOLD.includes(i.status))))}
          </span>
        </div>
      </section>

      {showForm && (
        <SaleFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
      {editingId && (
        <SaleFormModal invoiceId={editingId} onClose={() => setEditingId(null)} onSaved={() => { setEditingId(null); fetchData(); }} />
      )}

      {/* Money received is recorded against the party and lowers its balance, not one invoice */}
      {receiving !== null && (
        <PartyPaymentModal type="customer" parties={parties} partyId={receiving} onClose={() => setReceiving(null)} onSaved={fetchData} />
      )}
    </div>
  );
}
