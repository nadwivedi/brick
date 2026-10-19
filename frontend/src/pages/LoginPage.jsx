import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { AuthField, authButtonCls, authLinkCls } from '../components/AuthLayout';
import { Eye, EyeOff, Loader2, Lock, LogIn, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.mobile, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    }
  };

  return (
    <AuthLayout
      title="Login to BrickSoft"
      subtitle="Welcome back 👋 Sign in to manage your plant."
      error={error}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <AuthField
            icon={Smartphone}
            type="tel"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            disabled={loading}
            required
          />
          <AuthField
            icon={Lock}
            type={showPwd ? 'text' : 'password'}
            className="pr-11"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            required
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
        </div>

        <button type="submit" disabled={loading} className={`${authButtonCls} mt-5`}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-10 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className={authLinkCls}>Register Now</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
