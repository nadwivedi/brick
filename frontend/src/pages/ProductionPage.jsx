import { useState, useEffect } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal, { ModalSection } from '../components/Modal';
import SearchInput from '../components/SearchInput';
import { LoadingState, EmptyState } from '../components/States';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, Hammer } from 'lucide-react';
import dayjs from 'dayjs';

const SHIFTS = ['full_day', 'morning', 'evening', 'night'];

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
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    plant: '', product: '', quantityProduced: '', quantityDamaged: 0,
    shift: 'full_day', notes: '', materials: []
  });
  const [saving, setSaving] = useState(false);

  useEscapeKey(showForm, () => setShowForm(false));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesRes, productsRes, plantsRes, materialsRes] = await Promise.all([
        api.get(`/production?page=${page}`),
        api.get('/products'),
        api.get('/plants'),
        api.get('/materials'),
      ]);
      setEntries(entriesRes.data || []);
      setTotalPages(entriesRes.pages || 1);
      setProducts(productsRes.data || []);
      setPlants(plantsRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  // A consumed material is always counted in that material's own stock unit
  const findMaterial = (id) => materials.find(m => m._id === id);
  const unitOf = (id) => findMaterial(id)?.unit || '';

  const openForm = (entry = null) => {
    if (entry) {
      setEditing(entry._id);
      setForm({
        date: dayjs(entry.date).format('YYYY-MM-DD'),
        plant: entry.plant?._id || '',
        product: entry.product?._id || '',
        quantityProduced: entry.quantityProduced,
        quantityDamaged: entry.quantityDamaged || 0,
        shift: entry.shift,
        notes: entry.notes || '',
        materials: (entry.materials || []).map(m => {
          const id = m.material?._id || m.material || '';
          return { material: id, quantity: m.quantity ?? '', unit: unitOf(id) || m.unit || '' };
        })
      });
    } else {
      setEditing(null);
      setForm({ date: dayjs().format('YYYY-MM-DD'), plant: plants[0]?._id || '', product: '', quantityProduced: '', quantityDamaged: 0, shift: 'full_day', notes: '', materials: [] });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    // Blank rows are ignored; a chosen material must have a quantity
    const used = form.materials.filter(m => m.material);
    if (used.some(m => !(Number(m.quantity) > 0))) {
      alert('Enter the quantity used for each material');
      return;
    }
    const problem =
      !form.plant ? 'Select a plant' :
      !form.product ? 'Select a product' :
      form.quantityProduced === '' || Number(form.quantityProduced) < 0 ? 'Enter the quantity produced' : '';
    if (problem) { alert(problem); return; }
    const payload = {
      ...form,
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

  const removeMaterial = (idx) => {
    setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }));
  };

  const filtered = entries.filter(e =>
    (e.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.plant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 fade-in">
      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div>
              <h1 className="page-title">Production</h1>
              <p className="page-subtitle">Track daily brick production entries</p>
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
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Plant</th>
                  <th className="table-header">Product</th>
                  <th className="table-header">Produced</th>
                  <th className="table-header">Damaged</th>
                  <th className="table-header">Shift</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => (
                  <tr key={entry._id} className="table-row">
                    <td className="table-cell whitespace-nowrap font-semibold text-slate-800">{dayjs(entry.date).format('DD MMM YYYY')}</td>
                    <td className="table-cell">{entry.plant?.name || '-'}</td>
                    <td className="table-cell">{entry.product?.name || '-'}</td>
                    <td className="table-cell whitespace-nowrap font-semibold text-emerald-700">
                      {new Intl.NumberFormat('en-IN').format(entry.quantityProduced)} pcs
                    </td>
                    <td className="table-cell text-rose-600">{entry.quantityDamaged || 0}</td>
                    <td className="table-cell capitalize">
                      <span className="badge-orange">{entry.shift?.replace('_', ' ')}</span>
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
                ))}
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
              <div>
                <label className="label">Plant</label>
                <select className="input" value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}>
                  <option value="">Select Plant</option>
                  {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Product</label>
                <select className="input" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </ModalSection>

          <ModalSection number={2} title="Quantity" tone="emerald">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="label">Quantity Produced</label>
                <input type="number" className="input font-semibold" placeholder="e.g. 5000" value={form.quantityProduced} onChange={e => setForm({ ...form, quantityProduced: e.target.value })} />
              </div>
              <div>
                <label className="label">Damaged / Broken</label>
                <input type="number" className="input font-semibold" placeholder="0" value={form.quantityDamaged} onChange={e => setForm({ ...form, quantityDamaged: e.target.value })} />
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
                    <select className="input" value={m.material} onChange={e => updateMaterial(i, { material: e.target.value, unit: unitOf(e.target.value) })}>
                      <option value="">Select Material</option>
                      {materials.map(mat => <option key={mat._id} value={mat._id}>{mat.name}</option>)}
                    </select>
                    <input type="number" className="input" placeholder="Qty" value={m.quantity} onChange={e => updateMaterial(i, { quantity: e.target.value })} />
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
          </ModalSection>
        </Modal>
      )}
    </div>
  );
}
