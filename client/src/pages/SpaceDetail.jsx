import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { getSpace, createBooking, createReview } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS = { garage: 'Garage', driveway: 'Driveway', parking_lot: 'Parking Lot', carport: 'Carport' };

function Stars({ rating, interactive = false, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange(n)}
          className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${n <= rating ? 'text-amber-400' : 'text-slate-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function BookingForm({ space, onBooked }) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function calcPrice() {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return null;
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours >= 20 && space.pricePerDay) {
      return { amount: Math.ceil(hours / 24) * space.pricePerDay, unit: 'days', count: Math.ceil(hours / 24) };
    }
    if (space.pricePerHour) {
      return { amount: Math.ceil(hours) * space.pricePerHour, unit: 'hours', count: Math.ceil(hours) };
    }
    return { amount: Math.ceil(hours / 24) * space.pricePerDay, unit: 'days', count: Math.ceil(hours / 24) };
  }

  const priceCalc = calcPrice();

  async function handleBook(e) {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setError('');
    setLoading(true);
    try {
      await createBooking({ spaceId: space.id, startTime, endTime, notes });
      setSuccess(true);
      onBooked();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date();
  minDate.setMinutes(0, 0, 0);
  const minStr = minDate.toISOString().slice(0, 16);

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-green-800 text-lg mb-1">Booking Requested!</h3>
        <p className="text-green-700 text-sm mb-4">The host will confirm your booking shortly. Check your bookings for updates.</p>
        <Link to="/my-bookings" className="text-blue-600 font-semibold text-sm hover:underline">
          View My Bookings →
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleBook} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex gap-3 text-sm text-slate-600 mb-2">
          {space.pricePerHour && (
            <span className="font-bold text-blue-600 text-2xl">${space.pricePerHour}<span className="font-normal text-slate-500 text-sm">/hr</span></span>
          )}
          {space.pricePerDay && (
            <span className="font-bold text-blue-600 text-2xl">${space.pricePerDay}<span className="font-normal text-slate-500 text-sm">/day</span></span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
          <input
            type="datetime-local"
            required
            min={minStr}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            required
            min={startTime || minStr}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Vehicle info, arrival details…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {priceCalc && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{priceCalc.count} {priceCalc.unit}</span>
              <span className="font-bold text-blue-700">${priceCalc.amount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Booking…' : user ? 'Request Booking' : 'Sign In to Book'}
        </button>
      </form>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} defaultTab="login" />}
    </>
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  async function loadSpace() {
    try {
      const res = await getSpace(id);
      setSpace(res.data.space);
    } catch {
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSpace(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!space) return null;

  const isOwner = user?.id === space.ownerId;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/browse" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to search</Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="bg-gradient-to-br from-blue-50 to-slate-200 rounded-2xl h-64 flex items-center justify-center text-8xl">
              {space.type === 'garage' ? '🏠' : space.type === 'driveway' ? '🛤️' : space.type === 'carport' ? '⛺' : '🅿️'}
            </div>

            {/* Title / meta */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">{space.title}</h1>
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full whitespace-nowrap">
                  {TYPE_LABELS[space.type]}
                </span>
              </div>
              <p className="text-slate-500 mt-1">📍 {space.address}, {space.city}, {space.state} {space.zipCode}</p>

              {space.avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <Stars rating={space.avgRating} />
                  <span className="text-slate-500 text-sm">{space.avgRating} ({space.reviewCount} review{space.reviewCount !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>

            {/* Description */}
            {space.description && (
              <div>
                <h2 className="font-semibold text-slate-700 mb-2">About this space</h2>
                <p className="text-slate-600 leading-relaxed">{space.description}</p>
              </div>
            )}

            {/* Amenities */}
            {space.amenities?.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-700 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {space.amenities.map((a) => (
                    <span key={a} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">✓ {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Host info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-700 mb-3">Hosted by {space.owner.name}</h2>
              {space.owner.bio && <p className="text-slate-500 text-sm">{space.owner.bio}</p>}
              <p className="text-slate-400 text-xs mt-2">Member since {new Date(space.owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="font-semibold text-slate-700 mb-4">Reviews ({space.reviews?.length || 0})</h2>
              {space.reviews?.length === 0 ? (
                <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {space.reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700 text-sm">{r.reviewer.name}</span>
                        <Stars rating={r.rating} />
                      </div>
                      {r.comment && <p className="text-slate-600 text-sm">{r.comment}</p>}
                      <p className="text-slate-400 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {isOwner ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                <p className="text-amber-700 font-medium mb-3">This is your listing</p>
                <Link
                  to={`/spaces/${space.id}/edit`}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Edit Listing
                </Link>
              </div>
            ) : (
              <BookingForm space={space} onBooked={loadSpace} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
