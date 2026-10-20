import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState } from '../components/States';
import { AccountFormModal, TransferModal } from '../components/AccountModals';
import { ArrowLeftRight, Banknote, BookOpen, Landmark, Pencil, Plus, Star, Trash2, Wallet } from 'lucide-react';

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Cash books and bank accounts with how much is in each one now. */
export default function AccountsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  // null | { kind: 'account', account? } | { kind: 'transfer' }
  const [popup, setPopup] = useState(null);

  const load = () => api.get('/accounts/summary')
    .then(res => { setSummary(res.data); setError(''); })
    .catch(e => setError(e.message || 'Could not load accounts'));

  useEffect(() => { load(); }, []);

  const accounts = summary?.accounts || [];

  const saveAccount = async (payload) => {
    const editing = popup?.account;
    if (editing) await api.put(`/accounts/${editing._id}`, payload);
    else await api.post('/accounts', payload);
    setPopup(null);
    load();
  };

  const saveTransfer = async (payload) => {
    await api.post('/accounts/transfers', payload);
    setPopup(null);
    load();
  };

  const makeDefault = async (account) => {
    try {
      await api.post(`/accounts/${account._id}/default`);
      load();
    } catch (e) { alert(e.message || 'Could not change the default account'); }
  };

  const deleteAccount = async (account) => {
    if (!confirm(`Delete the account "${account.name}"?`)) return;
    try {
      await api.delete(`/accounts/${account._id}`);
      load();
    } catch (e) { alert(e.message || 'Could not delete the account'); }
  };

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cash &amp; Bank</h1>
          <p className="page-subtitle">Your cash books and bank accounts, and how much is in each one</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1 md:flex-none" onClick={() => setPopup({ kind: 'transfer' })} disabled={!summary}>
            <ArrowLeftRight size={16} /> Transfer
          </button>
          <button className="btn-primary flex-1 md:flex-none" onClick={() => setPopup({ kind: 'account' })}>
            <Plus size={18} /> Add Account
          </button>
        </div>
      </div>

      {error ? (
        <section className="panel"><EmptyState icon={Wallet} title="Could not load accounts" hint={error} /></section>
      ) : !summary ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:gap-4">
            <StatCard icon={Wallet} label="Total Balance" hint={`Across ${accounts.length} account${accounts.length === 1 ? '' : 's'}`} value={fmt(summary.totalBalance)} tone="blue" />
            <StatCard icon={Banknote} label="Cash in Hand" hint="All cash books" value={fmt(summary.cashBalance)} tone="emerald" />
            <StatCard icon={Landmark} label="In Bank" hint="All bank accounts" value={fmt(summary.bankBalance)} tone="indigo" />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-bold text-slate-900">Accounts</h2>
              <p className="text-xs text-slate-500">Balance = opening balance + money in − money out. Open a ledger to see every entry.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr>
                    <th className="table-header">Account</th>
                    <th className="table-header text-right">Opening</th>
                    <th className="table-header text-right">Money In</th>
                    <th className="table-header text-right">Money Out</th>
                    <th className="table-header text-right">Balance</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => {
                    const Icon = a.type === 'cash' ? Banknote : Landmark;
                    return (
                      <tr key={a._id} className="table-row cursor-pointer" onClick={() => navigate(`/accounts/${a._id}`)}>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${a.type === 'cash' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-indigo-50 text-indigo-700 ring-indigo-100'}`}>
                              <Icon size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                                {a.name}
                                {a.isDefault && <span className="badge-gray" title="Money pickers start on this account">Default</span>}
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className={a.type === 'cash' ? 'badge-green' : 'badge-blue'}>{a.type === 'cash' ? 'Cash' : 'Bank'}</span>
                                <span className="truncate">{a.entryCount} entr{a.entryCount === 1 ? 'y' : 'ies'}{a.notes ? ` · ${a.notes}` : ''}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap text-right">{fmt(a.openingBalance)}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-emerald-700">{fmt(a.moneyIn)}</td>
                        <td className="table-cell whitespace-nowrap text-right font-semibold text-rose-600">{fmt(a.moneyOut)}</td>
                        <td className={`table-cell whitespace-nowrap text-right text-base font-bold ${a.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{fmt(a.balance)}</td>
                        <td className="table-cell" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/accounts/${a._id}`} className="btn-secondary btn-sm mr-1 whitespace-nowrap">
                              <BookOpen size={14} /> Ledger
                            </Link>
                            {!a.isDefault && (
                              <button className="icon-btn hover:bg-amber-50 hover:text-amber-600" title="Make default" onClick={() => makeDefault(a)}>
                                <Star size={16} />
                              </button>
                            )}
                            <button className="icon-btn hover:bg-blue-50 hover:text-blue-600" title="Edit" onClick={() => setPopup({ kind: 'account', account: a })}>
                              <Pencil size={16} />
                            </button>
                            <button className="icon-btn hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => deleteAccount(a)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50">
                    <td className="table-cell font-bold text-slate-900" colSpan={4}>Total</td>
                    <td className="table-cell whitespace-nowrap text-right text-base font-bold text-slate-900">{fmt(summary.totalBalance)}</td>
                    <td className="table-cell" />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {popup?.kind === 'account' && (
        <AccountFormModal account={popup.account} onSave={saveAccount} onClose={() => setPopup(null)} />
      )}
      {popup?.kind === 'transfer' && (
        <TransferModal accounts={accounts} onSave={saveTransfer} onClose={() => setPopup(null)} />
      )}
    </div>
  );
}
