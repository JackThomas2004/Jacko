import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import { getStripeConfig, getMyBookings } from '../api/client';
import api from '../api/client';

const INPUT_CLASS = 'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-0 transition-colors';

function PaymentForm({ booking, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setLoading(true);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/my-bookings' },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    navigate('/my-bookings');
  }

  const space = booking.space;
  const subtotal = booking.totalPrice;
  const serviceFee = booking.serviceFee;
  const total = subtotal + serviceFee;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking summary */}
      <div className="bg-[#F7F7F7] rounded-xl p-5">
        <h2 className="font-semibold text-[#222222] mb-3">Booking summary</h2>
        <p className="font-medium text-[#222222]">{space?.title}</p>
        <p className="text-sm text-[#717171] mb-4">
          {space?.city}, {space?.state}
        </p>
        <div className="border-t border-[#DDDDDD] pt-3 space-y-2">
          <div className="flex justify-between text-sm text-[#222222]">
            <span>{new Date(booking.startTime).toLocaleString()} →</span>
          </div>
          <div className="flex justify-between text-sm text-[#222222]">
            <span>{new Date(booking.endTime).toLocaleString()}</span>
          </div>
        </div>
        <div className="border-t border-[#DDDDDD] mt-3 pt-3 space-y-2">
          <div className="flex justify-between text-sm text-[#222222]">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#222222]">
            <span>Service fee</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#222222] border-t border-[#DDDDDD] pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Stripe payment element */}
      <div>
        <h2 className="font-semibold text-[#222222] mb-4">Payment details</h2>
        <PaymentElement />
      </div>

      {error && <p className="text-sm text-[#C13515]">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>

      <p className="text-xs text-[#717171] text-center">
        Your payment is processed securely by Stripe. ParkSpot never stores your card details.
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
        // Load stripe key
        const configRes = await getStripeConfig();
        const { publishableKey } = configRes.data;
        if (!publishableKey) {
          navigate('/my-bookings');
          return;
        }
        setStripePromise(loadStripe(publishableKey));

        // Get booking details + client secret
        const bookingsRes = await getMyBookings();
        const found = bookingsRes.data.bookings.find((b) => b.id === bookingId);
        if (!found) { navigate('/my-bookings'); return; }
        if (found.paymentStatus === 'paid') { navigate('/my-bookings'); return; }

        setBooking(found);

        // Get client secret from booking's payment intent
        const intentRes = await api.get(`/payments/intent/${bookingId}`);
        setClientSecret(intentRes.data.clientSecret);
      } catch {
        setError('Unable to load checkout. Redirecting...');
        setTimeout(() => navigate('/my-bookings'), 2000);
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

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#C13515] text-sm">{error}</p>
      </div>
    );
  }

  if (!booking || !clientSecret || !stripePromise) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-[#222222] mb-8">Complete your booking</h1>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <PaymentForm booking={booking} onSuccess={() => navigate('/my-bookings')} />
        </Elements>
      </div>
    </div>
  );
}
