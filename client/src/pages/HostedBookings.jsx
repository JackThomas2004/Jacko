import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StarRating from '../components/StarRating';
import { getHostedBookings, getMySpaces, updateBookingStatus } from '../api/client';

const STATUS_BADGE = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-[#008A05] border border-green-200',
  cancelled: 'bg-red-50 text-[#C13515] border border-red-200',
  completed: 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]',
};

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

function ParkingPlaceholder({ small }) {
  return (
    <div className={`bg-[#F7F7F7] flex items-center justify-center ${small ? 'w-full h-full' : 'w-full h-40'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`text-[#DDDDDD] ${small ? 'w-5 h-5' : 'w-10 h-10'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <rect x="2" y="3" width="20" height="18" rx="2" /><path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
      </svg>
    </div>
  );
}

export default function HostedBookings() {
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);

  async function load() {
    try {
      const [bRes, sRes] = await Promise.allSettled([getHostedBookings(), getMySpaces()]);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.data.bookings || []);
      if (sRes.status === 'fulfilled') setSpaces(sRes.value.data.spaces || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id, status) {
    setActionLoading(id + status);
    try {
      await updateBookingStatus(id, status);
      await load();
    } catch {}
    setActionLoading(null);
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'All') return true;
    return b.status === statusFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Hosting</h1>
            <p className="text-[#717171] text-sm mt-0.5">Manage your spaces and incoming bookings.</p>
          </div>
          <Link
            to="/list-space"
            className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            New listing
          </Link>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl border border-[#DDDDDD] p-1 w-fit">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#222222] text-white'
                : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'listings'
                ? 'bg-[#222222] text-white'
                : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
            }`}
          >
            Listings ({spaces.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
          </div>
        ) : activeTab === 'bookings' ? (
          <>
            {/* Status filter */}
            {bookings.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      statusFilter === s
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'bg-white text-[#717171] border-[#DDDDDD] hover:border-[#717171]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {filteredBookings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#222222] mb-2">No bookings yet</p>
                <p className="text-sm text-[#717171]">Bookings for your spaces will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Space image */}
                      <div className="w-full sm:w-28 h-28 flex-shrink-0">
                        {b.space?.images?.[0] ? (
                          <img src={b.space.images[0]} alt={b.space.title} className="w-full h-full object-cover" />
                        ) : (
                          <ParkingPlaceholder small />
                        )}
                      </div>

                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <Link to={`/spaces/${b.space?.id}`} className="font-semibold text-[#222222] hover:text-brand transition-colors">
                              {b.space?.title}
                            </Link>
                            <p className="text-sm text-[#717171]">
                              Renter: <span className="font-medium text-[#222222]">{b.renter?.name}</span>
                              {b.renter?.email && <span className="text-[#717171]"> ({b.renter.email})</span>}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_BADGE[b.status]}`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                          <div>
                            <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">Start</p>
                            <p className="text-[#222222]">{new Date(b.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">End</p>
                            <p className="text-[#222222]">{new Date(b.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">Payout</p>
                            <p className="font-bold text-[#008A05]">${Number(b.totalPrice).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">Requested</p>
                            <p className="text-[#222222]">{new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>

                        {b.notes && (
                          <p className="text-sm text-[#717171] italic mb-3">
                            Renter note: "{b.notes}"
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatus(b.id, 'confirmed')}
                                disabled={!!actionLoading}
                                className="text-sm bg-[#008A05] hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
                              >
                                {actionLoading === b.id + 'confirmed' ? 'Confirming...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => handleStatus(b.id, 'cancelled')}
                                disabled={!!actionLoading}
                                className="text-sm border border-[#DDDDDD] text-[#C13515] hover:bg-red-50 font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleStatus(b.id, 'completed')}
                                disabled={!!actionLoading}
                                className="text-sm bg-[#222222] hover:bg-[#444444] disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
                              >
                                {actionLoading === b.id + 'completed' ? 'Updating...' : 'Mark complete'}
                              </button>
                              <button
                                onClick={() => handleStatus(b.id, 'cancelled')}
                                disabled={!!actionLoading}
                                className="text-sm border border-[#DDDDDD] text-[#C13515] hover:bg-red-50 font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Listings tab */
          spaces.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <rect x="2" y="3" width="20" height="18" rx="2" /><path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-[#222222] mb-2">No listings yet</p>
              <Link to="/list-space" className="inline-block bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors mt-2">
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spaces.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm overflow-hidden">
                  {/* Cover image */}
                  <div className="h-40 relative">
                    {s.images?.[0] ? (
                      <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <ParkingPlaceholder />
                    )}
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full ${s.isActive ? 'bg-[#008A05]/10 text-[#008A05] border border-[#008A05]/20' : 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-[#222222] mb-0.5 truncate">{s.title}</h3>
                    <p className="text-sm text-[#717171] mb-2">{s.city}, {s.state}</p>

                    <div className="flex items-center gap-3 text-sm text-[#717171] mb-1">
                      {s.pricePerHour && <span className="font-medium text-[#222222]">${s.pricePerHour}/hr</span>}
                      {s.pricePerDay && <span className="font-medium text-[#222222]">${s.pricePerDay}/day</span>}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#717171] mb-4">
                      <span>{s._count?.bookings || 0} booking{(s._count?.bookings || 0) !== 1 ? 's' : ''}</span>
                      {s.avgRating && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#222222]" fill="currentColor" viewBox="0 0 24 24">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span>{Number(s.avgRating).toFixed(1)} ({s.reviewCount})</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/spaces/${s.id}`}
                        className="flex-1 text-center text-sm border border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] py-2 rounded-lg transition-colors font-medium"
                      >
                        View
                      </Link>
                      <Link
                        to={`/spaces/${s.id}/edit`}
                        className="flex-1 text-center text-sm bg-[#222222] hover:bg-[#444444] text-white py-2 rounded-lg transition-colors font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
