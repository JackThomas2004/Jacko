import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUploader from '../components/ImageUploader';
import AvailabilityEditor from '../components/AvailabilityEditor';
import { getSpace, updateSpace, deleteSpace, getAvailability, setAvailability } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

export default function EditSpace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    Promise.allSettled([getSpace(id), getAvailability(id)])
      .then(([spaceRes, availRes]) => {
        if (spaceRes.status !== 'fulfilled') { navigate('/dashboard'); return; }
        const s = spaceRes.value.data.space;
        if (s.ownerId !== user?.id) { navigate('/dashboard'); return; }
        setForm({
          title: s.title,
          description: s.description || '',
          address: s.address,
          city: s.city,
          state: s.state,
          zipCode: s.zipCode,
          type: s.type,
          maxVehicleSize: s.maxVehicleSize || 'any',
          pricePerHour: s.pricePerHour ?? '',
          pricePerDay: s.pricePerDay ?? '',
          amenities: s.amenities || [],
          instantBook: s.instantBook || false,
          isActive: s.isActive,
          images: s.images || [],
        });
        if (availRes.status === 'fulfilled') {
          setSchedule(availRes.value.data.schedule || availRes.value.data || []);
        }
        setLoading(false);
      })
      .catch(() => navigate('/dashboard'));
  }, [id]);

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

  async function handleSave(e) {
    e.preventDefault();
    if (!form.pricePerHour && !form.pricePerDay) {
      setError('Please set at least one price.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateSpace(id, {
        ...form,
        pricePerHour: form.pricePerHour ? parseFloat(form.pricePerHour) : null,
        pricePerDay: form.pricePerDay ? parseFloat(form.pricePerDay) : null,
      });
      await setAvailability(id, schedule).catch(() => {});
      setSuccess('Listing saved successfully.');
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSpace(id);
      navigate('/hosted-bookings');
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

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

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Edit listing</h1>
            <p className="text-[#717171] text-sm mt-0.5">Update your space details, photos, and availability.</p>
          </div>
          <Link to={`/spaces/${id}`} className="text-sm text-[#717171] hover:text-[#222222] font-medium">
            View listing
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-[#008A05]/20 text-[#008A05] rounded-lg px-4 py-3 mb-6 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#222222]">Basic information</h2>

            <div>
              <label className={LABEL_CLASS}>Listing title *</label>
              <input type="text" required value={form.title} onChange={(e) => set('title', e.target.value)} className={INPUT_CLASS} />
            </div>

            <div>
              <label className={LABEL_CLASS}>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={INPUT_CLASS + ' resize-none'} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Space type *</label>
                <select required value={form.type} onChange={(e) => set('type', e.target.value)} className={INPUT_CLASS}>
                  <option value="garage">Garage</option>
                  <option value="driveway">Driveway</option>
                  <option value="parking_lot">Parking Lot</option>
                  <option value="carport">Carport</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Max vehicle size</label>
                <select value={form.maxVehicleSize} onChange={(e) => set('maxVehicleSize', e.target.value)} className={INPUT_CLASS}>
                  {VEHICLE_SIZES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => set('isActive', !form.isActive)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  form.isActive ? 'bg-[#008A05]' : 'bg-[#DDDDDD]'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-[#222222]">Listing active</p>
                <p className="text-xs text-[#717171]">When inactive, your space will not appear in search results</p>
              </div>
            </div>

            {/* Instant book toggle */}
            <div className="flex items-center gap-3">
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
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#222222]">Location</h2>
            <div>
              <label className={LABEL_CLASS}>Street address *</label>
              <input type="text" required value={form.address} onChange={(e) => set('address', e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className={LABEL_CLASS}>City *</label>
                <input type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>State *</label>
                <input type="text" required maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>ZIP *</label>
                <input type="text" required value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#222222]">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Per hour ($)</label>
                <input type="number" min="0.5" step="0.5" value={form.pricePerHour} onChange={(e) => set('pricePerHour', e.target.value)} placeholder="e.g. 5.00" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Per day ($)</label>
                <input type="number" min="1" step="0.5" value={form.pricePerDay} onChange={(e) => set('pricePerDay', e.target.value)} placeholder="e.g. 25.00" className={INPUT_CLASS} />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#222222] mb-4">Amenities</h2>
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

          {/* Photos */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#222222]">Photos</h2>
            <ImageUploader
              value={form.images}
              onChange={(urls) => set('images', urls)}
            />
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl border border-[#DDDDDD] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#222222]">Availability</h2>
            <AvailabilityEditor value={schedule} onChange={setSchedule} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-lg transition-colors text-sm"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="px-6 border border-[#DDDDDD] text-[#C13515] hover:bg-red-50 hover:border-[#C13515]/30 font-semibold py-3.5 rounded-lg transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-[#222222] mb-2">Delete this listing?</h3>
            <p className="text-sm text-[#717171] mb-6">
              This will permanently remove your listing and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-[#DDDDDD] text-[#222222] font-semibold py-2.5 rounded-lg hover:bg-[#F7F7F7] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-[#C13515] hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
