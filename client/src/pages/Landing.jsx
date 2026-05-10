import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Find a space',
    desc: 'Search by city to discover garages, driveways, and parking lots near you.',
  },
  {
    step: '2',
    title: 'Book instantly',
    desc: 'Pick your dates and times. Secure checkout in seconds — no waiting for approval.',
  },
  {
    step: '3',
    title: 'Park with confidence',
    desc: 'Get directions, park stress-free, and leave a review when you are done.',
  },
];

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}

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
      <section className="relative bg-[#222222] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#111111] opacity-90"
          aria-hidden="true"
        />
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, #FF385C 0%, transparent 50%), radial-gradient(circle at 75% 75%, #FF385C 0%, transparent 50%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Find parking that<br />
            <span className="text-brand">works for you.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book driveways, garages, and parking lots from real people in your city — by the hour or by the day.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex max-w-xl mx-auto bg-white rounded-full shadow-lg overflow-hidden mb-8"
          >
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search by city — e.g. Austin, TX"
              className="flex-1 px-6 py-4 text-[#222222] text-sm placeholder-[#717171] focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-brand hover:bg-brand-dark text-white px-6 py-4 font-semibold flex items-center gap-2 flex-shrink-0 transition-colors text-sm"
            >
              <SearchIcon />
              Search
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <>
                <Link
                  to="/browse"
                  className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
                >
                  Browse Spaces
                </Link>
                <Link
                  to="/list-space"
                  className="border border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full transition-colors text-sm"
                >
                  List My Space
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuth('register')}
                  className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
                >
                  Get started — it is free
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="border border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full transition-colors text-sm"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#222222] text-center mb-4">
            How it works
          </h2>
          <p className="text-[#717171] text-center mb-12 max-w-xl mx-auto">
            Park smarter in three simple steps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#222222] text-lg mb-2">{item.title}</h3>
                <p className="text-[#717171] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#DDDDDD] max-w-5xl mx-auto" />

      {/* Become a host CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#222222] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Have a parking space sitting empty?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            List your driveway, garage, or lot on ParkSpot and start earning. Set your own schedule and pricing. It takes less than 5 minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <Link
                to="/list-space"
                className="bg-white text-[#222222] hover:bg-[#F7F7F7] font-bold px-10 py-4 rounded-full transition-colors text-sm"
              >
                List my space
              </Link>
            ) : (
              <>
                <button
                  onClick={() => openAuth('register')}
                  className="bg-white text-[#222222] hover:bg-[#F7F7F7] font-bold px-10 py-4 rounded-full transition-colors text-sm"
                >
                  Become a host
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-colors text-sm"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} defaultTab={authTab} />
      )}
    </div>
  );
}
