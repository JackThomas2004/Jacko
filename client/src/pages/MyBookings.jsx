import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyBookings, updateBookingStatus, createReview } from '../api/client';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
};

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
      setError(err.response?.data?.error || 'Failed to submit review');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-xl text-slate-800 mb-1">Leave a Review</h2>
        <p className="text-slate-500 text-sm mb-6">{booking.space.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`text-3xl transition-transform hover:scale-110 ${n <= rating ? 'text-amber-400' : 'text-slate-200'}`}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment (optional)</label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-600 font-medium py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);

  async function load() {
    try {
      const res = await getMyBookings();
      setBookings(res.data.bookings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await updateBookingStatus(id, 'cancelled');
      load();
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">My Bookings</h1>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">No bookings yet</p>
            <Link to="/browse" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Browse spaces →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Link to={`/spaces/${b.space.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                      {b.space.title}
                    </Link>
                    <p className="text-slate-500 text-sm">{b.space.city}, {b.space.state}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Start</span>
                    <p>{new Date(b.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide">End</span>
                    <p>{new Date(b.endTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Total</span>
                    <p className="font-semibold text-blue-600">${b.totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Hosted by</span>
                    <p>{b.space.owner.name}</p>
                  </div>
                </div>

                {b.notes && <p className="text-slate-500 text-sm italic mb-3">"{b.notes}"</p>}

                <div className="flex gap-2">
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button onClick={() => handleCancel(b.id)}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                  {b.status === 'completed' && !b.review && (
                    <button onClick={() => setReviewBooking(b)}
                      className="text-sm bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      Leave Review ★
                    </button>
                  )}
                  {b.review && (
                    <span className="text-sm text-slate-400">You rated this {'★'.repeat(b.review.rating)}</span>
                  )}
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
    </div>
  );
}
