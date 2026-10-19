import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Edit2, Plus, Trash2, Users, HandCoins, Send } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../lib/api';
import PartyCell from '../components/PartyCell';
import PartyFormModal from '../components/PartyFormModal';
import SearchInput from '../components/SearchInput';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const SEARCH_KEYS = ['name', 'mobile', 'address', 'gstin'];
// Balance filters: positive balance = they owe us, negative = we owe them
const FILTERS = {
  all: () => true,
  receive: (b) => b > 0,
  pay: (b) => b < 0,
  settled: (b) => b === 0,
};

/** Everyone you sell to or buy from, in one list, like the party master in the crusher app. */
export default function PartiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS[searchParams.get('show')] ? searchParams.get('show') : 'all';
  const [parties, setParties] = useState([]);
  const [balances, setBalances] = useState({}); // sales, purchases, payments and balance per party id
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = adding, party = editing
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/parties'), api.get('/party-balances')])
      .then(([partiesRes, balancesRes]) => {
        setParties((partiesRes.data || []).sort((a, b) => a.name.localeCompare(b.name)));
        setBalances(balancesRes.data || {});
      })
      .catch(e => toast.error(e.message || 'Could not load parties'))
      .finally(() => setLoading(false));
  }, [reload]);

  const of = (p) => balances[p._id] || { sales: 0, salesCount: 0, received: 0, purchases: 0, purchaseCount: 0, paid: 0, balance: p.openingBalance || 0, lastDate: null };
  const ledgerPath = (p) => `/masters/parties/${p._id}/ledger`;

  const setFilter = (key) => setSearchParams(key === 'all' ? {} : { show: key }, { replace: true });

  const handleDelete = async (p) => {
    if (!confirm(`Delete party "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/parties/${p._id}`);
      toast.success('Party deleted');
      setReload(n => n + 1);
    } catch (e) { toast.error(e.message || 'Could not delete this party', { duration: 6000 }); }
  };

  const countWhere = (test) => parties.filter(p => test(of(p).balance)).length;
  const toReceive = parties.reduce((t, p) => t + Math.max(of(p).balance, 0), 0);
  const toPay = parties.reduce((t, p) => t + Math.max(-of(p).balance, 0), 0);

  const q = search.toLowerCase();
  const filtered = parties.filter(p =>
    FILTERS[filter](of(p).balance) &&
    SEARCH_KEYS.some(key => String(p[key] || '').toLowerCase().includes(q))
  );

  const filters = [
    { key: 'all', label: `All (${parties.length})` },
    { key: 'receive', label: `To Receive (${countWhere(FILTERS.receive)})` },
    { key: 'pay', label: `To Pay (${countWhere(FILTERS.pay)})` },
    { key: 'settled', label: `Settled (${countWhere(FILTERS.settled)})` },
  ];

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:gap-4">
        <StatCard icon={Users} label="Parties" hint={`${parties.filter(p => p.isActive).length} active`} value={parties.length} tone="blue" />
        <StatCard icon={HandCoins} label="To Receive" hint={`${plural(countWhere(FILTERS.receive), 'party', 'parties')} owe you`} value={fmt(toReceive)} tone="emerald" />
        <StatCard icon={Send} label="To Pay" hint={`You owe ${plural(countWhere(FILTERS.pay), 'party', 'parties')}`} value={fmt(toPay)} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header space-y-3">
          <div className="page-header">
            <div className="min-w-0">
              <h1 className="page-title">Parties</h1>
              <p className="page-subtitle">Everyone you sell bricks to or buy material from, and what is due with each</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search parties..." />
              <button className="btn-primary flex-shrink-0" onClick={() => setEditing({})}>
                <Plus size={18} />
                <span className="hidden sm:inline">Add Party</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
          <Segmented options={filters} value={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <LoadingState label="Loading parties…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? `No parties match "${search}"` : filter === 'all' ? 'No parties yet' : 'No parties here'}
            hint={search ? 'Try a different search.' : filter === 'all' ? 'Use "Add Party" to add someone you sell to or buy from.' : 'Try another filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Party</th>
                  <th className="table-header">Address</th>
                  <th className="table-header">Sold to them</th>
                  <th className="table-header">Bought from them</th>
                  <th className="table-header">Balance</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const b = of(p);
                  return (
                    <tr key={p._id} className="table-row cursor-pointer" onClick={() => navigate(ledgerPath(p))}>
                      <td className="table-cell font-semibold text-slate-800">
                        <PartyCell name={p.name} mobile={p.mobile} />
                      </td>
                      <td className="table-cell">
                        <div className="max-w-[200px]">
                          <p className="truncate" title={p.address}>{p.address || '-'}</p>
                          {p.gstin && <p className="truncate text-xs text-slate-400">GSTIN {p.gstin}</p>}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {b.salesCount ? (
                          <>
                            <p className="font-semibold text-slate-800">{fmt(b.sales)}</p>
                            <p className="text-xs text-slate-400">{plural(b.salesCount, 'sale')} · {fmt(b.received)} received</p>
                          </>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {b.purchaseCount ? (
                          <>
                            <p className="font-semibold text-slate-800">{fmt(b.purchases)}</p>
                            <p className="text-xs text-slate-400">{plural(b.purchaseCount, 'purchase')} · {fmt(b.paid)} paid</p>
                          </>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {b.balance > 0
                          ? <><p className="font-bold text-emerald-700">{fmt(b.balance)}</p><p className="text-xs text-slate-400">to receive</p></>
                          : b.balance < 0
                            ? <><p className="font-bold text-rose-600">{fmt(-b.balance)}</p><p className="text-xs text-slate-400">to pay</p></>
                            : <span className="badge-green">Settled</span>}
                        {p.creditLimit > 0 && (
                          <p className={`text-xs ${b.balance > p.creditLimit ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                            {b.balance > p.creditLimit ? 'Over limit of ' : 'Limit '}{fmt(p.creditLimit)}
                          </p>
                        )}
                        {b.lastDate && <p className="text-[11px] text-slate-400">Last entry {dayjs(b.lastDate).format('D MMM')}</p>}
                      </td>
                      <td className="table-cell"><span className={p.isActive ? 'badge-green' : 'badge-gray'}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="table-cell" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link className="btn-secondary btn-sm mr-1 whitespace-nowrap" to={ledgerPath(p)}>
                            <BookOpen size={14} /> Ledger
                          </Link>
                          <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => setEditing(p)}>
                            <Edit2 size={16} />
                          </button>
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
        <p className="table-footer">Showing {filtered.length} of {parties.length} parties</p>
      </section>

      {editing && (
        <PartyFormModal
          party={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => setReload(n => n + 1)}
        />
      )}
    </div>
  );
}
