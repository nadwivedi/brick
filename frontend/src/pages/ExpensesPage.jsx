import { useState, useEffect } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Trash2, Loader2, Wallet } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const SUMMARY_TONES = ['blue', 'emerald', 'amber', 'rose'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [plants, setPlants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  useEscapeKey(showForm, () => setShowForm(false));
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    category: '', amount: '', description: '', paymentMode: 'cash', plant: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, pRes, cRes] = await Promise.all([api.get('/expenses'), api.get('/plants'), api.get('/expense-categories')]);
      setExpenses(eRes.data || []);
      setPlants(pRes.data || []);
      setCategories((cRes.data || []).map(c => c.name));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const problem =
      !form.category ? 'Select a category' :
      !(Number(form.amount) > 0) ? 'Enter the amount' : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      // "All Plants" means no plant, so the field is left out instead of sent blank
      await api.post('/expenses', { ...form, amount: Number(form.amount), plant: form.plant || undefined });
      setShowForm(false);
      fetchData();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

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
              <button className="btn-primary flex-shrink-0" onClick={() => { setForm({ date: dayjs().format('YYYY-MM-DD'), category: categories[0] || '', amount: '', description: '', paymentMode: 'cash', plant: '' }); setShowForm(true); }}>
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
                <th className="table-header">Mode</th>
                <th className="table-header text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp._id} className="table-row">
                    <td className="table-cell whitespace-nowrap font-semibold text-slate-800">{dayjs(exp.date).format('DD MMM YYYY')}</td>
                    <td className="table-cell"><span className="badge-orange">{exp.category}</span></td>
                    <td className="table-cell">{exp.description || '-'}</td>
                    <td className="table-cell font-semibold text-rose-600">{fmt(exp.amount)}</td>
                    <td className="table-cell capitalize">{exp.paymentMode?.replace('_', ' ')}</td>
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
        <Modal
          title="Add Expense"
          subtitle="Record an operational expense"
          onClose={() => setShowForm(false)}
          maxWidth="max-w-md"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Expense
            </button>
          </>}
        >
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="label">Amount (₹)</label><input type="number" className="input font-semibold" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Description</label><input className="input" placeholder="What was this expense for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div><label className="label">Payment Mode</label>
                <select className="input" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div><label className="label">Plant</label>
                <select className="input" value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}>
                  <option value="">All Plants</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
