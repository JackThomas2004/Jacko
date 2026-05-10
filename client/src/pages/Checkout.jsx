import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getStripeConfig, getMyBookings } from '../api/client';

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PaymentForm({ booking }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setLoading(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/my-bookings' },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true);
      setTimeout(() => navigate('/my-bookings'), 2500);
    }
    setLoading(false);
  }

  const total = Number(booking.totalPrice);
  const serviceFee = Number(booking.serviceFee ?? 0);
  const subtotal = serviceFee > 0 ? total - serviceFee : total;

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-50 border border-[#008A05]/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#008A05]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#222222] mb-2">Payment successful</h3>
        <p className="text-[#717171] text-sm mb-5">Your booking is confirmed. Redirecting...</p>
        <Link to="/my-bookings" className="text-brand text-sm font-semibold hover:underline">
          View my bookings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-semibold text-[#222222] text-base mb-4">Payment details</h2>
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>

      <p className="text-xs text-[#717171] text-center leading-relaxed">
        Secured by Stripe. ParkSpot never stores your card details.
      </p>
    </form>
  );
}

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const configRes = await getStripeConfig();
        const { publishableKey } = configRes.data;

        if (!publishableKey) {
          navigate('/my-bookings');
          return;
        }
        setStripePromise(loadStripe(publishableKey));

        const bookingsRes = await getMyBookings();
        const found = (bookingsRes.data.bookings || []).find((b) => b.id === bookingId);
        if (!found) { navigate('/my-bookings'); return; }
        if (found.paymentStatus === 'paid') { navigate('/my-bookings'); return; }

        setBooking(found);

        // Look for stored clientSecret (set when booking was created)
        const stored = sessionStorage.getItem(`cs_${bookingId}`);
        if (stored) {
          setClientSecret(stored);
        } else {
          setError('Payment session not found. Please try booking again.');
        }
      } catch {
        setError('Unable to load checkout. Redirecting...');
        setTimeout(() => navigate('/my-bookings'), 2500);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1 text-sm text-[#222222] hover:text-brand mb-6 font-medium"
        >
          <ArrowLeftIcon /> Back to bookings
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-8">Complete your payment</h1>

        {error && (
          <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-xl px-5 py-4 mb-6 text-sm">
            {error}
            <div className="mt-3">
              <Link to="/my-bookings" className="font-semibold underline">Go to my bookings</Link>
            </div>
          </div>
        )}

        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-[#222222] text-base">Booking summary</h2>

              <div className="flex gap-4 pb-4 border-b border-[#DDDDDD]">
                <div className="w-16 h-16 rounded-xl bg-[#F7F7F7] flex-shrink-0 overflow-hidden">
                  {booking.space?.images?.[0] ? (
                    <img src={booking.space.images[0]} alt={booking.space.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <rect x="2" y="3" width="20" height="18" rx="2" /><path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#222222]">{booking.space?.title}</p>
                  <p className="text-sm text-[#717171]">{booking.space?.city}, {booking.space?.state}</p>
                  <p className="text-xs text-[#717171] mt-0.5">Host: {booking.space?.owner?.name}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm pb-4 border-b border-[#DDDDDD]">
                <div className="flex justify-between">
                  <span className="text-[#717171]">Check in</span>
                  <span className="text-[#222222] font-medium">
                    {new Date(booking.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Check out</span>
                  <span className="text-[#222222] font-medium">
                    {new Date(booking.endTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {booking.serviceFee != null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#717171]">Subtotal</span>
                      <span className="text-[#222222]">${(Number(booking.totalPrice) - Number(booking.serviceFee)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#717171]">Service fee</span>
                      <span className="text-[#222222]">${Number(booking.serviceFee).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-[#222222] text-base pt-2 border-t border-[#DDDDDD]">
                  <span>Total</span>
                  <span>${Number(booking.totalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6">
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <PaymentForm booking={booking} />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[#717171] mb-4">Payment unavailable. Your booking has been requested.</p>
                  <Link to="/my-bookings" className="inline-block bg-brand text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-brand-dark transition-colors">
                    View my bookings
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
