import { useState, useEffect } from 'react';
import api from '../lib/api';
import PlantSelect from '../components/PlantSelect';
import OptionPicker from '../components/OptionPicker';
import { defaultPlantId, hasManyPlants } from '../lib/plants';
import useEscapeKey from '../hooks/useEscapeKey';
import useOpenOnNew from '../hooks/useOpenOnNew';
import Modal, { ModalSection } from '../components/Modal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, Hammer, CalendarDays, CircleCheck, TriangleAlert, Sun, Sunrise, Sunset, Moon, MapPin } from 'lucide-react';
import { NON_NEGATIVE } from '../lib/number';
import CementRatioPanel, { CementCheck } from '../components/CementRatio';
import { isCement, bricksPerBag, cementDiff, cementStatus, CEMENT_STATUS, fmtRatio, diffText, baselineOf } from '../lib/cement';
import dayjs from 'dayjs';

const SHIFTS = ['full_day', 'morning', 'evening', 'night'];
const SHIFT_STYLES = {
  full_day: { icon: Sun, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  morning: { icon: Sunrise, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  evening: { icon: Sunset, cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  night: { icon: Moon, cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
};

const num = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
// Adds up the per-product rows returned by /production/summary
const sumSummary = (rows) => (rows || []).reduce(
  (t, r) => ({ produced: t.produced + (r.totalProduced || 0), damaged: t.damaged + (r.totalDamaged || 0), count: t.count + (r.count || 0) }),
  { produced: 0, damaged: 0, count: 0 }
);

export default function ProductionPage() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState({ all: sumSummary([]), month: sumSummary([]), today: sumSummary([]) });
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    plant: '', product: '', quantityProduced: '', quantityDamaged: 0,
    shift: 'full_day', notes: '', materials: []
  });
  const [saving, setSaving] = useState(false);
  const [cement, setCement] = useState(null); // cement ratios as of today
  const [formCement, setFormCement] = useState(null); // cement ratios as of the date in the form
  const [settings, setSettings] = useState({ platesEnabled: false, bricksPerPlate: 0 }); // production entered by plates?
  const [brickStock, setBrickStock] = useState({}); // bricks available per brick type id

  useEscapeKey(showForm, () => setShowForm(false));

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [entriesRes, productsRes, plantsRes, materialsRes, allRes, monthRes, todayRes, cementRes, settingsRes, stockRes] = await Promise.all([
        api.get(`/production?page=${page}`),
        api.get('/products'),
        api.get('/plants'),
        api.get('/materials'),
        api.get('/production/summary'),
        api.get('/production/summary', { params: { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: today } }),
        api.get('/production/summary', { params: { from: today, to: today } }),
        api.get('/production/cement-ratio', { params: { asOf: today } }),
        api.get('/settings'),
        api.get('/stock/bricks'),
      ]);
      setBrickStock(Object.fromEntries((stockRes.data || []).map(r => [r.product._id, r.available])));
      setCement(cementRes.data || null);
      setSettings(settingsRes.data || { platesEnabled: false, bricksPerPlate: 0 });
      setTotals({ all: sumSummary(allRes.data), month: sumSummary(monthRes.data), today: sumSummary(todayRes.data) });
      setEntries(entriesRes.data || []);
      setTotalPages(entriesRes.pages || 1);
      setProducts(productsRes.data || []);
      setPlants(plantsRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  // Averages for the form's live cement check, as of the entry's date and without the entry itself
  useEffect(() => {
    if (!showForm || !form.date) return;
    api.get('/production/cement-ratio', { params: { asOf: form.date, ...(editing && { exclude: editing }) } })
      .then(res => setFormCement(res.data || null))
      .catch(console.error);
  }, [showForm, form.date, editing]);

  // A consumed material is always counted in that material's own stock unit
  const findMaterial = (id) => materials.find(m => m._id === id);
  const unitOf = (id) => findMaterial(id)?.unit || '';

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

  const openForm = (entry = null) => {
    if (entry) {
      setEditing(entry._id);
      setForm({
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
          return { material: id, quantity: m.quantity ?? '', unit: unitOf(id) || m.unit || '' };
        })
      });
    } else {
      setEditing(null);
      setForm({
        date: dayjs().format('YYYY-MM-DD'), plant: defaultPlantId(plants), product: '', quantityProduced: '', quantityDamaged: 0,
        byPlates: settings.platesEnabled, plates: '', bricksPerPlate: settings.bricksPerPlate || '',
        shift: 'full_day', notes: '', materials: [],
      });
    }
    setShowForm(true);
  };

  useOpenOnNew(!loading, () => openForm());

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
      form.quantityProduced === '' || Number(form.quantityProduced) < 0 ? 'Enter the quantity produced' : '';
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
      setShowForm(false);
      fetchData();
    } catch (e) { alert(e.message || 'Error saving'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this production entry?')) return;
    await api.delete(`/production/${id}`);
    fetchData();
  };

  const addMaterial = () => {
    setForm(f => ({ ...f, materials: [...f.materials, { material: '', quantity: '', unit: '' }] }));
  };

  const updateMaterial = (idx, changes) => {
    setForm(f => ({ ...f, materials: f.materials.map((m, i) => (i === idx ? { ...m, ...changes } : m)) }));
  };

  // Bags of cement in a list of consumed materials
  const cementBags = (list) => (list || [])
    .filter(m => isCement(findMaterial(m.material?._id || m.material)?.name))
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0);
  const cementRowFor = (data, productId) => data?.products?.find(r => r.product._id === productId);

  const removeMaterial = (idx) => {
    setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }));
  };

  const manyPlants = hasManyPlants(plants);

  const filtered = entries.filter(e =>
    (e.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.plant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Hammer} label="Today" hint={`${totals.today.count} ${totals.today.count === 1 ? 'entry' : 'entries'} today`} value={`${num(totals.today.produced)} pcs`} tone="blue" />
        <StatCard icon={CalendarDays} label="This Month" hint={`${totals.month.count} ${totals.month.count === 1 ? 'entry' : 'entries'} in ${dayjs().format('MMMM')}`} value={`${num(totals.month.produced)} pcs`} tone="indigo" />
        <StatCard icon={CircleCheck} label="Good Bricks" hint={`Out of ${num(totals.all.produced)} produced in all`} value={`${num(totals.all.produced - totals.all.damaged)} pcs`} tone="emerald" />
        <StatCard icon={TriangleAlert} label="Damaged" hint={totals.all.produced ? `${((totals.all.damaged / totals.all.produced) * 100).toFixed(1)}% of all production` : 'No production yet'} value={`${num(totals.all.damaged)} pcs`} tone="rose" />
      </section>

      <CementRatioPanel data={cement} />

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Production</h1>
              <p className="page-subtitle">Daily brick production, damage and the materials each batch used</p>
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder="Search by product or plant..." />
              <button className="btn-primary flex-shrink-0" onClick={() => openForm()}>
                <Plus size={18} />
                <span className="hidden sm:inline">New Production Entry</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState label="Loading production entries…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Hammer} title="No production entries found" hint={search ? 'Try a different search.' : 'Add your first production entry to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">Produced</th>
                  <th className="table-header">Good / Damaged</th>
                  <th className="table-header">Materials Used</th>
                  <th className="table-header">Cement Ratio</th>
                  <th className="table-header">Shift</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => {
                  const produced = entry.quantityProduced || 0;
                  const damaged = entry.quantityDamaged || 0;
                  const damagedPct = produced ? (damaged / produced) * 100 : 0;
                  const shift = SHIFT_STYLES[entry.shift] || SHIFT_STYLES.full_day;
                  const ShiftIcon = shift.icon;
                  const used = (entry.materials || []).map(m => {
                    const mat = findMaterial(m.material?._id || m.material);
                    return `${num(m.quantity)} ${mat?.unit || m.unit || ''} ${mat?.name || ''}`.replace(/\s+/g, ' ').trim();
                  });
                  // Bricks per bag of cement, against this brick type's 1-year (or lifetime) average
                  const ratio = bricksPerBag(produced, cementBags(entry.materials));
                  const cementDiffPct = cementDiff(ratio, baselineOf(cementRowFor(cement, entry.product?._id))?.bricksPerBag);
                  const cementState = CEMENT_STATUS[cementStatus(cementDiffPct)];
                  return (
                    <tr key={entry._id} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{dayjs(entry.date).format('DD MMM YYYY')}</p>
                        <p className="text-xs text-slate-400">{dayjs(entry.date).format('dddd')}</p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                            <Hammer size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{entry.product?.name || '-'}</p>
                            {manyPlants && <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} /> {entry.plant?.name || '-'}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <span className="text-base font-bold text-slate-900">{num(produced)}</span> <span className="text-xs font-semibold text-slate-400">pcs</span>
                        {entry.plates > 0 && <p className="text-xs text-slate-400">{num(entry.plates)} plates × {num(entry.bricksPerPlate)}</p>}
                      </td>
                      <td className="table-cell">
                        <div className="w-36">
                          <p className="whitespace-nowrap text-xs">
                            <span className="font-semibold text-emerald-700">{num(produced - damaged)} good</span>
                            {damaged > 0 && <span className="font-semibold text-rose-600"> · {num(damaged)} damaged</span>}
                          </p>
                          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-emerald-500" title={`${damagedPct.toFixed(1)}% damaged`}>
                            <div className="ml-auto h-full bg-rose-500" style={{ width: `${Math.min(damagedPct, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {used.length === 0 ? <span className="text-xs text-slate-400">Not recorded</span> : (
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {used.map((u, i) => <span key={i} className="badge-gray whitespace-nowrap">{u}</span>)}
                          </div>
                        )}
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {ratio ? (
                          <>
                            <p className="font-semibold text-slate-800">{fmtRatio(ratio)} <span className="text-xs font-normal text-slate-400">bricks/bag</span></p>
                            {cementState && (
                              <span className={cementState.badge} title={`Against the 1-year average · ${cementState.hint}`}>
                                {cementState === CEMENT_STATUS.normal ? 'Normal' : diffText(cementDiffPct)}
                              </span>
                            )}
                          </>
                        ) : <span className="text-xs text-slate-400">No cement</span>}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${shift.cls}`}>
                          <ShiftIcon size={12} /> {entry.shift?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1">
                          <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => openForm(entry)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(entry._id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="table-footer flex items-center justify-between">
          <p>Page <span className="font-semibold text-slate-700">{page}</span> of <span className="font-semibold text-slate-700">{totalPages}</span></p>
          <div className="flex gap-1">
            <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Form */}
      {showForm && (
        <Modal
          title={`${editing ? 'Edit' : 'New'} Production Entry`}
          subtitle={editing ? 'Update this production record' : 'Record bricks produced for a shift'}
          onClose={() => setShowForm(false)}
          maxWidth="max-w-3xl"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </>}
        >
          <ModalSection number={1} title="Entry Details" tone="blue">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Shift</label>
                <select className="input capitalize" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                  {SHIFTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <PlantSelect plants={plants} value={form.plant} onChange={plant => setForm({ ...form, plant })} />
              <div>
                <label className="label">Brick Type</label>
                <OptionPicker options={productOptions} value={form.product} onChange={product => setForm(f => ({ ...f, product }))}
                  placeholder="Select Brick Type" searchPlaceholder="Search brick types..." />
              </div>
            </div>
          </ModalSection>

          <ModalSection number={2} title="Quantity" tone="emerald">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {form.byPlates ? (
                <>
                  <div>
                    <label className="label">Number of Plates</label>
                    <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="e.g. 120" value={form.plates} onChange={e => setPlates({ plates: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label className="label">Bricks per Plate</label>
                    <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="e.g. 105" value={form.bricksPerPlate} onChange={e => setPlates({ bricksPerPlate: e.target.value })} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-inset ring-emerald-200">
                    <span className="text-sm text-slate-600">
                      {num(Number(form.plates) || 0)} plates × {num(Number(form.bricksPerPlate) || 0)} bricks
                    </span>
                    <span className="text-lg font-bold text-emerald-700">= {num(Number(form.quantityProduced) || 0)} bricks</span>
                  </div>
                </>
              ) : (
                <div>
                  <label className="label">Quantity Produced</label>
                  <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="e.g. 5000" value={form.quantityProduced} onChange={e => setForm({ ...form, quantityProduced: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Damaged / Broken</label>
                <input type="number" {...NON_NEGATIVE} className="input font-semibold" placeholder="0" value={form.quantityDamaged} onChange={e => setForm({ ...form, quantityDamaged: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input" rows={2} placeholder="Optional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </ModalSection>

          {/* Materials used */}
          <ModalSection
            number={3}
            title="Materials Consumed"
            tone="purple"
            action={
              <button className="btn-secondary btn-sm" onClick={addMaterial}>
                <Plus size={14} /> Add Material
              </button>
            }
          >
            {form.materials.length === 0 && (
              <p className="text-xs text-slate-500 md:text-sm">No materials added. Use "Add Material" to record raw materials used.</p>
            )}
            {form.materials.map((m, i) => {
              const selected = findMaterial(m.material);
              // Only meaningful for a new entry — an existing entry's quantity is already deducted
              const overStock = !editing && selected && Number(m.quantity) > (selected.currentStock || 0);
              return (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                    <OptionPicker options={materialOptions} value={m.material} onChange={id => updateMaterial(i, { material: id, unit: unitOf(id) })}
                      placeholder="Select Material" searchPlaceholder="Search materials..." />
                    <input type="number" {...NON_NEGATIVE} className="input" placeholder="Qty" value={m.quantity} onChange={e => updateMaterial(i, { quantity: e.target.value })} />
                    <input className="input bg-slate-50 font-semibold text-slate-600" placeholder="Unit" value={m.unit} readOnly tabIndex={-1} title="Unit comes from the selected material" />
                    <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Remove material" onClick={() => removeMaterial(i)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {selected && (
                    <p className={`mt-1 text-xs ${overStock ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                      In stock: {(selected.currentStock || 0).toLocaleString('en-IN')} {selected.unit}
                      {overStock ? ' — quantity is more than the available stock' : ''}
                    </p>
                  )}
                </div>
              );
            })}
            {form.product && (
              <CementCheck
                bricks={Number(form.quantityProduced) || 0}
                bags={cementBags(form.materials)}
                unit={findMaterial(form.materials.find(m => isCement(findMaterial(m.material)?.name))?.material)?.unit}
                row={cementRowFor(formCement, form.product)}
              />
            )}
          </ModalSection>
        </Modal>
      )}
    </div>
  );
}
