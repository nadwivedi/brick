import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useOpenOnNew from '../hooks/useOpenOnNew';
import PurchaseFormModal from '../components/PurchaseFormModal';
import PartyPaymentModal from '../components/PartyPaymentModal';
import { balanceText, balanceClass } from '../components/BalanceCell';
import { PAID_TYPES, paidType } from '../lib/paidWith';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import PartyCell from '../components/PartyCell';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, ShoppingCart, CalendarDays, CreditCard, Scale, MapPin, Truck, Receipt, Send } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const qtyFmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// What the bill comes to: materials plus transport
const billOf = (p) => (p.totalAmount || 0) + (p.transportCharges || 0);

// Cash, part paid or on credit, by what was paid when the purchase was made
const typeOf = (p) => paidType(p.paidAmount, billOf(p));
const creditOf = (p) => Math.max(billOf(p) - (p.paidAmount || 0), 0);

const TYPE_FILTERS = [
  { key: '', label: 'All' },
  { key: 'cash', label: 'Cash' },
  { key: 'partial', label: 'Partial' },
  { key: 'credit', label: 'Credit' },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [plants, setPlants] = useState([]);
  const [parties, setParties] = useState([]);
  const [balances, setBalances] = useState({}); // party ledger balance per party id
  const [paying, setPaying] = useState(null); // party id the Pay Money popup starts on ('' = none picked)
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const manyPlants = hasManyPlants(plants);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, plantRes, partyRes, balRes] = await Promise.all([
        api.get('/purchases'), api.get('/plants'), api.get('/parties'), api.get('/party-balances'),
      ]);
      setPurchases(pRes.data || []);
      setPlants(plantRes.data || []);
      setParties((partyRes.data || []).sort((a, b) => a.name.localeCompare(b.name)));
      setBalances(balRes.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

  const handleDelete = async (p) => {
    if (!confirm(`Delete this purchase from ${p.vendor?.name || 'this party'}?${p.paidAmount > 0 ? ` The ${fmt(p.paidAmount)} paid with it is removed too.` : ''}`)) return;
    try {
      await api.delete(`/purchases/${p._id}`);
      fetchData();
    } catch (e) { alert(e.message || 'Could not delete the purchase'); }
  };

  const q = search.toLowerCase();
  const searched = purchases.filter(p =>
    (p.vendor?.name || '').toLowerCase().includes(q) ||
    (p.billNumber || '').toLowerCase().includes(q) ||
    (p.items || []).some(i => (i.material?.name || '').toLowerCase().includes(q))
  );
  const filtered = searched.filter(p => !typeFilter || typeOf(p) === typeFilter);
  const typeCounts = searched.reduce((acc, p) => ({ ...acc, [typeOf(p)]: (acc[typeOf(p)] || 0) + 1 }), {});

  const sumBills = (list) => list.reduce((t, p) => t + billOf(p), 0);
  const credit = (list) => list.reduce((t, p) => t + creditOf(p), 0);
  const monthPurchases = purchases.filter(p => dayjs(p.date).isSame(dayjs(), 'month'));
  // What is owed to parties right now: their ledger balance after every purchase and every payment made
  const payable = Object.values(balances).reduce((t, b) => t + Math.max(-(b.balance || 0), 0), 0);
  const owedParties = Object.values(balances).filter(b => b.balance < 0).length;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="This Month" hint={`${monthPurchases.length} purchase${monthPurchases.length === 1 ? '' : 's'} in ${dayjs().format('MMMM')}`} value={fmt(sumBills(monthPurchases))} tone="blue" />
        <StatCard icon={ShoppingCart} label="Total Purchases" hint={`${purchases.length} purchase${purchases.length === 1 ? '' : 's'} in all`} value={fmt(sumBills(purchases))} tone="indigo" />
        <StatCard icon={CreditCard} label="Bought on Credit" hint="Not paid at the time of purchase" value={fmt(credit(purchases))} tone="amber" />
        <StatCard icon={Scale} label="To Pay" hint={`You owe ${owedParties} part${owedParties === 1 ? 'y' : 'ies'}, after all payments`} value={fmt(payable)} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Material Purchases</h1>
              <p className="page-subtitle">Raw materials bought and what was paid with them. Money paid later goes against the party.</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-64 md:flex-none" value={search} onChange={setSearch} placeholder="Search party, bill no. or material..." />
              <button className="btn-secondary flex-shrink-0" onClick={() => setPaying('')} title="Record money paid to a party">
                <Send size={18} />
                <span className="hidden sm:inline">Pay Money</span>
              </button>
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Purchase</span>
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
          <LoadingState label="Loading purchases…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No purchases found" hint={search || typeFilter ? 'Try a different search or filter.' : 'Record your first raw material purchase.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Party</th>
                  <th className="table-header">Materials</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Paid at Purchase</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const bill = billOf(p);
                  const type = PAID_TYPES[typeOf(p)];
                  const partyId = p.vendor?._id;
                  const balance = balances[partyId]?.balance;
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
                        {partyId && balance !== undefined && (
                          <Link to={`/masters/parties/${partyId}/ledger`} className={`mt-1 block whitespace-nowrap pl-[52px] text-xs font-semibold hover:underline ${balanceClass(balance)}`} title="Open the party's ledger">
                            {balanceText(balance)}
                          </Link>
                        )}
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
                        <span className={type.badge}>{type.label}</span>
                      </td>
                      <td className="table-cell whitespace-nowrap text-xs">
                        {p.paidAmount > 0 && <p className="font-semibold text-rose-600">{fmt(p.paidAmount)} paid</p>}
                        {creditOf(p) > 0 && <p className="font-semibold text-slate-600">{fmt(creditOf(p))} on credit</p>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          {partyId && balance < 0 && (
                            <button className="btn-secondary btn-sm mr-1 whitespace-nowrap" title={`Record money paid to ${p.vendor?.name}`} onClick={() => setPaying(partyId)}>
                              <Send size={14} /> Pay
                            </button>
                          )}
                          <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(p)}>
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
          <span className="font-semibold text-slate-600">
            On credit in this list: {fmt(credit(filtered))}
          </span>
        </div>
      </section>

      {showForm && (
        <PurchaseFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}

      {/* Money paid is recorded against the party and lowers what you owe it, not one purchase */}
      {paying !== null && (
        <PartyPaymentModal type="vendor" parties={parties} partyId={paying} onClose={() => setPaying(null)} onSaved={fetchData} />
      )}
    </div>
  );
}
