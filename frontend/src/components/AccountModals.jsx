import { useState } from 'react';
import Modal from './Modal';
import useEscapeKey from '../hooks/useEscapeKey';
import { NON_NEGATIVE } from '../lib/number';
import { ArrowDown, Banknote, Landmark, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const Footer = ({ onClose, onSave, saving, label }) => (
  <>
    <button className="btn-secondary" onClick={onClose}>Cancel</button>
    <button className="btn-primary px-8" onClick={onSave} disabled={saving}>
      {saving ? <Loader2 size={16} className="animate-spin" /> : null}
      {saving ? 'Saving...' : label}
    </button>
  </>
);

/** Add or edit a cash book / bank account. `account` is a row from /accounts/summary when editing. */
export function AccountFormModal({ account = null, onSave, onClose }) {
  const [form, setForm] = useState({
    name: account?.name || '',
    type: account?.type || 'bank',
    openingBalance: account ? String(account.openingBalance ?? '') : '',
    notes: account?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  useEscapeKey(true, onClose);

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Enter the account name'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, name: form.name.trim(), openingBalance: Number(form.openingBalance) || 0 });
    } catch (e) {
      alert(e.message || 'Could not save the account');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={account ? 'Edit Account' : 'Add Account'}
      subtitle="A bank account or a cash book you keep money in"
      onClose={onClose}
      maxWidth="max-w-md"
      footer={<Footer onClose={onClose} onSave={handleSave} saving={saving} label={account ? 'Update' : 'Save Account'} />}
    >
      <div className="space-y-3 md:space-y-4">
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ key: 'cash', label: 'Cash Book', icon: Banknote }, { key: 'bank', label: 'Bank Account', icon: Landmark }].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, type: key })}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition ${form.type === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Account Name</label>
          <input className="input" autoFocus placeholder={form.type === 'cash' ? 'e.g. Cash Account, Site Cash' : 'e.g. SBI Current Account'}
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Opening Balance (₹)</label>
          <input type="number" className="input font-semibold" placeholder="0" value={form.openingBalance}
            onChange={e => setForm({ ...form, openingBalance: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">Money already in this account before you started recording entries here.</p>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="e.g. account number, branch" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

/** Move money between two of your own accounts, e.g. cash deposited in the bank. `accounts` are /accounts/summary rows. */
export function TransferModal({ accounts, fromId = '', onSave, onClose }) {
  const first = fromId || accounts[0]?._id || '';
  const [form, setForm] = useState({
    fromAccount: first,
    toAccount: accounts.find(a => a._id !== first)?._id || '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  useEscapeKey(true, onClose);

  const balanceOf = (id) => accounts.find(a => a._id === id)?.balance;

  const handleSave = async () => {
    const problem =
      !form.fromAccount || !form.toAccount ? 'Choose both accounts' :
      form.fromAccount === form.toAccount ? 'Choose two different accounts' :
      !(Number(form.amount) > 0) ? 'Enter the amount' : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      await onSave({ ...form, amount: Number(form.amount) });
    } catch (e) {
      alert(e.message || 'Could not save the transfer');
      setSaving(false);
    }
  };

  const field = (label, key) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
      </select>
      {form[key] && <p className="mt-1 text-xs text-slate-500">Balance now: <span className="font-semibold text-slate-700">{fmt(balanceOf(form[key]))}</span></p>}
    </div>
  );

  return (
    <Modal
      title="Transfer Money"
      subtitle="Move money between your own accounts, e.g. cash deposited in the bank"
      onClose={onClose}
      maxWidth="max-w-md"
      footer={accounts.length >= 2 && <Footer onClose={onClose} onSave={handleSave} saving={saving} label="Transfer" />}
    >
      {accounts.length < 2 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700">Add one more account first. A transfer needs two accounts.</p>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {field('From', 'fromAccount')}
          <div className="flex justify-center text-slate-400"><ArrowDown size={18} /></div>
          {field('To', 'toAccount')}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" autoFocus
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="e.g. deposited at branch" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      )}
    </Modal>
  );
}
