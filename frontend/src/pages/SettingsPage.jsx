import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'organization', label: 'Organization', icon: Building2 },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-4 fade-in md:space-y-5">
      {/* Profile hero */}
      <div className="card flex items-center gap-4 md:gap-5 md:px-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 text-2xl font-bold text-white shadow-lg shadow-primary-700/20 md:h-16 md:w-16">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900">{user?.name || 'Settings'}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 md:text-sm">
            {user?.mobile && <span>{user.mobile}</span>}
            {user?.role && <span className="badge-green capitalize">{user.role}</span>}
            {user?.organization?.name && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-primary-700">{user.organization.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-5 lg:flex-row">
        {/* Tab Nav */}
        <div className="flex-shrink-0 lg:w-60">
          <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 lg:flex-col">
            {tabs.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all duration-200 ${
                    active ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-primary-600'
                  }`}>
                    <Icon size={18} />
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeTab === 'profile' && (
            <div className="card space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Profile</h2>
                <p className="text-xs text-slate-500">Your personal account details</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" defaultValue={user?.name} />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input className="input" defaultValue={user?.mobile} disabled />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input className="input capitalize" defaultValue={user?.role} disabled />
                </div>
              </div>
              <div className="pt-2">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="card space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Organization Details</h2>
                <p className="text-xs text-slate-500">Shown on your invoices and reports</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                <div>
                  <label className="label">Organization Name</label>
                  <input className="input" defaultValue={user?.organization?.name} />
                </div>
                <div>
                  <label className="label">Mobile</label>
                  <input className="input" defaultValue={user?.organization?.mobile} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <textarea className="input" rows={2} defaultValue={user?.organization?.address} />
                </div>
                <div>
                  <label className="label">GSTIN</label>
                  <input className="input" defaultValue={user?.organization?.gstin} />
                </div>
              </div>
              <div className="pt-2">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="mb-2">
                <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
                <p className="text-xs text-slate-500">Choose which alerts you want to receive</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Low Stock Alerts', desc: 'Get notified when materials fall below threshold' },
                  { label: 'Overdue Payment Reminders', desc: 'Alert when customers have overdue invoices' },
                  { label: 'Daily Production Summary', desc: 'Receive daily production summary' },
                  { label: 'New Invoice Notifications', desc: 'Notify when a new invoice is created' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="peer h-5 w-10 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-5 peer-checked:after:border-white peer-focus:outline-none"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500">Use at least 6 characters</p>
              </div>
              <div className="max-w-sm space-y-3 md:space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" />
                </div>
                <button className="btn-primary">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
