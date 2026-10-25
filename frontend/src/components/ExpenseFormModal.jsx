import { useState, useEffect } from 'react';
import api from '../lib/api';
import PlantSelect from './PlantSelect';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from './Modal';
import AccountPicker, { modeForAccount } from './AccountPicker';
import useAccounts from '../hooks/useAccounts';
import { LoadingState } from './States';
import { Loader2 } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import dayjs from 'dayjs';

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

/**
 * "Add Expense" / "Edit Expense" popup. Loads the plants and expense categories it needs by itself,
 * so it can be opened from the Expenses page or straight from the dashboard.
 * Props: expense (a saved expense to edit; leave out for a new one), onClose,
 * onSaved (called after a successful save; the caller closes the popup)
 */
export default function ExpenseFormModal({ expense, onClose, onSaved }) {
  const editing = Boolean(expense);
  const title = editing ? 'Edit Expense' : 'Add Expense';
  const subtitle = editing ? 'Change this expense' : 'Record an operational expense';
  const [plants, setPlants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null); // filled in once the lists above have loaded
  const [saving, setSaving] = useState(false);
  const { accounts, defaultAccountId } = useAccounts();
  const accountOf = (id) => accounts.find(a => a._id === (id || defaultAccountId));

  useEscapeKey(true, onClose);

  useEffect(() => {
    Promise.all([api.get('/plants'), api.get('/expense-categories')])
      .then(([pRes, cRes]) => {
        const names = (cRes.data || []).map(c => c.name);
        setPlants(pRes.data || []);
        // An expense keeps its category even if that category was removed since
        setCategories(editing && expense.category && !names.includes(expense.category) ? [...names, expense.category] : names);
        if (editing) {
          setForm({
            date: dayjs(expense.date).format('YYYY-MM-DD'), category: expense.category || names[0] || '',
            amount: expense.amount ?? '', description: expense.description || '',
            account: idOf(expense.account), paymentMode: expense.paymentMode || '', plant: idOf(expense.plant),
          });
          return;
        }
        setForm({ date: dayjs().format('YYYY-MM-DD'), category: names[0] || '', amount: '', description: '', account: '', paymentMode: '', plant: '' });
      })
      .catch(e => { alert(e.message || 'Could not load the form'); onClose(); });
  }, []);

  if (!form) {
    return (
      <Modal title={title} subtitle={subtitle} onClose={onClose} maxWidth="max-w-md">
        <LoadingState label="Loading form…" />
      </Modal>
    );
  }

  const handleSave = async () => {
    const problem =
      !form.category ? 'Select a category' :
      !(Number(form.amount) > 0) ? 'Enter the amount' : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      // "All Plants" means no plant: left out of a new expense, cleared on an edited one
      const data = {
        ...form, amount: Number(form.amount), plant: form.plant || (editing ? null : undefined),
        account: accountOf(form.account)?._id, paymentMode: modeForAccount(accountOf(form.account), form.paymentMode),
      };
      await (editing ? api.put(`/expenses/${expense._id}`, data) : api.post('/expenses', data));
      setSaving(false);
      onSaved();
    } catch (e) {
      alert(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {editing ? 'Save Changes' : 'Save Expense'}
        </button>
      </>}
    >
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="label">Amount (₹)</label><input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
        <div><label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="label">Description</label><input className="input" placeholder="What was this expense for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <AccountPicker label="Paid From" accounts={accounts} defaultAccountId={defaultAccountId}
          account={form.account} mode={form.paymentMode}
          onChange={({ account, mode }) => setForm({ ...form, account, paymentMode: mode })} />
        <PlantSelect plants={plants} value={form.plant} onChange={plant => setForm({ ...form, plant })} allLabel="All Plants" />
      </div>
    </Modal>
  );
}
