import { useState, useEffect } from 'react';
import api from '../lib/api';
import useOpenOnNew from '../hooks/useOpenOnNew';
import ExpenseFormModal from '../components/ExpenseFormModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import useAccounts from '../hooks/useAccounts';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, Wallet } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const SUMMARY_TONES = ['blue', 'emerald', 'amber', 'rose'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const { accounts } = useAccounts();
  const accountName = (id) => accounts.find(a => a._id === id)?.name;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([api.get('/expenses'), api.get('/expense-categories')]);
      setExpenses(eRes.data || []);
      setCategories((cRes.data || []).map(c => c.name));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openForm = () => setShowForm(true);
  useOpenOnNew(!loading, openForm);

  const searched = expenses
    .filter(e => (e.description || '').toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase()));
  const filtered = searched.filter(e => !catFilter || e.category === catFilter);
  const catCounts = searched.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + 1 }), {});

  const totalFiltered = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Summary Cards */}
      {categories.length > 0 && (
        <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
          {categories.slice(0, 4).map((cat, i) => {
            const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
            return <StatCard key={cat} icon={Wallet} label={cat} value={fmt(total)} tone={SUMMARY_TONES[i]} />;
          })}
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Expenses</h1>
              <p className="page-subtitle">Track all operational expenses</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search expenses..." />
              <button className="btn-primary flex-shrink-0" onClick={openForm}>
                <Plus size={18} />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div className="scrollbar-hide mt-2.5 flex gap-2 overflow-x-auto">
            {['', ...categories].map(cat => {
              const active = catFilter === cat;
              const count = cat ? catCounts[cat] || 0 : searched.length;
              return (
                <button
                  key={cat || 'all'}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {cat || 'All'}{' '}
                  <span className={active ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading expenses…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="No expenses found" hint={search || catFilter ? 'Try a different search or filter.' : 'Add your first expense to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr>
                <th className="table-header">Date</th>
                <th className="table-header">Category</th>
                <th className="table-header">Description</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Paid From</th>
                <th className="table-header text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp._id} className="table-row">
                    <td className="table-cell whitespace-nowrap font-semibold text-slate-800">{dayjs(exp.date).format('DD MMM YYYY')}</td>
                    <td className="table-cell"><span className="badge-orange">{exp.category}</span></td>
                    <td className="table-cell">{exp.description || '-'}</td>
                    <td className="table-cell font-semibold text-rose-600">{fmt(exp.amount)}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-slate-700">{accountName(exp.account) || '-'}</p>
                      {exp.paymentMode && exp.paymentMode !== 'cash' && <p className="text-xs capitalize text-slate-500">{exp.paymentMode.replace('_', ' ')}</p>}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end">
                        <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={async () => {
                          if (confirm('Delete?')) { await api.delete(`/expenses/${exp._id}`); fetchData(); }
                        }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer flex items-center justify-between gap-3">
          <span>Showing {filtered.length} of {expenses.length} expenses</span>
          <span className="font-semibold text-rose-600">Total: {fmt(totalFiltered)}</span>
        </div>
      </section>

      {showForm && (
        <ExpenseFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
    </div>
  );
}
