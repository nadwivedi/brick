import { useEffect, useState } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from './Modal';
import { NON_NEGATIVE } from '../lib/number';
import { PAYMENT_MODES } from '../lib/paymentModes';
import { ArrowRight, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// Wording and endpoints for each direction of money
const KINDS = {
  customer: {
    endpoint: '/receipts', partyKey: 'customer',
    title: 'Money Received', subtitle: 'Record money a customer has paid you',
    partyLabel: 'Party Name (Customer)', selectLabel: 'Select Customer',
    modeLabel: 'Received by', saveLabel: 'Save Receipt', balanceLabel: 'balance after this receipt',
    owes: 'to receive',
    noParty: 'Select the party you received money from', noAmount: 'Enter the amount received',
    saveError: 'Could not save the receipt',
  },
  vendor: {
    endpoint: '/vendor-payments', partyKey: 'vendor',
    title: 'Money Paid', subtitle: 'Record money you have paid to a vendor',
    partyLabel: 'Party Name (Vendor)', selectLabel: 'Select Vendor',
    modeLabel: 'Paid by', saveLabel: 'Save Payment', balanceLabel: 'balance after this payment',
    owes: 'to pay',
    noParty: 'Select the party you paid money to', noAmount: 'Enter the amount paid',
    saveError: 'Could not save the payment',
  },
};

/**
 * Popup to record money received from a customer or money paid to a vendor.
 * Props:
 * - type: 'customer' (money received) or 'vendor' (money paid)
 * - parties: list to pick from
 * - partyId: the customer/vendor to start on
 * - onClose, onSaved
 */
export default function PartyPaymentModal({ type, parties, partyId, onClose, onSaved }) {
  const kind = KINDS[type];
  const [form, setForm] = useState({
    party: partyId || '',
    date: dayjs().format('YYYY-MM-DD'),
    mode: 'cash',
    amount: '',
    referenceNumber: '',
    notes: '',
  });
  const [balances, setBalances] = useState(null); // balance due per party id
  const [saving, setSaving] = useState(false);

  useEscapeKey(true, onClose);

  useEffect(() => {
    api.get(`/party-balances/${type}`).then(res => setBalances(res.data || {})).catch(() => setBalances({}));
  }, [type]);

  // A positive balance is money still owed; a negative one is an advance
  const balanceText = (n) => (n > 0 ? `${fmt(n)} ${kind.owes}` : n < 0 ? `${fmt(-n)} advance` : 'Nothing due');

  const party = parties.find(p => p._id === form.party);
  const amount = Number(form.amount) || 0;
  const due = party ? (balances?.[party._id]?.balance ?? party.openingBalance ?? 0) : 0;
  const after = due - amount;

  const handleSave = async () => {
    const problem =
      !party ? kind.noParty :
      !form.date ? 'Select the date' :
      !(amount > 0) ? kind.noAmount : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      const { party: selected, ...rest } = form;
      await api.post(kind.endpoint, { ...rest, [kind.partyKey]: selected, amount });
      onSaved?.();
      onClose();
    } catch (e) { alert(e.message || kind.saveError); }
    setSaving(false);
  };

  return (
    <Modal
      title={kind.title}
      subtitle={kind.subtitle}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? 'Saving...' : kind.saveLabel}
        </button>
      </>}
    >
      <div className="space-y-3 md:space-y-4">
        <div>
          <label className="label">{kind.partyLabel}</label>
          <select className="input" value={form.party} onChange={e => setForm({ ...form, party: e.target.value })}>
            <option value="">{kind.selectLabel}</option>
            {parties.map(p => <option key={p._id} value={p._id}>{p.name}{p.mobile ? ` (${p.mobile})` : ''}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" autoFocus={!!partyId}
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
        </div>

        {/* Cash, UPI, ... */}
        <div>
          <label className="label">{kind.modeLabel}</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, mode: key })}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition ${form.mode === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        {form.mode !== 'cash' && (
          <div>
            <label className="label">{form.mode === 'cheque' ? 'Cheque No.' : 'Reference / UTR No.'} (optional)</label>
            <input className="input" placeholder={form.mode === 'cheque' ? 'Cheque number' : 'UPI / bank reference number'}
              value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} />
          </div>
        )}

        {/* Balance before and after this entry */}
        {party && balances && (
          <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{party.name}'s {kind.balanceLabel}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900">
              <span className={due > 0 ? 'text-rose-600' : ''}>{balanceText(due)}</span>
              {amount > 0 && <>
                <ArrowRight size={18} className="text-slate-400" />
                <span className={after > 0 ? 'text-rose-600' : 'text-emerald-700'}>{balanceText(after)}</span>
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
