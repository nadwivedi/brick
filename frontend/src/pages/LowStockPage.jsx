import { useEffect, useState } from 'react';
import api from '../lib/api';
import { LoadingState, EmptyState } from '../components/States';
import { AlertTriangle, CircleCheck, Package } from 'lucide-react';

export default function LowStockPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock/summary')
      .then(res => {
        const low = (res.data || []).filter(m => m.currentStock <= m.lowStockThreshold);
        setMaterials(low);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 fade-in">
      <section className="panel">
        <div className="panel-header flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h1 className="page-title">Low Stock Alerts</h1>
            <p className="page-subtitle">Materials that have fallen below minimum threshold</p>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Checking stock levels…" />
        ) : materials.length === 0 ? (
          <EmptyState icon={CircleCheck} tone="emerald" title="All stocks are adequate!" hint="No materials are below their minimum threshold" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header">Material</th>
                  <th className="table-header">Unit</th>
                  <th className="table-header">Current Stock</th>
                  <th className="table-header">Min Threshold</th>
                  <th className="table-header">Deficit</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
                          <Package size={18} />
                        </span>
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">{m.unit}</td>
                    <td className="table-cell font-bold text-rose-600">
                      {(m.currentStock || 0).toLocaleString('en-IN')} {m.unit}
                    </td>
                    <td className="table-cell">{(m.lowStockThreshold || 0).toLocaleString('en-IN')} {m.unit}</td>
                    <td className="table-cell font-semibold text-rose-600">
                      {Math.max(0, m.lowStockThreshold - m.currentStock).toLocaleString('en-IN')} {m.unit}
                    </td>
                    <td className="table-cell">
                      <span className="badge-red">Low Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="table-footer">
          {materials.length} item{materials.length !== 1 ? 's' : ''} below threshold
        </p>
      </section>
    </div>
  );
}
