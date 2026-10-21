import { useState, useEffect } from 'react';
import api from '../lib/api';
import PlantSelect from './PlantSelect';
import OptionPicker from './OptionPicker';
import { defaultPlantId, hasManyPlants } from '../lib/plants';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal, { ModalSection } from './Modal';
import { LoadingState } from './States';
import { Plus, Trash2, Loader2, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import { CementCheck } from './CementRatio';
import { isCement } from '../lib/cement';
import dayjs from 'dayjs';

const SHIFTS = ['full_day', 'morning', 'evening', 'night'];
const SHIFT_ICONS = { full_day: Sun, morning: Sunrise, evening: Sunset, night: Moon };

const num = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

/**
 * Add / edit popup for a production entry. Loads the brick types, plants, materials and stock it
 * needs by itself, so it can be opened from the Production page or straight from the dashboard.
 * Props:
 * - entry: the entry to edit, or null for a new one
 * - onClose: called on cancel / ✕ / Esc
 * - onSaved: called after a successful save (the popup is closed by the caller)
 */
export default function ProductionFormModal({ entry = null, onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [brickStock, setBrickStock] = useState({}); // bricks available per brick type id
  const [form, setForm] = useState(null); // filled in once the lists above have loaded
  const [saving, setSaving] = useState(false);
  const [formCement, setFormCement] = useState(null); // cement ratios as of the date in the form
  const editing = entry?._id || null;

  useEscapeKey(true, onClose);

  // A consumed material is always counted in that material's own stock unit
  const findMaterial = (id) => materials.find(m => m._id === id);
  const unitOf = (id) => findMaterial(id)?.unit || '';

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/plants'),
      api.get('/materials'),
      api.get('/settings'),
      api.get('/stock/bricks'),
    ]).then(([productsRes, plantsRes, materialsRes, settingsRes, stockRes]) => {
      const plantList = plantsRes.data || [];
      const materialList = materialsRes.data || [];
      const settings = settingsRes.data || { platesEnabled: false, bricksPerPlate: 0 }; // production entered by plates?
      const unit = (id) => materialList.find(m => m._id === id)?.unit || '';
      setProducts(productsRes.data || []);
      setPlants(plantList);
      setMaterials(materialList);
      setBrickStock(Object.fromEntries((stockRes.data || []).map(r => [r.product._id, r.available])));
      setForm(entry ? {
        date: dayjs(entry.date).format('YYYY-MM-DD'),
        plant: entry.plant?._id || '',
        product: entry.product?._id || '',
        quantityProduced: entry.quantityProduced,
        quantityDamaged: entry.quantityDamaged || 0,
        // An entry keeps the way it was made: by plates (with that day's bricks per plate) or as a count
        byPlates: entry.plates > 0,
        plates: entry.plates || '',
        bricksPerPlate: entry.bricksPerPlate || settings.bricksPerPlate || '',
        shift: entry.shift,
        notes: entry.notes || '',
        materials: (entry.materials || []).map(m => {
          const id = m.material?._id || m.material || '';
          return { material: id, quantity: m.quantity ?? '', unit: unit(id) || m.unit || '' };
        })
      } : {
        date: dayjs().format('YYYY-MM-DD'), plant: defaultPlantId(plantList), product: '', quantityProduced: '', quantityDamaged: 0,
        byPlates: settings.platesEnabled, plates: '', bricksPerPlate: settings.bricksPerPlate || '',
        shift: 'full_day', notes: '', materials: [],
      });
    }).catch(e => { alert(e.message || 'Could not load the form'); onClose(); });
  }, []);

  // Averages for the form's live cement check, as of the entry's date and without the entry itself
  useEffect(() => {
    if (!form?.date) return;
    api.get('/production/cement-ratio', { params: { asOf: form.date, ...(editing && { exclude: editing }) } })
      .then(res => setFormCement(res.data || null))
      .catch(console.error);
  }, [form?.date, editing]);

  const title = `${editing ? 'Edit' : 'New'} Production Entry`;
  const subtitle = editing ? 'Update this production record' : 'Bricks made in a shift and the materials they used';

  if (!form) {
    return (
      <Modal title={title} subtitle={subtitle} onClose={onClose} maxWidth="max-w-2xl">
        <LoadingState label="Loading form…" />
      </Modal>
    );
  }

  // Dropdown options with the stock left on each
  const productOptions = products.filter(p => p.isActive !== false || p._id === form.product).map(p => {
    const left = brickStock[p._id] || 0;
    return { value: p._id, label: p.name, hint: p.size, badge: { text: `${num(left)} pcs in stock`, tone: left > 0 ? 'green' : 'gray' } };
  });
  const materialOptions = materials.map(m => {
    const left = m.currentStock || 0;
    const tone = left <= 0 ? 'red' : left <= (m.lowStockThreshold || 0) ? 'amber' : 'green';
    return { value: m._id, label: m.name, hint: tone === 'amber' ? 'Running low' : tone === 'red' ? 'Out of stock' : '', badge: { text: `${num(left)} ${m.unit} left`, tone } };
  });

  // Plates or bricks per plate changed: the brick count follows (plates × bricks per plate)
  const setPlates = (changes) => setForm(f => {
    const next = { ...f, ...changes };
    const total = (Number(next.plates) || 0) * (Number(next.bricksPerPlate) || 0);
    return { ...next, quantityProduced: total > 0 ? total : '' };
  });

  const handleSave = async () => {
    // Blank rows are ignored; a chosen material must have a quantity
    const used = form.materials.filter(m => m.material);
    if (used.some(m => !(Number(m.quantity) > 0))) {
      alert('Enter the quantity used for each material');
      return;
    }
    const problem =
      !form.plant ? 'Select a plant' :
      !form.product ? 'Select a brick type' :
      form.byPlates && !(Number(form.plates) > 0) ? 'Enter the number of plates' :
      form.byPlates && !(Number(form.bricksPerPlate) > 0) ? 'Enter how many bricks one plate makes' :
      form.quantityProduced === '' || Number(form.quantityProduced) < 0 ? 'Enter the quantity produced' :
      Number(form.quantityDamaged) > Number(form.quantityProduced) ? 'Damaged bricks cannot be more than the bricks made' : '';
    if (problem) { alert(problem); return; }
    const { byPlates, ...rest } = form;
    const payload = {
      ...rest,
      // Sent as null when the entry is not by plates, so an edited entry drops old plate figures
      plates: byPlates ? Number(form.plates) : null,
      bricksPerPlate: byPlates ? Number(form.bricksPerPlate) : null,
      materials: used.map(m => ({ material: m.material, quantity: Number(m.quantity), unit: unitOf(m.material) || m.unit }))
    };
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/production/${editing}`, payload);
      } else {
        await api.post('/production', payload);
      }
      setSaving(false);
      onSaved();
    } catch (e) {
      alert(e.message || 'Error saving');
      setSaving(false);
    }
  };

  const addMaterial = () => {
    setForm(f => ({ ...f, materials: [...f.materials, { material: '', quantity: '', unit: '' }] }));
  };

  const updateMaterial = (idx, changes) => {
    setForm(f => ({ ...f, materials: f.materials.map((m, i) => (i === idx ? { ...m, ...changes } : m)) }));
  };

  const removeMaterial = (idx) => {
    setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }));
  };

  // Bags of cement in the consumed materials
  const cementBags = form.materials
    .filter(m => isCement(findMaterial(m.material)?.name))
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0);

  const made = Number(form.quantityProduced) || 0;
  const damaged = Number(form.quantityDamaged) || 0;
  const tooManyDamaged = damaged > made;
  const manyPlants = hasManyPlants(plants);

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </>}
    >
      <ModalSection number={1} title="Batch Details" tone="blue">
        <div className="space-y-3 md:space-y-4">
          <div className={`grid grid-cols-1 gap-3 md:gap-4 ${manyPlants ? 'sm:grid-cols-3' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'}`}>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Brick Type <span className="text-rose-500">*</span></label>
              <OptionPicker options={productOptions} value={form.product} onChange={product => setForm(f => ({ ...f, product }))}
                placeholder="Select Brick Type" searchPlaceholder="Search brick types..." />
            </div>
            <PlantSelect plants={plants} value={form.plant} onChange={plant => setForm({ ...form, plant })} />
          </div>
          <div>
            <label className="label">Shift</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SHIFTS.map(key => {
                const Icon = SHIFT_ICONS[key];
                const active = form.shift === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, shift: key })}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${active ? 'border-primary-600 bg-primary-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <Icon size={15} /> {key.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalSection>

      <ModalSection number={2} title="Bricks Made" tone="emerald">
        <div className={`grid gap-2 sm:gap-3 md:gap-4 ${form.byPlates ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {form.byPlates ? (
            <>
              <div>
                <label className="label">Number of Plates <span className="text-rose-500">*</span></label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="e.g. 120" value={form.plates} onChange={e => setPlates({ plates: e.target.value })} />
              </div>
              <div>
                <label className="label">Bricks per Plate</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="e.g. 105" value={form.bricksPerPlate} onChange={e => setPlates({ bricksPerPlate: e.target.value })} />
              </div>
            </>
          ) : (
            <div>
              <label className="label">Bricks Produced <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input type="number" {...NON_NEGATIVE} className="input pr-12 font-semibold" placeholder="e.g. 5000" value={form.quantityProduced} onChange={e => setForm({ ...form, quantityProduced: e.target.value })} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">pcs</span>
              </div>
            </div>
          )}
          <div>
            <label className="label">Damaged / Broken</label>
            <div className="relative">
              <input type="number" {...NON_NEGATIVE} className="input pr-12 font-semibold" placeholder="0" value={form.quantityDamaged} onChange={e => setForm({ ...form, quantityDamaged: e.target.value })} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">pcs</span>
            </div>
          </div>
        </div>

        {/* Live summary: made, damaged, and the good bricks that go into stock */}
        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-lg bg-white text-center ring-1 ring-inset ring-emerald-200 md:mt-4">
          <div className="px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Made</p>
            <p className="font-bold text-slate-800">{num(made)}</p>
            {form.byPlates && <p className="text-[11px] text-slate-400">{num(Number(form.plates) || 0)} × {num(Number(form.bricksPerPlate) || 0)}</p>}
          </div>
          <div className="px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Damaged</p>
            <p className={`font-bold ${damaged ? 'text-rose-600' : 'text-slate-800'}`}>{num(damaged)}</p>
            {made > 0 && damaged > 0 && !tooManyDamaged && <p className="text-[11px] text-slate-400">{((damaged / made) * 100).toFixed(1)}%</p>}
          </div>
          <div className="bg-emerald-50/60 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Good bricks</p>
            <p className={`text-lg font-bold leading-tight ${tooManyDamaged ? 'text-rose-600' : 'text-emerald-700'}`}>{tooManyDamaged ? '—' : num(made - damaged)}</p>
            {tooManyDamaged && <p className="text-[11px] font-semibold text-rose-600">More damaged than made</p>}
          </div>
        </div>
      </ModalSection>

      {/* Materials used */}
      <ModalSection number={3} title="Materials Used" tone="purple">
        {form.materials.length > 0 && (
          <div className="space-y-2">
            <div className="hidden grid-cols-[minmax(0,1fr)_9rem_2.25rem] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Material</span><span>Quantity</span><span />
            </div>
            {form.materials.map((m, i) => {
              const selected = findMaterial(m.material);
              // Only meaningful for a new entry — an existing entry's quantity is already deducted
              const overStock = !editing && selected && Number(m.quantity) > (selected.currentStock || 0);
              return (
                <div key={i}>
                  <div className="grid grid-cols-[minmax(0,1fr)_7rem_2.25rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_2.25rem]">
                    <OptionPicker options={materialOptions} value={m.material} onChange={id => updateMaterial(i, { material: id, unit: unitOf(id) })}
                      placeholder="Select Material" searchPlaceholder="Search materials..." />
                    <div className="relative">
                      <input type="number" {...NON_NEGATIVE} className={`input pr-12 font-semibold ${overStock ? 'border-rose-400 text-rose-700' : ''}`} placeholder="Qty"
                        value={m.quantity} onChange={e => updateMaterial(i, { quantity: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex max-w-[3rem] items-center truncate text-xs font-semibold text-slate-400">{m.unit}</span>
                    </div>
                    <button type="button" className="icon-btn hover:bg-red-50 hover:text-red-600" title="Remove material" aria-label="Remove material" onClick={() => removeMaterial(i)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {overStock && (
                    <p className="mt-1 px-1 text-xs font-semibold text-rose-600">
                      Only {num(selected.currentStock || 0)} {selected.unit} in stock
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={addMaterial}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-purple-200 bg-white/70 px-3 py-2.5 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-white ${form.materials.length ? 'mt-3' : ''}`}
        >
          <Plus size={16} /> {form.materials.length ? 'Add another material' : 'Add material used (cement, sand, fly ash...)'}
        </button>
        {form.product && (
          <CementCheck
            bricks={made}
            bags={cementBags}
            unit={findMaterial(form.materials.find(m => isCement(findMaterial(m.material)?.name))?.material)?.unit}
            row={formCement?.products?.find(r => r.product._id === form.product)}
          />
        )}
      </ModalSection>

      <div>
        <label className="label">Notes <span className="font-normal text-slate-400">(optional)</span></label>
        <input className="input" placeholder="Anything worth remembering about this batch" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  );
}
