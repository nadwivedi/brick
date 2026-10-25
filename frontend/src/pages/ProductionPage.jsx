import { useState, useEffect } from 'react';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useOpenOnNew from '../hooks/useOpenOnNew';
import ProductionFormModal from '../components/ProductionFormModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Hammer, CalendarDays, CircleCheck, TriangleAlert, Sun, Sunrise, Sunset, Moon, MapPin, Layers } from 'lucide-react';
import CementRatioPanel from '../components/CementRatio';
import { isCement, bricksPerBag, cementDiff, cementStatus, CEMENT_STATUS, fmtRatio, diffText, baselineOf } from '../lib/cement';
import dayjs from 'dayjs';

const SHIFT_STYLES = {
  full_day: { icon: Sun, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  morning: { icon: Sunrise, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  evening: { icon: Sunset, cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  night: { icon: Moon, cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
};

const num = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
// Adds up the per-product rows returned by /production/summary (optionally one brick type only)
const sumSummary = (rows, productId) => (rows || []).filter(r => !productId || String(r._id) === productId).reduce(
  (t, r) => ({ produced: t.produced + (r.totalProduced || 0), damaged: t.damaged + (r.totalDamaged || 0), count: t.count + (r.count || 0) }),
  { produced: 0, damaged: 0, count: 0 }
);

export default function ProductionPage() {
  const [entries, setEntries] = useState([]);
  const [plants, setPlants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formEntry, setFormEntry] = useState(undefined); // undefined = closed, null = new entry, else the entry being edited
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ all: [], month: [], today: [] }); // per brick type rows for each period
  const [products, setProducts] = useState([]); // brick types
  const [productFilter, setProductFilter] = useState(''); // '' = all brick types
  const [cement, setCement] = useState(null); // cement ratios as of today

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [entriesRes, plantsRes, materialsRes, allRes, monthRes, todayRes, cementRes, productsRes] = await Promise.all([
        api.get('/production', { params: { page, product: productFilter || undefined } }),
        api.get('/plants'),
        api.get('/materials'),
        api.get('/production/summary'),
        api.get('/production/summary', { params: { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: today } }),
        api.get('/production/summary', { params: { from: today, to: today } }),
        api.get('/production/cement-ratio', { params: { asOf: today } }),
        api.get('/products'),
      ]);
      setCement(cementRes.data || null);
      setSummary({ all: allRes.data || [], month: monthRes.data || [], today: todayRes.data || [] });
      // Oldest brick type first, so the list keeps the same order
      setProducts((productsRes.data || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setEntries(entriesRes.data || []);
      setTotalPages(entriesRes.pages || 1);
      setPlants(plantsRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, productFilter]);

  const pickProduct = (id) => { setPage(1); setProductFilter(id); };

  // The cards and totals follow the brick type picked
  const totals = {
    all: sumSummary(summary.all, productFilter),
    month: sumSummary(summary.month, productFilter),
    today: sumSummary(summary.today, productFilter),
  };
  const everything = sumSummary(summary.all);
  // Brick types with production, plus any still in use
  const typeCards = products
    .map(p => ({ product: p, all: sumSummary(summary.all, p._id), month: sumSummary(summary.month, p._id), today: sumSummary(summary.today, p._id) }))
    .filter(t => t.all.count > 0 || t.product.isActive !== false);
  const pickedName = products.find(p => p._id === productFilter)?.name;

  const findMaterial = (id) => materials.find(m => m._id === id);

  const openForm = (entry = null) => setFormEntry(entry);

  useOpenOnNew(!loading, () => openForm());

  const handleDelete = async (id) => {
    if (!confirm('Delete this production entry?')) return;
    await api.delete(`/production/${id}`);
    fetchData();
  };

  // Bags of cement in a list of consumed materials
  const cementBags = (list) => (list || [])
    .filter(m => isCement(findMaterial(m.material?._id || m.material)?.name))
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0);
  const cementRowFor = (data, productId) => data?.products?.find(r => r.product._id === productId);

  const manyPlants = hasManyPlants(plants);

  const filtered = entries.filter(e =>
    (e.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.plant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Totals (for the brick type picked below, or all) */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Hammer} label={pickedName ? `Today · ${pickedName}` : 'Today'} hint={`${totals.today.count} ${totals.today.count === 1 ? 'entry' : 'entries'} today`} value={`${num(totals.today.produced)} pcs`} tone="blue" />
        <StatCard icon={CalendarDays} label={pickedName ? `This Month · ${pickedName}` : 'This Month'} hint={`${totals.month.count} ${totals.month.count === 1 ? 'entry' : 'entries'} in ${dayjs().format('MMMM')}`} value={`${num(totals.month.produced)} pcs`} tone="indigo" />
        <StatCard icon={CircleCheck} label="Good Bricks" hint={`Out of ${num(totals.all.produced)} produced in all`} value={`${num(totals.all.produced - totals.all.damaged)} pcs`} tone="emerald" />
        <StatCard icon={TriangleAlert} label="Damaged" hint={totals.all.produced ? `${((totals.all.damaged / totals.all.produced) * 100).toFixed(1)}% of all production` : 'No production yet'} value={`${num(totals.all.damaged)} pcs`} tone="rose" />
      </section>

      {/* Production per brick type; picking one shows only that type on this page */}
      {typeCards.length > 0 && (
        <section className="panel">
          <div className="panel-header flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">By Brick Type</h3>
              <p className="text-xs text-slate-500">Total produced of each type. Pick one to see only that type.</p>
            </div>
            {productFilter && (
              <button type="button" className="text-xs font-semibold text-primary-600 hover:underline" onClick={() => pickProduct('')}>Show all types</button>
            )}
          </div>
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto p-3 md:grid md:grid-cols-3 md:p-4 xl:grid-cols-4">
            {[{ product: { _id: '', name: 'All Brick Types' }, all: everything, month: sumSummary(summary.month), today: sumSummary(summary.today) }, ...typeCards].map(t => {
              const active = productFilter === t.product._id;
              return (
                <button
                  key={t.product._id || 'all'}
                  type="button"
                  onClick={() => pickProduct(t.product._id)}
                  aria-pressed={active}
                  className={`w-52 shrink-0 rounded-xl border-2 p-3 text-left transition md:w-auto ${active ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${active ? 'bg-primary-600 text-white ring-primary-600' : 'bg-blue-50 text-blue-700 ring-blue-100'}`}>
                      <Layers size={15} />
                    </span>
                    <span className="truncate text-sm font-bold text-slate-800">{t.product.name}</span>
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{num(t.all.produced)} <span className="text-xs font-semibold text-slate-400">pcs</span></p>
                  <p className="text-[11px] text-slate-500">
                    {num(t.all.produced - t.all.damaged)} good{t.all.damaged > 0 ? ` · ${num(t.all.damaged)} damaged` : ''}
                  </p>
                  <p className="mt-1.5 flex justify-between gap-2 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                    <span>Month <span className="font-semibold text-slate-700">{num(t.month.produced)}</span></span>
                    <span>Today <span className="font-semibold text-slate-700">{num(t.today.produced)}</span></span>
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <CementRatioPanel data={cement} />

      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Production</h1>
              <p className="page-subtitle">{pickedName ? `${pickedName} production, damage and the materials each batch used` : 'Daily brick production, damage and the materials each batch used'}</p>
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
          <EmptyState icon={Hammer} title="No production entries found" hint={search ? 'Try a different search.' : pickedName ? `No ${pickedName} production yet.` : 'Add your first production entry to get started.'} />
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

      {formEntry !== undefined && (
        <ProductionFormModal
          entry={formEntry}
          onClose={() => setFormEntry(undefined)}
          onSaved={() => { setFormEntry(undefined); fetchData(); }}
        />
      )}
    </div>
  );
}
