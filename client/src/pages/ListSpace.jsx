import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUploader from '../components/ImageUploader';
import AvailabilityEditor from '../components/AvailabilityEditor';
import { createSpace, setAvailability } from '../api/client';

const AMENITY_OPTIONS = [
  'Covered', 'EV Charger', 'Security Camera', 'Well Lit', '24/7 Access',
  'Gated', 'Wide Access', 'Shaded', 'Near Transit',
];

const VEHICLE_SIZES = [
  { value: 'compact', label: 'Compact' },
  { value: 'mid-size', label: 'Mid-size' },
  { value: 'full-size', label: 'Full-size' },
  { value: 'suv', label: 'SUV / Truck' },
  { value: 'any', label: 'Any vehicle' },
];

const INPUT_CLASS =
  'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 bg-white transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-[#222222] mb-1.5';

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const STEPS = [
  { num: 1, label: 'Space Details' },
  { num: 2, label: 'Location & Pricing' },
  { num: 3, label: 'Photos & Availability' },
];

export default function ListSpace() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'garage',
    maxVehicleSize: 'any',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    pricePerHour: '',
    pricePerDay: '',
    amenities: [],
    instantBook: false,
    images: [],
    schedule: [],
  });

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleAmenity(a) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }

  function validateStep() {
    if (step === 1) {
      if (!form.title.trim()) return 'Please enter a title.';
      if (!form.type) return 'Please select a space type.';
    }
    if (step === 2) {
      if (!form.address.trim()) return 'Please enter a street address.';
      if (!form.city.trim()) return 'Please enter a city.';
      if (!form.state.trim()) return 'Please enter a state.';
      if (!form.zipCode.trim()) return 'Please enter a ZIP code.';
      if (!form.pricePerHour && !form.pricePerDay) return 'Please set at least one price.';
    }
    return '';
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pricePerHour && !form.pricePerDay) {
      setError('Please set at least one price.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        maxVehicleSize: form.maxVehicleSize,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        amenities: form.amenities,
        instantBook: form.instantBook,
        images: form.images,
        ...(form.pricePerHour ? { pricePerHour: parseFloat(form.pricePerHour) } : {}),
        ...(form.pricePerDay ? { pricePerDay: parseFloat(form.pricePerDay) } : {}),
      };

      const res = await createSpace(payload);
      const spaceId = res.data.space.id;

      if (form.schedule.length > 0) {
        await setAvailability(spaceId, form.schedule).catch(() => {});
      }

      navigate(`/spaces/${spaceId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-2">List your parking space</h1>
        <p className="text-[#717171] mb-8">Tell renters about your space in a few easy steps.</p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                step > s.num
                  ? 'bg-[#008A05] text-white'
                  : step === s.num
                  ? 'bg-brand text-white'
                  : 'bg-[#DDDDDD] text-[#717171]'
              }`}>
                {step > s.num ? <CheckIcon /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-[#222222]' : 'text-[#717171]'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${step > s.num ? 'bg-[#008A05]' : 'bg-[#DDDDDD]'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Space type + basic info */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#222222]">Tell us about your space</h2>

            <div>
              <label className={LABEL_CLASS}>Space type *</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={INPUT_CLASS}>
                <option value="garage">Garage</option>
                <option value="driveway">Driveway</option>
                <option value="parking_lot">Parking Lot</option>
                <option value="carport">Carport</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Listing title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Secure Garage — Downtown Austin"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Description <span className="text-[#717171] font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Tell renters what makes your space great — security, lighting, nearby landmarks..."
                className={INPUT_CLASS + ' resize-none'}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Maximum vehicle size</label>
              <select value={form.maxVehicleSize} onChange={(e) => set('maxVehicleSize', e.target.value)} className={INPUT_CLASS}>
                {VEHICLE_SIZES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3.5 rounded-lg transition-colors text-sm"
            >
              Next: Location and pricing
            </button>
          </div>
        )}

        {/* Step 2: Location + pricing + amenities */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#222222]">Location and pricing</h2>

            <div>
              <label className={LABEL_CLASS}>Street address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="123 Main St"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className={LABEL_CLASS}>City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Austin"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>State *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => set('state', e.target.value.toUpperCase())}
                  placeholder="TX"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>ZIP *</label>
                <input
                  type="text"
                  required
                  value={form.zipCode}
                  onChange={(e) => set('zipCode', e.target.value)}
                  placeholder="78701"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="border-t border-[#DDDDDD] pt-5">
              <p className="text-sm font-semibold text-[#222222] mb-1">Pricing</p>
              <p className="text-xs text-[#717171] mb-4">Set at least one price. You can offer both hourly and daily rates.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Per hour ($)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.pricePerHour}
                    onChange={(e) => set('pricePerHour', e.target.value)}
                    placeholder="e.g. 5.00"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Per day ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.pricePerDay}
                    onChange={(e) => set('pricePerDay', e.target.value)}
                    placeholder="e.g. 25.00"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#DDDDDD] pt-5">
              <p className="text-sm font-semibold text-[#222222] mb-3">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.amenities.includes(a)
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'bg-white text-[#717171] border-[#DDDDDD] hover:border-[#717171]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#DDDDDD] pt-5 flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.instantBook}
                onClick={() => set('instantBook', !form.instantBook)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  form.instantBook ? 'bg-brand' : 'bg-[#DDDDDD]'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${form.instantBook ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-[#222222]">Instant Book</p>
                <p className="text-xs text-[#717171]">Renters can book without waiting for approval</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="flex-1 border border-[#DDDDDD] text-[#222222] font-semibold py-3 rounded-lg hover:bg-[#F7F7F7] transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                Next: Photos and availability
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos + availability */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#222222]">Photos</h2>
              <p className="text-sm text-[#717171]">Add up to 8 photos of your space. A good cover photo helps attract renters.</p>
              <ImageUploader
                value={form.images}
                onChange={(urls) => set('images', urls)}
              />
            </div>

            <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#222222]">Availability</h2>
              <p className="text-sm text-[#717171]">Set which days and hours your space is available.</p>
              <AvailabilityEditor
                value={form.schedule}
                onChange={(s) => set('schedule', s)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(2); setError(''); }}
                className="flex-1 border border-[#DDDDDD] text-[#222222] font-semibold py-3 rounded-lg hover:bg-[#F7F7F7] transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Publishing...' : 'Publish listing'}
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
