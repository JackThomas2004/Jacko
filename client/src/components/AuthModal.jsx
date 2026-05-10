import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const INPUT_CLASS = 'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-[#222222] mb-1.5';

export default function AuthModal({ onClose, defaultTab = 'login' }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(registerForm.name, registerForm.email, registerForm.password, registerForm.phone);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) {
    setTab(t);
    setError('');
    setShowPassword(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDDD]">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
            aria-label="Close"
          >
            <XIcon />
          </button>
          <h2 className="font-semibold text-[#222222] text-sm">
            {tab === 'login' ? 'Log in' : 'Sign up'}
          </h2>
          <div className="w-7" />
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border border-[#DDDDDD] rounded-xl overflow-hidden mb-6">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'login'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
              }`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'register'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
              }`}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Email address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={INPUT_CLASS + ' pr-11'}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { onClose(); }}
                  className="text-sm text-[#222222] underline hover:text-brand transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Full name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Email address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Phone number <span className="text-[#717171] font-normal">(optional)</span></label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="555-0100"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className={INPUT_CLASS + ' pr-11'}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#222222]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Creating account...' : 'Agree and continue'}
              </button>

              <p className="text-xs text-[#717171] text-center leading-relaxed">
                By signing up, you agree to our{' '}
                <span className="underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="underline cursor-pointer">Privacy Policy</span>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
