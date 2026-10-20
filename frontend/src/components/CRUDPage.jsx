import { useState, useEffect } from 'react';
import api from '../lib/api';
import useEscapeKey from '../hooks/useEscapeKey';
import Modal from './Modal';
import SearchInput from './SearchInput';
import { LoadingState, EmptyState } from './States';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

/**
 * Reusable CRUD page
 * Props:
 * - title, subtitle: page header
 * - endpoint: API path e.g. '/plants'
 * - columns: [{ key, label, render? }]
 * - fields: [{ key, label, type, options?, show? }] — for the form; show(form) hides a field when it returns false.
 *   type 'custom' takes render(value, set, form) and spans the full width
 * - defaultValues: {} — initial form state
 * - canDelete: (item) => bool — hide the delete button for rows that can't be deleted
 * - rowActions: (item, refresh) => node — extra buttons shown before Edit/Delete on each row
 * - summary: (items) => node — shown above the list, e.g. stat cards
 * - searchKeys: [key] — fields the search box looks in (defaults to the column keys)
 */
export default function CRUDPage({ title, subtitle, endpoint, columns, fields, defaultValues, canDelete = () => true, rowActions, summary, searchKeys }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultValues || {});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEscapeKey(showForm, () => setShowForm(false));

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      setItems(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [endpoint]);

  const openForm = (item = null) => {
    if (item) {
      setEditing(item._id);
      const vals = {};
      fields.forEach(f => { vals[f.key] = item[f.key] ?? defaultValues[f.key] ?? ''; });
      setForm(vals);
    } else {
      setEditing(null);
      setForm(defaultValues || {});
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing}`, form);
      } else {
        await api.post(endpoint, form);
      }
      setShowForm(false);
      fetchItems();
    } catch (e) { alert(e.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete this ${singular.toLowerCase()}?`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchItems();
    } catch (e) { alert(e.message || 'Delete failed'); }
  };

  const keys = searchKeys || columns.map(col => col.key);
  const filtered = items.filter(item =>
    keys.some(key => String(item[key] || '').toLowerCase().includes(search.toLowerCase()))
  );

  const singular = title.endsWith('ies') ? `${title.slice(0, -3)}y` : title.endsWith('s') ? title.slice(0, -1) : title;
  const twoColumns = fields.length > 3;

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {summary?.(items)}
      <section className="panel">
        <div className="panel-header">
          <div className="page-header">
            <div className="min-w-0">
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            <div className="flex gap-2 md:shrink-0">
              <SearchInput className="flex-1 md:w-72 md:flex-none" value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
              <button className="btn-primary flex-shrink-0" onClick={() => openForm()}>
                <Plus size={18} />
                <span className="hidden sm:inline">Add {singular}</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState label={`Loading ${title.toLowerCase()}…`} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} yet`}
            hint={search ? 'Try a different search.' : `Use "Add ${singular}" to create the first one.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {columns.map(col => <th key={col.key} className="table-header">{col.label}</th>)}
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id} className="table-row">
                    {columns.map((col, i) => (
                      <td key={col.key} className={`table-cell ${i === 0 ? 'font-semibold text-slate-800' : ''}`}>
                        {col.render ? col.render(item) : (item[col.key] || '-')}
                      </td>
                    ))}
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {rowActions?.(item, fetchItems)}
                        <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => openForm(item)}>
                          <Edit2 size={16} />
                        </button>
                        {canDelete(item) && <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDelete(item._id)}>
                          <Trash2 size={16} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="table-footer">
          Showing {filtered.length} of {items.length} {title.toLowerCase()}
        </p>
      </section>

      {/* Modal Form */}
      {showForm && (
        <Modal
          title={`${editing ? 'Edit' : 'Add'} ${singular}`}
          subtitle={editing ? `Update ${singular.toLowerCase()} details` : `Add a new ${singular.toLowerCase()}`}
          onClose={() => setShowForm(false)}
          maxWidth={twoColumns ? 'max-w-2xl' : 'max-w-md'}
          footer={<>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>}
        >
          <div className={`grid grid-cols-1 gap-3 md:gap-4 ${twoColumns ? 'md:grid-cols-2' : ''}`}>
            {fields.filter(f => !f.show || f.show(form)).map(f => (
              <div key={f.key} className={twoColumns && ['textarea', 'custom'].includes(f.type) ? 'md:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {f.type === 'custom' ? (
                  f.render(form[f.key], value => setForm(prev => ({ ...prev, [f.key]: value })), form)
                ) : f.type === 'select' ? (
                  <select className="input" value={form[f.key] == null ? '' : String(form[f.key])} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">Select {f.label}</option>
                    {(f.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea className="input" rows={3} placeholder={f.placeholder || f.label}
                    value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                ) : (
                  <input
                    type={f.type || 'text'} className="input"
                    placeholder={f.placeholder || f.label}
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
