import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { resetPassword } from '../api/client';

const INPUT_CLASS = 'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 transition-colors';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'This link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#222222] mb-3">Invalid link</h1>
          <p className="text-[#717171] mb-6">This password reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="text-brand hover:underline text-sm font-medium">Request a new link</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-24">
        <h1 className="text-2xl font-bold text-[#222222] mb-2">Set a new password</h1>
        <p className="text-[#717171] mb-8 text-sm">Choose a strong password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">New password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">Confirm password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat your password"
              className={INPUT_CLASS}
            />
          </div>
          {error && <p className="text-sm text-[#C13515]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
