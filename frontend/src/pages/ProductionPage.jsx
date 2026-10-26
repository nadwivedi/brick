import { useState, useEffect } from 'react';
import api from '../lib/api';
import { hasManyPlants } from '../lib/plants';
import useOpenOnNew from '../hooks/useOpenOnNew';
import ProductionFormModal from '../components/ProductionFormModal';
import SearchInput from '../components/SearchInput';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Hammer, CircleCheck, ShoppingBag, Package, Sun, Sunrise, Sunset, Moon, MapPin, Layers } from 'lucide-react';
import Segmented from '../components/Segmented';
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
const money = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const DATE_FMT = 'YYYY-MM-DD';
// Periods the totals, brick type cards and list can be looked at for
const PERIODS = [
  { key: 'today', label: 'Today', get: () => [dayjs(), dayjs()] },
  { key: 'yesterday', label: 'Yesterday', get: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { key: 'last7', label: 'Last 7 Days', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30', label: 'Last 30 Days', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
  { key: 'all', label: 'All Time', get: () => [null, null] },
];
const periodRange = (key) => {
  const [from, to] = (PERIODS.find(p => p.key === key) || PERIODS[0]).get();
  return { from: from ? from.format(DATE_FMT) : undefined, to: to ? to.format(DATE_FMT) : undefined };
};
const rangeText = ({ from, to }) => (!from ? 'Since the first entry'
  : from === to ? dayjs(from).format('D MMM YYYY')
  : `${dayjs(from).format('D MMM')} – ${dayjs(to).format('D MMM YYYY')}`);

const EMPTY = { produced: 0, damaged: 0, entries: 0, sold: 0, soldAmount: 0, bags: 0, cementBricks: 0, bricksPerBag: null };
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;

export default function ProductionPage() {
  const [entries, setEntries] = useState([]);
  const [plants, setPlants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formEntry, setFormEntry] = useState(undefined); // undefined = closed, null = new entry, else the entry being edited
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [period, setPeriod] = useState('today');
  const [overview, setOverview] = useState({ totals: EMPTY, products: [] }); // made, sold and bricks per bag for the period
  const [productFilter, setProductFilter] = useState(''); // '' = all brick types
  const [cement, setCement] = useState(null); // cement ratios as of today
  const range = periodRange(period);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = dayjs().format(DATE_FMT);
      const [entriesRes, plantsRes, materialsRes, overviewRes, cementRes] = await Promise.all([
        api.get('/production', { params: { page, product: productFilter || undefined, ...range } }),
        api.get('/plants'),
        api.get('/materials'),
        api.get('/production/overview', { params: range }),
        api.get('/production/cement-ratio', { params: { asOf: today } }),
      ]);
      setCement(cementRes.data || null);
      setOverview(overviewRes.data || { totals: EMPTY, products: [] });
      setEntries(entriesRes.data || []);
      setTotalPages(entriesRes.pages || 1);
      setPlants(plantsRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, productFilter, period]);

  const pickProduct = (id) => { setPage(1); setProductFilter(id); };
  const pickPeriod = (key) => { setPage(1); setPeriod(key); };

  // Brick types made or sold in the period, plus any still in use
  const typeRows = overview.products.filter(r => r.produced > 0 || r.sold > 0 || r.product.isActive !== false);
  const picked = typeRows.find(r => r.product._id === productFilter);
  const pickedName = picked?.product.name;
  // The cards follow the brick type picked
  const totals = picked || overview.totals || EMPTY;
  const periodLabel = PERIODS.find(p => p.key === period)?.label;
  const damagedPct = totals.produced ? (totals.damaged / totals.produced) * 100 : 0;

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
      {/* Period picker: the cards, brick types and list below all follow it */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">{periodLabel}{pickedName ? ` · ${pickedName}` : ''}</h2>
          <p className="text-xs text-slate-500">{rangeText(range)}</p>
        </div>
        <Segmented options={PERIODS} value={period} onChange={pickPeriod} />
      </div>

      {/* Totals for the period (and the brick type picked below, or all) */}
      <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Hammer} label="Produced" hint={plural(totals.entries, 'entry', 'entries')} value={`${num(totals.produced)} pcs`} tone="blue" />
        <StatCard icon={CircleCheck} label="Good Bricks" hint={totals.damaged ? `${num(totals.damaged)} damaged (${damagedPct.toFixed(1)}%)` : 'None damaged'} value={`${num(totals.produced - totals.damaged)} pcs`} tone="emerald" />
        <StatCard icon={ShoppingBag} label="Sold" hint={totals.sold ? `Worth ${money(totals.soldAmount)}` : 'No bricks sold'} value={`${num(totals.sold)} pcs`} tone="indigo" />
        <StatCard icon={Package} label="Avg Bricks / Bag" hint={totals.bags ? `${num(totals.cementBricks)} bricks from ${num(totals.bags)} bags of cement` : 'No cement recorded'} value={fmtRatio(totals.bricksPerBag)} tone="amber" />
      </section>

      {/* Each brick type for the period; picking one shows only that type on this page */}
      {typeRows.length > 0 && (
        <section className="panel">
          <div className="panel-header flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">By Brick Type</h3>
              <p className="text-xs text-slate-500">Made, sold and bricks per bag of cement · {periodLabel}. Pick one to see only that type.</p>
            </div>
            {productFilter && (
              <button type="button" className="text-xs font-semibold text-primary-600 hover:underline" onClick={() => pickProduct('')}>Show all types</button>
            )}
          </div>
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto p-3 md:grid md:grid-cols-3 md:p-4 xl:grid-cols-4">
            {[{ product: { _id: '', name: 'All Brick Types' }, ...(overview.totals || EMPTY) }, ...typeRows].map(t => {
              const active = productFilter === t.product._id;
              return (
                <button
                  key={t.product._id || 'all'}
                  type="button"
                  onClick={() => pickProduct(t.product._id)}
                  aria-pressed={active}
                  className={`w-56 shrink-0 rounded-xl border-2 p-3 text-left transition md:w-auto ${active ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${active ? 'bg-primary-600 text-white ring-primary-600' : 'bg-blue-50 text-blue-700 ring-blue-100'}`}>
                      <Layers size={15} />
                    </span>
                    <span className="truncate text-sm font-bold text-slate-800">{t.product.name}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Produced</p>
                      <p className="text-lg font-bold leading-tight text-slate-900">{num(t.produced)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sold</p>
                      <p className="text-lg font-bold leading-tight text-indigo-700">{num(t.sold)}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 flex justify-between gap-2 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                    <span>{t.damaged > 0 ? `${num(t.damaged)} damaged` : 'None damaged'}</span>
                    <span><span className="font-semibold text-slate-700">{fmtRatio(t.bricksPerBag)}</span> bricks/bag</span>
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
          <EmptyState icon={Hammer} title="No production entries found" hint={search ? 'Try a different search.' : period !== 'all' ? `No ${pickedName ? `${pickedName} ` : ''}production ${periodLabel.toLowerCase()}. Pick another period above.` : pickedName ? `No ${pickedName} production yet.` : 'Add your first production entry to get started.'} />
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
