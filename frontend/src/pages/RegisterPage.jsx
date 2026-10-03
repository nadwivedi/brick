import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', mobile: '', password: '', orgName: '', orgAddress: '', gstin: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_45%,_#ffffff_100%)] p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center">
          <Logo size="lg" subtitle="Brick Manufacturing Management" />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-5 py-4 text-white md:px-6">
            <h2 className="text-lg font-bold">Register Organization</h2>
            <p className="text-xs text-primary-100 md:text-sm">Create your organization account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</div>
            )}

            <div className="mb-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">1</span>
                Your Details
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                <div>
                  <label className="label">Your Name</label>
                  <input className="input" placeholder="Full name" value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input className="input" placeholder="Mobile" type="tel" value={form.mobile} onChange={set('mobile')} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Password</label>
                  <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 md:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">2</span>
                Organization Details
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="label">Organization / Company Name</label>
                  <input className="input" placeholder="e.g. Sharma Brick Industries" value={form.orgName} onChange={set('orgName')} required />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" placeholder="Address" value={form.orgAddress} onChange={set('orgAddress')} />
                </div>
                <div>
                  <label className="label">GSTIN (Optional)</label>
                  <input className="input" placeholder="GSTIN" value={form.gstin} onChange={set('gstin')} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
