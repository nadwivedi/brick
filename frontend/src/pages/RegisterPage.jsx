import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { AuthField, authButtonCls, authLinkCls } from '../components/AuthLayout';
import { Building2, ChevronDown, Eye, EyeOff, FileText, Loader2, Lock, MapPin, Smartphone, User } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', mobile: '', password: '', orgName: '', orgAddress: '', gstin: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showMore, setShowMore] = useState(false);
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
    <AuthLayout
      title="Create your account"
      subtitle="Set up your brick plant on BrickSoft in a minute."
      error={error}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <AuthField icon={Building2} placeholder="Business Name (e.g. Sharma Brick Industries)" value={form.orgName} onChange={set('orgName')} disabled={loading} required />
          <AuthField icon={User} placeholder="Your Name" value={form.name} onChange={set('name')} disabled={loading} required />
          <AuthField icon={Smartphone} type="tel" placeholder="Mobile Number" value={form.mobile} onChange={set('mobile')} disabled={loading} required />
          <AuthField
            icon={Lock}
            type={showPwd ? 'text' : 'password'}
            className="pr-11"
            placeholder="Password (min. 6 characters)"
            value={form.password}
            onChange={set('password')}
            disabled={loading}
            required
            minLength={6}
          >
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPwd ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </AuthField>

          {showMore ? (
            <>
              <AuthField icon={MapPin} placeholder="Address (optional)" value={form.orgAddress} onChange={set('orgAddress')} disabled={loading} />
              <AuthField icon={FileText} placeholder="GSTIN (optional)" value={form.gstin} onChange={set('gstin')} disabled={loading} />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              <ChevronDown size={16} />
              Add address & GSTIN (optional)
            </button>
          )}
        </div>

        <button type="submit" disabled={loading} className={`${authButtonCls} mt-6`}>
          {loading && <Loader2 size={20} className="animate-spin" />}
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className={authLinkCls}>Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
