import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal, { ModalSection } from './Modal';
import { PARTY_TYPES } from '../lib/partyTypes';

const BALANCE_SIDES = [
  { value: 'receivable', label: 'Receivable', hint: 'The party has to pay you this amount.', active: 'border-emerald-600 bg-emerald-600 text-white' },
  { value: 'payable', label: 'Payable', hint: 'You have to pay the party this amount.', active: 'border-rose-600 bg-rose-600 text-white' },
];

const INACTIVE = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100';

// A customer's opening balance is saved as what they owe us, a vendor's as what we owe them,
// so a positive amount means receivable for a customer and payable for a vendor.
const defaultSide = (type) => (type === 'vendor' ? 'payable' : 'receivable');
const toSigned = (type, amount, side) => (side === defaultSide(type) ? amount : -amount);

const formFor = (party, type) => {
  if (!party) {
    return { type, name: '', mobile: '', address: '', gstin: '', openingBalance: '', balanceSide: defaultSide(type), creditLimit: '', isActive: true };
  }
  const ob = Number(party.openingBalance || 0);
  const flip = { receivable: 'payable', payable: 'receivable' };
  return {
    type: party.type,
    name: party.name || '',
    mobile: party.mobile || '',
    address: party.address || '',
    gstin: party.gstin || '',
    openingBalance: ob ? Math.abs(ob) : '',
    balanceSide: ob < 0 ? flip[defaultSide(party.type)] : defaultSide(party.type),
    creditLimit: party.creditLimit || '',
    isActive: party.isActive !== false,
  };
};

/**
 * Add or edit a customer or vendor from one form.
 * - party: the party being edited (with its `type`), or null to add one
 * - defaultType: type picked when adding
 */
export default function PartyFormModal({ party, defaultType = 'customer', onClose, onSaved }) {
  const [form, setForm] = useState(() => formFor(party, defaultType));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(true, onClose);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const hasBalance = String(form.openingBalance).trim() !== '' && Number(form.openingBalance) > 0;
  const side = BALANCE_SIDES.find(s => s.value === form.balanceSide);

  const pickType = (type) => {
    if (party) return; // the type is fixed once saved
    // Follow the usual side for the new type until the user picks one for an amount
    setForm(f => ({ ...f, type, balanceSide: hasBalance ? f.balanceSide : defaultSide(type) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Party name is required');
    if (!form.mobile.trim()) return setError('Mobile number is required');

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      gstin: form.gstin.trim().toUpperCase(),
      openingBalance: toSigned(form.type, Number(form.openingBalance || 0), form.balanceSide),
      isActive: form.isActive,
      ...(form.type === 'customer' && { creditLimit: Number(form.creditLimit || 0) }),
    };

    setSaving(true);
    try {
      const { endpoint } = PARTY_TYPES[form.type];
      if (party) await api.put(`${endpoint}/${party._id}`, payload);
      else await api.post(endpoint, payload);
      toast.success(party ? 'Party updated' : 'Party added');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save the party');
    }
    setSaving(false);
  };

  return (
    <Modal
      title={party ? 'Edit Party' : 'Add Party'}
      subtitle="A customer or vendor you deal with"
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" form="party-form" className="btn-primary px-8" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Saving...' : party ? 'Update Party' : 'Save Party'}
        </button>
      </>}
    >
      <form id="party-form" onSubmit={handleSubmit}>
        {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        <ModalSection number={1} title="Party Details" tone="blue">
          <div className="space-y-3">
            <div>
              <label className="label">Party Type <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PARTY_TYPES).map(([value, t]) => {
                  const active = form.type === value;
                  const Icon = t.icon;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pickType(value)}
                      aria-pressed={active}
                      disabled={!!party && !active}
                      className={`rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'border-primary-600 bg-primary-600 text-white' : INACTIVE}`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Icon size={16} className="shrink-0" /> {t.label}
                      </span>
                      <span className={`mt-0.5 hidden text-[11px] sm:block ${active ? 'text-primary-100' : 'text-slate-400'}`}>{t.hint}</span>
                    </button>
                  );
                })}
              </div>
              {party && <p className="mt-1 text-xs text-slate-500">The type can't be changed after the party is saved.</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <label className="label">Party Name <span className="text-rose-500">*</span></label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder={form.type === 'vendor' ? 'e.g. Gupta Coal Suppliers' : 'e.g. Sharma Construction'} autoComplete="off" autoFocus required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Mobile Number <span className="text-rose-500">*</span></label>
                <input className="input" type="tel" inputMode="numeric" value={form.mobile} onChange={e => set('mobile', e.target.value)}
                  placeholder="10 digits" autoComplete="off" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <label className="label">Address</label>
                <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Village / city" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">GSTIN</label>
                <input className="input uppercase placeholder:normal-case" value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </div>
        </ModalSection>

        <ModalSection number={2} title="Opening Balance" tone="amber">
          <p className="mb-3 text-xs text-slate-500">
            {hasBalance && side ? side.hint : 'Old balance with this party before you started entries here. Leave blank if there is none.'}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
            <div className="relative sm:col-span-2">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-400">₹</span>
              <input className="input pl-7" type="number" min="0" step="0.01" value={form.openingBalance}
                onChange={e => set('openingBalance', e.target.value)} placeholder="0" aria-label="Opening balance" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:col-span-3">
              {BALANCE_SIDES.map(s => {
                const active = hasBalance && form.balanceSide === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set('balanceSide', s.value)}
                    aria-pressed={active}
                    disabled={!hasBalance}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:border-slate-200 disabled:bg-white/60 disabled:text-slate-400 ${active ? s.active : INACTIVE}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ModalSection>

        <ModalSection number={3} title="Other Details" tone="slate">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {form.type === 'customer' && (
              <div>
                <label className="label">Credit Limit</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-400">₹</span>
                  <input className="input pl-7" type="number" min="0" value={form.creditLimit}
                    onChange={e => set('creditLimit', e.target.value)} placeholder="No limit" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Status</label>
              <select className="input" value={String(form.isActive)} onChange={e => set('isActive', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}
