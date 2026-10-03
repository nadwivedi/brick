import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, Wallet, Scale } from 'lucide-react';
import api from '../lib/api';
import CRUDPage from '../components/CRUDPage';
import PartyCell from '../components/PartyCell';
import StatCard from '../components/StatCard';
import dayjs from 'dayjs';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function CustomersPage() {
  // Sales, payments received and balance due per customer id
  const [balances, setBalances] = useState({});

  useEffect(() => {
    api.get('/party-balances/customer').then(res => setBalances(res.data || {})).catch(console.error);
  }, []);

  const of = (r) => balances[r._id] || { billed: 0, paid: 0, balance: r.openingBalance || 0, count: 0, lastDate: null };

  return (
    <CRUDPage
      title="Customers"
      subtitle="Your brick buyers, what they bought and what they still have to pay"
      endpoint="/customers"
      searchKeys={['name', 'mobile', 'address', 'gstin']}
      summary={items => {
        const totals = items.reduce((t, c) => {
          const b = of(c);
          return { billed: t.billed + b.billed, paid: t.paid + b.paid, due: t.due + Math.max(b.balance, 0), owing: t.owing + (b.balance > 0 ? 1 : 0) };
        }, { billed: 0, paid: 0, due: 0, owing: 0 });
        return (
          <section className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
            <StatCard icon={Users} label="Customers" hint={`${items.filter(c => c.isActive).length} active`} value={items.length} tone="blue" />
            <StatCard icon={FileText} label="Total Sales" hint="Invoiced to all customers" value={fmt(totals.billed)} tone="indigo" />
            <StatCard icon={Wallet} label="Received" hint="Payments received so far" value={fmt(totals.paid)} tone="emerald" />
            <StatCard icon={Scale} label="To Receive" hint={`${totals.owing} customer${totals.owing === 1 ? '' : 's'} still to pay`} value={fmt(totals.due)} tone="rose" />
          </section>
        );
      }}
      columns={[
        { key: 'name', label: 'Customer', render: r => <PartyCell name={r.name} mobile={r.mobile} /> },
        { key: 'address', label: 'Address', render: r => (
          <div className="max-w-[220px]">
            <p className="truncate" title={r.address}>{r.address || '-'}</p>
            {r.gstin && <p className="truncate text-xs text-slate-400">GSTIN {r.gstin}</p>}
          </div>
        ) },
        { key: 'sales', label: 'Sales', render: r => {
          const b = of(r);
          return (
            <div className="whitespace-nowrap">
              <p className="font-semibold text-slate-800">{fmt(b.billed)}</p>
              <p className="text-xs text-slate-400">{b.count ? `${b.count} invoice${b.count === 1 ? '' : 's'} · last ${dayjs(b.lastDate).format('D MMM')}` : 'No sales yet'}</p>
            </div>
          );
        } },
        { key: 'received', label: 'Received', render: r => <span className="whitespace-nowrap font-semibold text-emerald-700">{fmt(of(r).paid)}</span> },
        { key: 'balance', label: 'Balance Due', render: r => {
          const { balance } = of(r);
          const overLimit = r.creditLimit > 0 && balance > r.creditLimit;
          return (
            <div className="whitespace-nowrap">
              {balance > 0
                ? <p className="font-bold text-rose-600">{fmt(balance)}</p>
                : balance < 0
                  ? <p className="font-bold text-emerald-700">{fmt(-balance)} <span className="text-xs font-semibold">advance</span></p>
                  : <span className="badge-green">Settled</span>}
              {r.creditLimit > 0 && (
                <p className={`text-xs ${overLimit ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                  {overLimit ? 'Over limit of ' : 'Limit '}{fmt(r.creditLimit)}
                </p>
              )}
            </div>
          );
        } },
        { key: 'isActive', label: 'Status', render: r => <span className={r.isActive ? 'badge-green' : 'badge-gray'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Customer Name', placeholder: 'Full name' },
        { key: 'mobile', label: 'Mobile Number', type: 'tel' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'gstin', label: 'GSTIN (Optional)' },
        { key: 'openingBalance', label: 'Opening Balance (₹)', type: 'number', placeholder: '0' },
        { key: 'creditLimit', label: 'Credit Limit (₹)', type: 'number', placeholder: '0' },
        {
          key: 'isActive', label: 'Status', type: 'select', options: [
            { value: true, label: 'Active' }, { value: false, label: 'Inactive' }
          ]
        },
      ]}
      rowActions={r => (
        <Link className="btn-secondary btn-sm mr-1 whitespace-nowrap" to={`/masters/customers/${r._id}/ledger`}>
          <BookOpen size={14} /> Ledger
        </Link>
      )}
      defaultValues={{ name: '', mobile: '', address: '', gstin: '', openingBalance: 0, creditLimit: 0, isActive: true }}
    />
  );
}
