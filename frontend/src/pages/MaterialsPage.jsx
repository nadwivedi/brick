import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CRUDPage from '../components/CRUDPage';
import api from '../lib/api';

export default function MaterialsPage() {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    api.get('/units').then(res => setUnits(res.data || [])).catch(console.error);
  }, []);

  return (
    <CRUDPage
      title="Raw Materials"
      subtitle={<>Manage fly ash, cement, sand, and other raw materials · <Link to="/masters/units" className="font-semibold text-primary-600 hover:underline">Manage units</Link></>}
      endpoint="/materials"
      columns={[
        { key: 'name', label: 'Material Name' },
        { key: 'unit', label: 'Unit' },
        { key: 'currentStock', label: 'Current Stock', render: r => {
          const isLow = r.currentStock <= r.lowStockThreshold;
          return <span className={isLow ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
            {(r.currentStock || 0).toLocaleString('en-IN')} {r.unit}
          </span>;
        }},
        { key: 'lowStockThreshold', label: 'Min Threshold', render: r => `${r.lowStockThreshold || 0} ${r.unit}` },
        { key: 'status', label: 'Stock Status', render: r => {
          const isLow = r.currentStock <= r.lowStockThreshold;
          return <span className={isLow ? 'badge-red' : 'badge-green'}>{isLow ? 'Low Stock' : 'OK'}</span>;
        }},
      ]}
      fields={[
        { key: 'name', label: 'Material Name', placeholder: 'e.g. Fly Ash, Cement, Sand' },
        { key: 'unit', label: 'Unit', type: 'select', options: units.map(u => ({ value: u.name, label: u.code ? `${u.name} (${u.code})` : u.name })) },
        { key: 'currentStock', label: 'Opening Stock', type: 'number', placeholder: '0' },
        { key: 'lowStockThreshold', label: 'Low Stock Alert Threshold', type: 'number', placeholder: '0' },
      ]}
      defaultValues={{ name: '', unit: '', currentStock: 0, lowStockThreshold: 0 }}
    />
  );
}
