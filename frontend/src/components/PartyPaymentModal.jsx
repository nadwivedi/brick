import { useEffect, useState } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from './Modal';
import AccountPicker, { modeForAccount } from './AccountPicker';
import useAccounts from '../hooks/useAccounts';
import { NON_NEGATIVE, blankZero, noLeadingZeros } from '../lib/number';
import { ArrowRight, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// Wording and endpoints for each direction of money
const KINDS = {
  customer: {
    endpoint: '/receipts', partyKey: 'customer',
    title: 'Money Received', subtitle: 'Record money a party has paid you',
    editTitle: 'Edit Money Received', editSubtitle: 'Change this receipt; the party ledger follows the change',
    partyLabel: 'Party Name', selectLabel: 'Select Party',
    accountLabel: 'Received In', saveLabel: 'Save Receipt', balanceLabel: 'balance after this receipt',
    sign: -1, // money in lowers what they owe us
    noParty: 'Select the party you received money from', noAmount: 'Enter the amount received',
    saveError: 'Could not save the receipt',
  },
  vendor: {
    endpoint: '/vendor-payments', partyKey: 'vendor',
    title: 'Money Paid', subtitle: 'Record money you have paid to a party',
    editTitle: 'Edit Money Paid', editSubtitle: 'Change this payment; the party ledger follows the change',
    partyLabel: 'Party Name', selectLabel: 'Select Party',
    accountLabel: 'Paid From', saveLabel: 'Save Payment', balanceLabel: 'balance after this payment',
    sign: 1, // money out lowers what we owe them
    noParty: 'Select the party you paid money to', noAmount: 'Enter the amount paid',
    saveError: 'Could not save the payment',
  },
};

/**
 * Popup to record money received from a party or money paid to a party.
 * Props:
 * - type: 'customer' (money received) or 'vendor' (money paid)
 * - parties: list to pick from
 * - partyId: the party to start on
 * - payment: a saved receipt / payment to edit (leave out for a new one)
 * - onClose, onSaved
 */
export default function PartyPaymentModal({ type, parties, partyId, payment, onClose, onSaved }) {
  const kind = KINDS[type];
  const editing = Boolean(payment);
  const savedParty = payment?.[kind.partyKey]?._id || '';
  // Money received with a sale stays with that sale's party
  const partyLocked = editing && Boolean(payment.invoice);
  const [form, setForm] = useState(editing ? {
    party: savedParty,
    date: dayjs(payment.date).format('YYYY-MM-DD'),
    account: payment.account?._id || '',
    mode: payment.mode || '',
    amount: payment.amount ?? '',
    referenceNumber: payment.referenceNumber || '',
    notes: payment.notes || '',
  } : {
    party: partyId || '',
    date: dayjs().format('YYYY-MM-DD'),
    account: '', // '' = the default account
    mode: '',
    amount: '',
    referenceNumber: '',
    notes: '',
  });
  const [balances, setBalances] = useState(null); // balance due per party id
  const [saving, setSaving] = useState(false);
  const { accounts, defaultAccountId } = useAccounts();
  const account = accounts.find(a => a._id === (form.account || defaultAccountId));
  const mode = modeForAccount(account, form.mode);

  useEscapeKey(true, onClose);

  useEffect(() => {
    api.get('/party-balances').then(res => setBalances(res.data || {})).catch(() => setBalances({}));
  }, []);

  // Positive = the party owes you, negative = you owe the party
  const balanceText = (n) => (n > 0 ? `${fmt(n)} to receive` : n < 0 ? `${fmt(-n)} to pay` : 'Nothing due');
  const balanceClass = (n) => (n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-600' : '');

  const party = parties.find(p => p._id === form.party);
  const amount = Number(form.amount) || 0;
  const due = party ? (balances?.[party._id]?.balance ?? party.openingBalance ?? 0) : 0;
  // When editing, the party's balance already includes the saved amount
  const already = editing && form.party === savedParty ? payment.amount || 0 : 0;
  const after = due + kind.sign * (amount - already);

  const handleSave = async () => {
    const problem =
      !party ? kind.noParty :
      !form.date ? 'Select the date' :
      !(amount > 0) ? kind.noAmount : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      const { party: selected, ...rest } = form;
      const data = { ...rest, account: account?._id, mode, [kind.partyKey]: selected, amount };
      await (editing ? api.put(`${kind.endpoint}/${payment._id}`, data) : api.post(kind.endpoint, data));
      onSaved?.();
      onClose();
    } catch (e) { alert(e.message || kind.saveError); }
    setSaving(false);
  };

  return (
    <Modal
      title={editing ? kind.editTitle : kind.title}
      subtitle={editing ? kind.editSubtitle : kind.subtitle}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? 'Saving...' : editing ? 'Save Changes' : kind.saveLabel}
        </button>
      </>}
    >
      <div className="space-y-3 md:space-y-4">
        {/* Date and party on one row; the party gets more room */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr] md:gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">{kind.partyLabel}</label>
            <select className="input" value={form.party} disabled={partyLocked} title={partyLocked ? 'Received with a sale; change the party on the sale' : undefined}
              onChange={e => setForm({ ...form, party: e.target.value })}>
              <option value="">{kind.selectLabel}</option>
              {parties.map(p => <option key={p._id} value={p._id}>{p.name}{p.mobile ? ` (${p.mobile})` : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Amount and the cash / bank account on one row; for a bank: UPI / bank transfer / cheque below */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          <div>
            <div className="mb-1 flex min-h-[1.25rem] items-center"><label className="label mb-0">Amount (₹)</label></div>
            <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" autoFocus={!!partyId}
              value={blankZero(form.amount)} onChange={e => setForm({ ...form, amount: noLeadingZeros(e.target.value) })} />
          </div>
          <AccountPicker
            dropdown
            label={kind.accountLabel}
            accounts={accounts}
            defaultAccountId={defaultAccountId}
            account={form.account}
            mode={form.mode}
            onChange={picked => setForm({ ...form, ...picked })}
          />
        </div>

        {mode !== 'cash' && (
          <div>
            <label className="label">{mode === 'cheque' ? 'Cheque No.' : 'Reference / UTR No.'} (optional)</label>
            <input className="input" placeholder={mode === 'cheque' ? 'Cheque number' : 'UPI / bank reference number'}
              value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} />
          </div>
        )}

        {/* Balance before and after this entry */}
        {party && balances && (
          <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{party.name}'s {kind.balanceLabel}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900">
              <span className={balanceClass(due)}>{balanceText(due)}</span>
              {amount > 0 && after !== due && <>
                <ArrowRight size={18} className="text-slate-400" />
                <span className={balanceClass(after)}>{balanceText(after)}</span>
              </>}
            </p>
          </div>
        )}

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="Anything worth remembering about this payment" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
