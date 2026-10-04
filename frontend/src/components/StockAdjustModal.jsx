import { useState } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from './Modal';
import { NON_NEGATIVE } from '../lib/number';
import { Plus, Minus, ArrowRight, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

const num = (n) => (n || 0).toLocaleString('en-IN');

const REASONS = {
  increase: ['Physical count correction', 'Found extra stock', 'Returned from production', 'Opening stock', 'Other'],
  decrease: ['Physical count correction', 'Damaged / wastage', 'Lost or theft', 'Used without entry', 'Other'],
};

/**
 * Popup to add to or take away from a material's stock by hand.
 * Props:
 * - materials: list to pick from
 * - materialId: the material to start on
 * - onClose, onSaved
 */
export default function StockAdjustModal({ materials, materialId, onClose, onSaved }) {
  const [form, setForm] = useState({
    material: materialId || materials[0]?._id || '',
    type: 'increase',
    quantity: '',
    reason: REASONS.increase[0],
    notes: '',
    date: dayjs().format('YYYY-MM-DD'),
  });
  const [saving, setSaving] = useState(false);

  useEscapeKey(true, onClose);

  const material = materials.find(m => m._id === form.material);
  const unit = material?.unit || 'unit';
  const current = material?.currentStock || 0;
  const qty = Number(form.quantity) || 0;
  const isIncrease = form.type === 'increase';
  const after = isIncrease ? current + qty : current - qty;
  const tooMuch = !isIncrease && qty > current;

  const setType = (type) => setForm(f => ({ ...f, type, reason: REASONS[type].includes(f.reason) ? f.reason : REASONS[type][0] }));

  const handleSave = async () => {
    const problem =
      !material ? 'Select a material' :
      !(qty > 0) ? `Enter how many ${unit} to ${isIncrease ? 'add' : 'remove'}` :
      tooMuch ? `Only ${num(current)} ${unit} in stock` : '';
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      await api.post('/stock/adjust', { ...form, quantity: qty });
      onSaved?.();
      onClose();
    } catch (e) { alert(e.message || 'Could not save the adjustment'); }
    setSaving(false);
  };

  return (
    <Modal
      title="Adjust Stock"
      subtitle="Correct the stock by hand when it does not match what you really have"
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Adjustment'}
        </button>
      </>}
    >
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="label">Material</label>
            <select className="input" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })}>
              {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        {/* Current stock */}
        <div className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current stock</p>
            <p className="text-xs text-slate-500">{material ? `${material.name} is counted in ${unit}` : 'Select a material'}</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{num(current)} <span className="text-sm font-semibold">{unit}</span></p>
        </div>

        {/* Increase or decrease */}
        <div>
          <label className="label">What do you want to do?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('increase')}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition ${isIncrease ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              <Plus size={16} /> Increase stock
            </button>
            <button
              type="button"
              onClick={() => setType('decrease')}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition ${!isIncrease ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              <Minus size={16} /> Decrease stock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="label">How many {unit} to {isIncrease ? 'add' : 'remove'}?</label>
            <div className="relative">
              <input type="number" {...NON_NEGATIVE} className="input pr-14 font-semibold" placeholder="0" autoFocus
                value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">{unit}</span>
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
              {REASONS[form.type].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Result */}
        <div className={`rounded-xl border-2 px-4 py-3 ${tooMuch ? 'border-rose-300 bg-rose-50' : isIncrease ? 'border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stock after this adjustment</p>
          {tooMuch ? (
            <p className="mt-1 text-sm font-semibold text-rose-600">You cannot remove {num(qty)} {unit} — only {num(current)} {unit} in stock.</p>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900">
              <span>{num(current)} {unit}</span>
              <span className={`text-sm ${isIncrease ? 'text-emerald-700' : 'text-rose-600'}`}>{isIncrease ? '+' : '−'} {num(qty)}</span>
              <ArrowRight size={18} className="text-slate-400" />
              <span className={isIncrease ? 'text-emerald-700' : 'text-rose-600'}>{num(after)} {unit}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="Anything worth remembering about this adjustment" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
