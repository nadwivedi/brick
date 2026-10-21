import { useState, useEffect } from 'react';
import api from '../lib/api';
import useOpenOnNew from '../hooks/useOpenOnNew';
import PurchaseFormModal from '../components/PurchaseFormModal';
import SearchInput from '../components/SearchInput';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/purchases');
      setPurchases(pRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

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
              <p className="page-subtitle">Record raw material purchases from parties</p>
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
        <PurchaseFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
    </div>
  );
}
