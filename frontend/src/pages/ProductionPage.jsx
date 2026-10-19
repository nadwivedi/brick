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

  const made = Number(form.quantityProduced) || 0;
  const damaged = Number(form.quantityDamaged) || 0;
  const tooManyDamaged = damaged > made;

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
          subtitle={editing ? 'Update this production record' : 'Bricks made in a shift and the materials they used'}
          onClose={() => setShowForm(false)}
          maxWidth="max-w-2xl"
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
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
                    const { icon: Icon } = SHIFT_STYLES[key];
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
                bags={cementBags(form.materials)}
                unit={findMaterial(form.materials.find(m => isCement(findMaterial(m.material)?.name))?.material)?.unit}
                row={cementRowFor(formCement, form.product)}
              />
            )}
          </ModalSection>

          <div>
            <label className="label">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <input className="input" placeholder="Anything worth remembering about this batch" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}
