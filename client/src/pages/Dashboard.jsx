import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, getMySpaces } from '../api/client';

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-[#008A05] border border-green-200',
  cancelled: 'bg-red-50 text-[#C13515] border border-red-200',
  completed: 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]',
};

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { to: '/browse', icon: <SearchIcon />, title: 'Find Parking', desc: 'Browse available spaces near you.' },
  { to: '/my-bookings', icon: <CalendarIcon />, title: 'My Bookings', desc: 'View and manage your reservations.' },
  { to: '/list-space', icon: <PlusIcon />, title: 'List a Space', desc: 'Start earning from your parking spot.' },
  { to: '/hosted-bookings', icon: <HomeIcon />, title: 'Manage Listings', desc: 'See bookings on your hosted spaces.' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getMyBookings(), getMySpaces()])
      .then(([bRes, sRes]) => {
        if (bRes.status === 'fulfilled') setBookings(bRes.value.data.bookings || []);
        if (sRes.status === 'fulfilled') setSpaces(sRes.value.data.spaces || []);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const avgRating =
    spaces.length > 0 && spaces.some((s) => s.avgRating)
      ? (spaces.reduce((sum, s) => sum + (s.avgRating || 0), 0) / spaces.filter((s) => s.avgRating).length).toFixed(1)
      : null;

  const recentBookings = bookings.slice(0, 3);

  const STATUS_STYLES_BADGE = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-green-50 text-[#008A05]',
    cancelled: 'bg-red-50 text-[#C13515]',
    completed: 'bg-[#F7F7F7] text-[#717171]',
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222222]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[#717171] mt-1">Here is what is happening with your account.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-[#DDDDDD] p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-[#222222]">
              {statsLoading ? '—' : bookings.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#DDDDDD] p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1">Spaces Listed</p>
            <p className="text-3xl font-bold text-[#222222]">
              {statsLoading ? '—' : spaces.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#DDDDDD] p-5 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1">Avg Rating</p>
            <p className="text-3xl font-bold text-[#222222]">
              {statsLoading ? '—' : avgRating ? avgRating : 'N/A'}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <h2 className="text-lg font-semibold text-[#222222] mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {QUICK_ACTIONS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-5 hover:shadow-md transition-shadow group flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-11 h-11 bg-[#F7F7F7] rounded-xl flex items-center justify-center group-hover:bg-red-50 transition-colors">
                {card.icon}
              </div>
              <div>
                <h3 className="font-semibold text-[#222222] mb-0.5">{card.title}</h3>
                <p className="text-sm text-[#717171]">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        {recentBookings.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#222222]">Recent activity</h2>
              <Link to="/my-bookings" className="text-sm text-brand font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-4 flex items-center gap-4"
                >
                  {/* Space image or placeholder */}
                  <div className="w-12 h-12 rounded-lg bg-[#F7F7F7] flex-shrink-0 overflow-hidden">
                    {b.space?.images?.[0] ? (
                      <img src={b.space.images[0]} alt={b.space.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                          <rect x="2" y="3" width="20" height="18" rx="2" /><path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#222222] truncate">{b.space?.title}</p>
                    <p className="text-xs text-[#717171]">
                      {new Date(b.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {new Date(b.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES_BADGE[b.status]}`}>
                      {b.status}
                    </span>
                    <p className="text-sm font-bold text-[#222222] mt-1">${Number(b.totalPrice).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
