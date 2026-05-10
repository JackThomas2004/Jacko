import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getHostedBookings, getMySpaces, updateBookingStatus } from '../api/client';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
};

export default function HostedBookings() {
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bookings');

  async function load() {
    try {
      const [bRes, sRes] = await Promise.all([getHostedBookings(), getMySpaces()]);
      setBookings(bRes.data.bookings);
      setSpaces(sRes.data.spaces);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id, status) {
    try {
      await updateBookingStatus(id, status);
      load();
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Hosting</h1>
          <Link to="/list-space" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            + New Listing
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('bookings')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            Bookings ({bookings.length})
          </button>
          <button onClick={() => setTab('listings')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'listings' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            My Listings ({spaces.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>
        ) : tab === 'bookings' ? (
          bookings.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium">No bookings yet</p>
              <p className="text-sm mt-1">Bookings for your spaces will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <Link to={`/spaces/${b.space.id}`} className="font-semibold text-slate-800 hover:text-blue-600">
                        {b.space.title}
                      </Link>
                      <p className="text-slate-500 text-sm">Renter: <span className="font-medium">{b.renter.name}</span> ({b.renter.email})</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600 mb-4">
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide block">Start</span>
                      {new Date(b.startTime).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide block">End</span>
                      {new Date(b.endTime).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide block">Earned</span>
                      <span className="font-semibold text-green-600">${b.totalPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wide block">Requested</span>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {b.notes && <p className="text-slate-500 text-sm italic mb-3">Renter note: "{b.notes}"</p>}

                  <div className="flex gap-2 flex-wrap">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatus(b.id, 'confirmed')}
                          className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => handleStatus(b.id, 'cancelled')}
                          className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors">
                          Decline
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <>
                        <button onClick={() => handleStatus(b.id, 'completed')}
                          className="text-sm bg-slate-600 hover:bg-slate-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors">
                          Mark Complete
                        </button>
                        <button onClick={() => handleStatus(b.id, 'cancelled')}
                          className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          spaces.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4">🏠</div>
              <p className="text-lg font-medium">No listings yet</p>
              <Link to="/list-space" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Create your first listing →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spaces.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-1">{s.city}, {s.state}</p>
                  <div className="flex gap-2 text-sm text-slate-600 mb-3">
                    {s.pricePerHour && <span>${s.pricePerHour}/hr</span>}
                    {s.pricePerDay && <span>${s.pricePerDay}/day</span>}
                  </div>
                  <div className="flex gap-2 text-sm text-slate-500 mb-4">
                    <span>{s._count?.bookings || 0} bookings</span>
                    {s.avgRating && <span>· ★ {s.avgRating} ({s.reviewCount})</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/spaces/${s.id}`}
                      className="flex-1 text-center text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                      View
                    </Link>
                    <Link to={`/spaces/${s.id}/edit`}
                      className="flex-1 text-center text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
