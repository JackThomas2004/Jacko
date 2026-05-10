import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';

const FEATURES = [
  { icon: '🏠', title: 'List Your Space', desc: 'Turn your unused garage, driveway, or parking spot into passive income. Set your own hours and price.' },
  { icon: '🔍', title: 'Find Parking', desc: 'Browse nearby spaces, filter by type and price, and book in seconds — no app download required.' },
  { icon: '💳', title: 'Easy Payments', desc: 'Secure checkout with instant confirmation. Hosts get paid after each completed booking.' },
  { icon: '⭐', title: 'Trusted Reviews', desc: 'Both hosts and renters can leave reviews so everyone stays accountable and the community stays safe.' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Create an account', desc: 'Sign up for free in under a minute.' },
  { step: '2', title: 'List or search', desc: 'Post your space in minutes, or search by city for available spots.' },
  { step: '3', title: 'Book & pay', desc: 'Pick your dates, confirm, and pay securely online.' },
  { step: '4', title: 'Park & earn', desc: 'Renters get directions, hosts get paid. Simple.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [searchCity, setSearchCity] = useState('');

  function openAuth(tab) {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/browse${searchCity ? `?city=${encodeURIComponent(searchCity)}` : ''}`);
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Rent Out Your Parking Space.<br />Find Parking Near You.
          </h1>
          <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
            ParkSpot connects homeowners with spare parking to drivers who need a spot — by the hour or by the day.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-6">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search by city (e.g. Austin)…"
              className="flex-1 px-4 py-3 rounded-xl text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex gap-3 justify-center flex-wrap">
            {user ? (
              <>
                <Link to="/browse" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  Find Parking
                </Link>
                <Link to="/list-space" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  List My Space
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => openAuth('register')} className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  Get Started — It's Free
                </button>
                <button onClick={() => openAuth('login')} className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Why ParkSpot?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((h) => (
              <div key={h.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {h.step}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{h.title}</h3>
                <p className="text-slate-500 text-sm">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-blue-100 mb-8 text-lg">Join thousands of hosts and renters already using ParkSpot.</p>
        {user ? (
          <div className="flex gap-4 justify-center">
            <Link to="/browse" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Find Parking
            </Link>
            <Link to="/list-space" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              List a Space
            </Link>
          </div>
        ) : (
          <button
            onClick={() => openAuth('register')}
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Create Free Account
          </button>
        )}
      </section>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        © {new Date().getFullYear()} ParkSpot. All rights reserved.
      </footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} defaultTab={authTab} />}
    </div>
  );
}
