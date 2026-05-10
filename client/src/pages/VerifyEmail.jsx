import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { verifyEmail } from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#222222] mb-3">Email verified</h1>
            <p className="text-[#717171] mb-8">Your email has been confirmed. You can now sign in to your account.</p>
            <Link to="/" className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm inline-block">
              Sign in
            </Link>
          </>
        )}

        {(status === 'error' || status === 'invalid') && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#222222] mb-3">Verification failed</h1>
            <p className="text-[#717171] mb-8">This link is invalid or has expired. Please request a new verification email from your account.</p>
            <Link to="/" className="text-brand hover:underline text-sm font-medium">
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
