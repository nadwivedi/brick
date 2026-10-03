import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { Package, AlertTriangle, CircleCheck, BookOpen } from 'lucide-react';

export default function InventoryPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock/summary')
      .then(res => setMaterials(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock = materials.filter(m => m.currentStock <= m.lowStockThreshold);
  const okStock = materials.filter(m => m.currentStock > m.lowStockThreshold);

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <div>
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Raw material stock levels</p>
      </div>

      {/* Summary */}
      <section className="grid grid-cols-3 gap-2.5 md:gap-4">
        <StatCard icon={Package} label="Total Materials" hint="Tracked raw materials" value={materials.length} tone="blue" />
        <StatCard icon={CircleCheck} label="Adequate Stock" hint="Above minimum level" value={okStock.length} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Low Stock Items" hint="Need restocking" value={lowStock.length} tone="rose" />
      </section>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-rose-200">
          <div className="flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 md:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Low Stock Alert</h3>
              <p className="text-xs text-slate-500">{lowStock.length} material{lowStock.length !== 1 ? 's' : ''} below the minimum level</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr>
                <th className="table-header">Material</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Min Required</th>
                <th className="table-header">Deficit</th>
                <th className="table-header">Unit</th>
              </tr></thead>
              <tbody>
                {lowStock.map(m => (
                  <tr key={m._id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{m.name}</td>
                    <td className="table-cell font-bold text-rose-600">{(m.currentStock || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell">{(m.lowStockThreshold || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell text-rose-600">{Math.max(0, m.lowStockThreshold - m.currentStock).toLocaleString('en-IN')}</td>
                    <td className="table-cell">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* All Stock */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="text-sm font-bold text-slate-900">All Materials Stock</h3>
          <p className="text-xs text-slate-500">Current stock against the minimum threshold</p>
        </div>
        {loading ? (
          <LoadingState label="Loading stock…" />
        ) : materials.length === 0 ? (
          <EmptyState icon={Package} title="No materials found" hint="Add materials in Masters → Raw Materials" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr>
                <th className="table-header">Material</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Min Threshold</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Stock Ledger</th>
              </tr></thead>
              <tbody>
                {materials.map(m => {
                  const isLow = m.currentStock <= m.lowStockThreshold;
                  const pct = m.lowStockThreshold > 0 ? Math.min(100, (m.currentStock / m.lowStockThreshold) * 100) : 100;
                  return (
                    <tr key={m._id} className="table-row">
                      <td className="table-cell font-semibold text-slate-800">{m.name}</td>
                      <td className="table-cell">{m.unit}</td>
                      <td className="table-cell">
                        <div>
                          <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {(m.currentStock || 0).toLocaleString('en-IN')} {m.unit}
                          </span>
                          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                            <div className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{(m.lowStockThreshold || 0).toLocaleString('en-IN')} {m.unit}</td>
                      <td className="table-cell">
                        <span className={isLow ? 'badge-red' : 'badge-green'}>{isLow ? 'Low' : 'OK'}</span>
                      </td>
                      <td className="table-cell text-right">
                        <Link className="btn-secondary btn-sm" to={`/inventory/ledger/${m._id}`}>
                          <BookOpen size={14} /> See Ledger
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
