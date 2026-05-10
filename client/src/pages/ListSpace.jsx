import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createSpace } from '../api/client';

const AMENITY_OPTIONS = ['Covered', 'EV Charger', 'Security Camera', 'Well Lit', '24/7 Access', 'Gated', 'Wide Access', 'Shaded', 'Near Transit'];

export default function ListSpace() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'garage',
    pricePerHour: '',
    pricePerDay: '',
    amenities: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pricePerHour && !form.pricePerDay) {
      setError('Please provide at least one price (hourly or daily).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await createSpace({
        ...form,
        pricePerHour: form.pricePerHour ? parseFloat(form.pricePerHour) : undefined,
        pricePerDay: form.pricePerDay ? parseFloat(form.pricePerDay) : undefined,
      });
      navigate(`/spaces/${res.data.space.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">List Your Parking Space</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Listing Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Secure Garage – Downtown Austin"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Tell renters what makes your space great…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Space Type *</label>
              <select
                required
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="garage">Garage</option>
                <option value="driveway">Driveway</option>
                <option value="parking_lot">Parking Lot</option>
                <option value="carport">Carport</option>
              </select>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Location</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="123 Main St"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Austin"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => set('state', e.target.value.toUpperCase())}
                  placeholder="TX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code *</label>
              <input
                type="text"
                required
                value={form.zipCode}
                onChange={(e) => set('zipCode', e.target.value)}
                placeholder="78701"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Pricing</h2>
            <p className="text-slate-500 text-sm">Set at least one price. You can offer both.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price per Hour ($)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.pricePerHour}
                  onChange={(e) => set('pricePerHour', e.target.value)}
                  placeholder="e.g. 5.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price per Day ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={form.pricePerDay}
                  onChange={(e) => set('pricePerDay', e.target.value)}
                  placeholder="e.g. 25.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Amenities */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 text-lg mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.amenities.includes(a)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {form.amenities.includes(a) ? '✓ ' : ''}{a}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating Listing…' : 'List My Space'}
          </button>
        </form>
      </div>
    </div>
  );
}
