import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import StarRating from '../components/StarRating';
import Footer from '../components/Footer';
import { getSpace, createBooking, getAvailability } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS = {
  garage: 'Garage',
  driveway: 'Driveway',
  parking_lot: 'Parking Lot',
  carport: 'Carport',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const INPUT_CLASS =
  'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-0 transition-colors';

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 text-[#717171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#717171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ParkingPlaceholder() {
  return (
    <div className="w-full h-full bg-[#F7F7F7] flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.8">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
      </svg>
    </div>
  );
}

function BookingForm({ space, onBooked }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function calcPrice() {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return null;
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours >= 20 && space.pricePerDay) {
      const days = Math.ceil(hours / 24);
      return { subtotal: days * space.pricePerDay, unit: 'days', count: days };
    }
    if (space.pricePerHour) {
      const h = Math.ceil(hours);
      return { subtotal: h * space.pricePerHour, unit: 'hours', count: h };
    }
    const days = Math.ceil(hours / 24);
    return { subtotal: days * space.pricePerDay, unit: 'days', count: days };
  }

  const calc = calcPrice();
  const serviceFee = calc ? calc.subtotal * 0.1 : 0;
  const total = calc ? calc.subtotal + serviceFee : 0;

  async function handleBook(e) {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setError('');
    setLoading(true);
    try {
      const res = await createBooking({ spaceId: space.id, startTime, endTime, notes });
      const { booking, clientSecret } = res.data;
      if (clientSecret && booking?.id) {
        sessionStorage.setItem(`cs_${booking.id}`, clientSecret);
        navigate(`/checkout/${booking.id}`);
      } else {
        navigate('/my-bookings');
      }
      onBooked();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date();
  minDate.setMinutes(0, 0, 0);
  const minStr = minDate.toISOString().slice(0, 16);

  return (
    <>
      <form
        onSubmit={handleBook}
        className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4"
      >
        {/* Price display */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-[#DDDDDD]">
          {space.pricePerHour != null && (
            <div>
              <span className="text-2xl font-bold text-[#222222]">${Number(space.pricePerHour).toFixed(2)}</span>
              <span className="text-[#717171] text-sm"> / hour</span>
            </div>
          )}
          {space.pricePerDay != null && (
            <div>
              <span className="text-2xl font-bold text-[#222222]">${Number(space.pricePerDay).toFixed(2)}</span>
              <span className="text-[#717171] text-sm"> / day</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1.5">Start time</label>
          <input
            type="datetime-local"
            required
            min={minStr}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1.5">End time</label>
          <input
            type="datetime-local"
            required
            min={startTime || minStr}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#222222] mb-1.5">
            Notes <span className="text-[#717171] font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Vehicle info, arrival details..."
            className={INPUT_CLASS + ' resize-none'}
          />
        </div>

        {/* Price breakdown */}
        {calc && (
          <div className="bg-[#F7F7F7] rounded-lg px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-[#222222]">
              <span>{calc.count} {calc.unit}</span>
              <span>${calc.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#222222]">
              <span>Service fee (10%)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#222222] border-t border-[#DDDDDD] pt-2 mt-1">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-[#C13515]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Processing...' : user ? 'Reserve' : 'Sign in to book'}
        </button>

        {!user && (
          <p className="text-xs text-[#717171] text-center">
            You will not be charged yet
          </p>
        )}
      </form>

      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} defaultTab="login" />
      )}
    </>
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState(0);

  async function loadSpace() {
    try {
      const [spaceRes, availRes] = await Promise.allSettled([
        getSpace(id),
        getAvailability(id),
      ]);
      if (spaceRes.status === 'fulfilled') {
        setSpace(spaceRes.value.data.space);
      } else {
        navigate('/browse');
        return;
      }
      if (availRes.status === 'fulfilled') {
        setAvailability(availRes.value.data.schedule || availRes.value.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSpace(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!space) return null;

  const isOwner = user?.id === space.ownerId;
  const images = space.images || [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Back link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-1 text-sm text-[#222222] hover:text-brand mb-6 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </Link>

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-1">{space.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#717171]">
            {space.avgRating != null && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#222222]" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-semibold text-[#222222]">{Number(space.avgRating).toFixed(1)}</span>
                <span>({space.reviewCount} review{space.reviewCount !== 1 ? 's' : ''})</span>
              </div>
            )}
            <span>{space.city}, {space.state}</span>
          </div>
        </div>

        {/* Image gallery */}
        <div className="mb-8">
          {images.length > 0 ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden h-72 sm:h-96 bg-[#F7F7F7]">
                <img
                  src={images[mainImg]}
                  alt={`${space.title} photo ${mainImg + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImg(i)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden h-16 w-24 border-2 transition-colors ${
                        i === mainImg ? 'border-[#222222]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden h-72 sm:h-96">
              <ParkingPlaceholder />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Type + address */}
            <div className="border-b border-[#DDDDDD] pb-8">
              <span className="inline-block bg-[#F7F7F7] text-[#222222] text-sm font-medium px-3 py-1.5 rounded-full mb-3">
                {TYPE_LABELS[space.type] || 'Parking'}
              </span>
              <div className="flex items-start gap-2 text-sm text-[#717171]">
                <LocationIcon />
                <span>{space.address}, {space.city}, {space.state} {space.zipCode}</span>
              </div>
            </div>

            {/* Host info */}
            <div className="border-b border-[#DDDDDD] pb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#F7F7F7] flex items-center justify-center flex-shrink-0">
                <PersonIcon />
              </div>
              <div>
                <p className="font-semibold text-[#222222]">Hosted by {space.owner?.name}</p>
                {space.owner?.bio && (
                  <p className="text-sm text-[#717171] mt-0.5">{space.owner.bio}</p>
                )}
                <p className="text-xs text-[#717171] mt-0.5">
                  Member since {new Date(space.owner?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <div className="border-b border-[#DDDDDD] pb-8">
                <h2 className="text-lg font-semibold text-[#222222] mb-3">About this space</h2>
                <p className="text-[#717171] leading-relaxed text-sm">{space.description}</p>
              </div>
            )}

            {/* Amenities */}
            {space.amenities?.length > 0 && (
              <div className="border-b border-[#DDDDDD] pb-8">
                <h2 className="text-lg font-semibold text-[#222222] mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {space.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-[#222222]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#008A05] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {availability.length > 0 && (
              <div className="border-b border-[#DDDDDD] pb-8">
                <h2 className="text-lg font-semibold text-[#222222] mb-4">Availability</h2>
                <div className="space-y-2">
                  {DAY_NAMES.map((day, i) => {
                    const slot = availability.find((s) => s.dayOfWeek === i);
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-[#222222] font-medium w-16">{day}</span>
                        {slot ? (
                          <span className="text-[#717171]">
                            {slot.startTime} — {slot.endTime}
                          </span>
                        ) : (
                          <span className="text-[#717171]">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#222222]" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <h2 className="text-lg font-semibold text-[#222222]">
                  {space.avgRating != null
                    ? `${Number(space.avgRating).toFixed(1)} · ${space.reviews?.length || 0} review${(space.reviews?.length || 0) !== 1 ? 's' : ''}`
                    : `${space.reviews?.length || 0} review${(space.reviews?.length || 0) !== 1 ? 's' : ''}`}
                </h2>
              </div>

              {!space.reviews?.length ? (
                <p className="text-sm text-[#717171]">No reviews yet. Be the first to review after your stay.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {space.reviews.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center text-xs font-semibold text-[#717171] flex-shrink-0">
                          {r.reviewer?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#222222]">{r.reviewer?.name}</p>
                          <p className="text-xs text-[#717171]">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <StarRating value={r.rating} readonly size="sm" />
                      {r.comment && (
                        <p className="text-sm text-[#717171] mt-1.5 leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - sticky booking form */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28">
              {isOwner ? (
                <div className="bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl p-6 text-center">
                  <p className="font-semibold text-[#222222] mb-1">This is your listing</p>
                  <p className="text-sm text-[#717171] mb-4">Manage pricing, photos, and availability.</p>
                  <Link
                    to={`/spaces/${space.id}/edit`}
                    className="inline-block bg-[#222222] hover:bg-[#444444] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
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
      <Footer />
    </div>
  );
}
