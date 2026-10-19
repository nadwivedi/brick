import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Edit2, Plus, Trash2, Users, HandCoins, Send } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../lib/api';
import PartyCell from '../components/PartyCell';
import PartyFormModal from '../components/PartyFormModal';
import { PARTY_TYPES } from '../lib/partyTypes';
import SearchInput from '../components/SearchInput';
import Segmented from '../components/Segmented';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// Wording for each type: what we do with them, and which way the balance runs
const TYPE_INFO = {
  customer: { badge: 'badge-blue', business: 'sale', paidLabel: 'received', owes: 'to receive', ledger: '/masters/customers' },
  vendor: { badge: 'badge-orange', business: 'purchase', paidLabel: 'paid', owes: 'to pay', ledger: '/masters/vendors' },
};

const SEARCH_KEYS = ['name', 'mobile', 'address', 'gstin'];

/** Customers and vendors in one list, like the party master in the crusher app. */
export default function PartiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = PARTY_TYPES[searchParams.get('type')] ? searchParams.get('type') : 'all';
  const [parties, setParties] = useState([]);
  // Billed, paid and balance per party id, for each type
  const [balances, setBalances] = useState({ customer: {}, vendor: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = adding, party = editing
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/customers'), api.get('/vendors'),
      api.get('/party-balances/customer'), api.get('/party-balances/vendor'),
    ])
      .then(([customers, vendors, customerBalances, vendorBalances]) => {
        setParties([
          ...(customers.data || []).map(p => ({ ...p, type: 'customer' })),
          ...(vendors.data || []).map(p => ({ ...p, type: 'vendor' })),
        ].sort((a, b) => a.name.localeCompare(b.name)));
        setBalances({ customer: customerBalances.data || {}, vendor: vendorBalances.data || {} });
      })
      .catch(e => toast.error(e.message || 'Could not load parties'))
      .finally(() => setLoading(false));
  }, [reload]);

  const of = (p) => balances[p.type][p._id] || { billed: 0, paid: 0, balance: p.openingBalance || 0, count: 0, lastDate: null };
  const ledgerPath = (p) => `${TYPE_INFO[p.type].ledger}/${p._id}/ledger`;

  const setFilter = (key) => setSearchParams(key === 'all' ? {} : { type: key }, { replace: true });

  const handleDelete = async (p) => {
    if (!confirm(`Delete party "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`${PARTY_TYPES[p.type].endpoint}/${p._id}`);
      toast.success('Party deleted');
      setReload(n => n + 1);
    } catch (e) { toast.error(e.message || 'Could not delete this party'); }
  };

  const count = (type) => parties.filter(p => p.type === type).length;
  const totalOwed = (type) => parties.filter(p => p.type === type).reduce((t, p) => t + Math.max(of(p).balance, 0), 0);
  const owingCount = (type) => parties.filter(p => p.type === type && of(p).balance > 0).length;

  const q = search.toLowerCase();
  const filtered = parties.filter(p =>
    (filter === 'all' || p.type === filter) &&
    SEARCH_KEYS.some(key => String(p[key] || '').toLowerCase().includes(q))
  );

  const filters = [
    { key: 'all', label: `All (${parties.length})` },
    { key: 'customer', label: `Customers (${count('customer')})` },
    { key: 'vendor', label: `Vendors (${count('vendor')})` },
  ];

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:gap-4">
        <StatCard icon={Users} label="Parties" hint={`${count('customer')} customers · ${count('vendor')} vendors`} value={parties.length} tone="blue" />
        <StatCard icon={HandCoins} label="To Receive" hint={`${owingCount('customer')} customer${owingCount('customer') === 1 ? '' : 's'} still to pay`} value={fmt(totalOwed('customer'))} tone="emerald" />
        <StatCard icon={Send} label="To Pay" hint={`${owingCount('vendor')} vendor${owingCount('vendor') === 1 ? '' : 's'} to be paid`} value={fmt(totalOwed('vendor'))} tone="rose" />
      </section>

      <section className="panel">
        <div className="panel-header space-y-3">
          <div className="page-header">
            <div className="min-w-0">
              <h1 className="page-title">Parties</h1>
              <p className="page-subtitle">Everyone you buy from or sell to, and what is due with each</p>
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
            title={search ? `No parties match "${search}"` : 'No parties yet'}
            hint={search ? 'Try a different search.' : 'Use "Add Party" to add a customer or vendor.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Party</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Address</th>
                  <th className="table-header">Business</th>
                  <th className="table-header">Paid / Received</th>
                  <th className="table-header">Balance</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const info = TYPE_INFO[p.type];
                  const b = of(p);
                  return (
                    <tr key={p._id} className="table-row cursor-pointer" onClick={() => navigate(ledgerPath(p))}>
                      <td className="table-cell font-semibold text-slate-800"><PartyCell name={p.name} mobile={p.mobile} /></td>
                      <td className="table-cell"><span className={info.badge}>{PARTY_TYPES[p.type].label}</span></td>
                      <td className="table-cell">
                        <div className="max-w-[200px]">
                          <p className="truncate" title={p.address}>{p.address || '-'}</p>
                          {p.gstin && <p className="truncate text-xs text-slate-400">GSTIN {p.gstin}</p>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{fmt(b.billed)}</p>
                          <p className="text-xs text-slate-400">
                            {b.count ? `${b.count} ${info.business}${b.count === 1 ? '' : 's'} · last ${dayjs(b.lastDate).format('D MMM')}` : `No ${info.business}s yet`}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="whitespace-nowrap font-semibold text-emerald-700">{fmt(b.paid)}</p>
                        <p className="text-xs text-slate-400">{info.paidLabel}</p>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {b.balance > 0
                          ? <><p className="font-bold text-rose-600">{fmt(b.balance)}</p><p className="text-xs text-slate-400">{info.owes}</p></>
                          : b.balance < 0
                            ? <><p className="font-bold text-emerald-700">{fmt(-b.balance)}</p><p className="text-xs text-slate-400">advance</p></>
                            : <span className="badge-green">Settled</span>}
                        {p.creditLimit > 0 && (
                          <p className={`text-xs ${b.balance > p.creditLimit ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                            {b.balance > p.creditLimit ? 'Over limit of ' : 'Limit '}{fmt(p.creditLimit)}
                          </p>
                        )}
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
          defaultType={filter === 'vendor' ? 'vendor' : 'customer'}
          onClose={() => setEditing(null)}
          onSaved={() => setReload(n => n + 1)}
        />
      )}
    </div>
  );
}
