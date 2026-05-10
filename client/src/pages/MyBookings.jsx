import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StarRating from '../components/StarRating';
import { getMyBookings, updateBookingStatus, createReview } from '../api/client';

const STATUS_BADGE = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-[#008A05] border border-green-200',
  cancelled: 'bg-red-50 text-[#C13515] border border-red-200',
  completed: 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function ReviewModal({ booking, onClose, onReviewed }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createReview({ bookingId: booking.id, rating, comment });
      onReviewed();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-xl text-[#222222] mb-1">Leave a review</h2>
        <p className="text-[#717171] text-sm mb-6">{booking.space?.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">Your rating</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">
              Comment <span className="text-[#717171] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
              className="w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 resize-none"
            />
          </div>

          {error && <p className="text-sm text-[#C13515]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#DDDDDD] text-[#222222] font-semibold py-2.5 rounded-lg hover:bg-[#F7F7F7] text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ParkingPlaceholder() {
  return (
    <div className="w-full h-full bg-[#F7F7F7] flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <rect x="2" y="3" width="20" height="18" rx="2" /><path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
      </svg>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewBooking, setReviewBooking] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  async function load() {
    try {
      const res = await getMyBookings();
      setBookings(res.data.bookings || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await updateBookingStatus(id, 'cancelled');
      await load();
    } catch {}
    setCancelling(null);
  }

  const filtered = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-8">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl border border-[#DDDDDD] p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#222222] text-white'
                  : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#222222] mb-2">No bookings found</p>
            <p className="text-sm text-[#717171] mb-6">
              {activeTab === 'all'
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings.`}
            </p>
            <Link
              to="/browse"
              className="inline-block bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Browse spaces
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Space image */}
                  <div className="w-full sm:w-32 h-32 flex-shrink-0">
                    {b.space?.images?.[0] ? (
                      <img
                        src={b.space.images[0]}
                        alt={b.space.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ParkingPlaceholder />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <Link
                          to={`/spaces/${b.space?.id}`}
                          className="font-semibold text-[#222222] hover:text-brand transition-colors"
                        >
                          {b.space?.title}
                        </Link>
                        <p className="text-sm text-[#717171]">{b.space?.city}, {b.space?.state}</p>
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
                        <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">Total</p>
                        <p className="font-bold text-[#222222]">${Number(b.totalPrice).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#717171] uppercase tracking-wide font-semibold mb-0.5">Host</p>
                        <p className="text-[#222222]">{b.space?.owner?.name}</p>
                      </div>
                    </div>

                    {b.notes && (
                      <p className="text-sm text-[#717171] italic mb-3">
                        Note: "{b.notes}"
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          className="text-sm border border-[#DDDDDD] text-[#C13515] hover:bg-red-50 hover:border-[#C13515]/30 font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cancelling === b.id ? 'Cancelling...' : 'Cancel booking'}
                        </button>
                      )}

                      {b.status === 'completed' && !b.review && (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="text-sm bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222] hover:bg-white font-medium px-4 py-1.5 rounded-lg transition-colors"
                        >
                          Write a review
                        </button>
                      )}

                      {b.review && (
                        <div className="flex items-center gap-2">
                          <StarRating value={b.review.rating} readonly size="sm" />
                          <span className="text-xs text-[#717171]">Your review</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewed={load}
        />
      )}

      <Footer />
    </div>
  );
}
