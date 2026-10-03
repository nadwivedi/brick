import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Truck, ShoppingCart, Wallet, Scale } from 'lucide-react';
import api from '../lib/api';
import CRUDPage from '../components/CRUDPage';
import PartyCell from '../components/PartyCell';
import StatCard from '../components/StatCard';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function VendorsPage() {
  // Purchases, payments made and balance to pay per vendor id
  const [balances, setBalances] = useState({});

  useEffect(() => {
    api.get('/party-balances/vendor').then(res => setBalances(res.data || {})).catch(console.error);
  }, []);

  const of = (r) => balances[r._id] || { billed: 0, paid: 0, balance: r.openingBalance || 0, count: 0, lastDate: null };

  return (
    <CRUDPage
      title="Vendors"
      subtitle="Your raw material suppliers, what you bought and what you still have to pay"
      endpoint="/vendors"
      searchKeys={['name', 'mobile', 'address', 'gstin']}
      summary={items => {
        const totals = items.reduce((t, v) => {
          const b = of(v);
          return { billed: t.billed + b.billed, paid: t.paid + b.paid, due: t.due + Math.max(b.balance, 0), owing: t.owing + (b.balance > 0 ? 1 : 0) };
        }, { billed: 0, paid: 0, due: 0, owing: 0 });
        return (
          <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
            <StatCard icon={Truck} label="Vendors" hint={`${items.filter(v => v.isActive).length} active`} value={items.length} tone="blue" />
            <StatCard icon={ShoppingCart} label="Total Purchases" hint="Bought from all vendors" value={fmt(totals.billed)} tone="indigo" />
            <StatCard icon={Wallet} label="Paid" hint="Payments made so far" value={fmt(totals.paid)} tone="emerald" />
            <StatCard icon={Scale} label="To Pay" hint={`${totals.owing} vendor${totals.owing === 1 ? '' : 's'} to be paid`} value={fmt(totals.due)} tone="rose" />
          </section>
        );
      }}
      columns={[
        { key: 'name', label: 'Vendor', render: r => <PartyCell name={r.name} mobile={r.mobile} /> },
        { key: 'address', label: 'Address', render: r => (
          <div className="max-w-[220px]">
            <p className="truncate" title={r.address}>{r.address || '-'}</p>
            {r.gstin && <p className="truncate text-xs text-slate-400">GSTIN {r.gstin}</p>}
          </div>
        ) },
        { key: 'purchases', label: 'Purchases', render: r => {
          const b = of(r);
          return (
            <div className="whitespace-nowrap">
              <p className="font-semibold text-slate-800">{fmt(b.billed)}</p>
              <p className="text-xs text-slate-400">{b.count ? `${b.count} purchase${b.count === 1 ? '' : 's'} · last ${dayjs(b.lastDate).format('D MMM')}` : 'No purchases yet'}</p>
            </div>
          );
        } },
        { key: 'paid', label: 'Paid', render: r => <span className="whitespace-nowrap font-semibold text-emerald-700">{fmt(of(r).paid)}</span> },
        { key: 'balance', label: 'Balance To Pay', render: r => {
          const { balance } = of(r);
          return balance > 0
            ? <span className="whitespace-nowrap font-bold text-rose-600">{fmt(balance)}</span>
            : balance < 0
              ? <span className="whitespace-nowrap font-bold text-emerald-700">{fmt(-balance)} <span className="text-xs font-semibold">advance</span></span>
              : <span className="badge-green">Settled</span>;
        } },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Vendor Name' },
        { key: 'mobile', label: 'Mobile', type: 'tel' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'openingBalance', label: 'Opening Balance (₹)', type: 'number', placeholder: '0' },
      ]}
      rowActions={r => (
        <Link className="btn-secondary btn-sm mr-1 whitespace-nowrap" to={`/masters/vendors/${r._id}/ledger`}>
          <BookOpen size={14} /> Ledger
        </Link>
      )}
      defaultValues={{ name: '', mobile: '', address: '', gstin: '', openingBalance: 0, isActive: true }}
    />
  );
}
