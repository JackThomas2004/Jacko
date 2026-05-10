import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { forgotPassword } from '../api/client';

const INPUT_CLASS = 'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 transition-colors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {}
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-24">
        {submitted ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#222222] mb-3">Check your email</h1>
            <p className="text-[#717171] mb-8">
              If an account exists for <strong>{email}</strong>, we have sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link to="/" className="text-brand hover:underline text-sm font-medium">Back to home</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#222222] mb-2">Reset your password</h1>
            <p className="text-[#717171] mb-8 text-sm">Enter your email address and we will send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASS}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-[#717171]">
                Remember your password?{' '}
                <Link to="/" className="text-brand font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
