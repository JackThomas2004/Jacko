import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getSpace, updateSpace, deleteSpace } from '../api/client';
import { useAuth } from '../context/AuthContext';

const AMENITY_OPTIONS = ['Covered', 'EV Charger', 'Security Camera', 'Well Lit', '24/7 Access', 'Gated', 'Wide Access', 'Shaded', 'Near Transit'];

export default function EditSpace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getSpace(id).then((res) => {
      const s = res.data.space;
      if (s.ownerId !== user?.id) { navigate('/dashboard'); return; }
      setForm({
        title: s.title,
        description: s.description || '',
        address: s.address,
        city: s.city,
        state: s.state,
        zipCode: s.zipCode,
        type: s.type,
        pricePerHour: s.pricePerHour ?? '',
        pricePerDay: s.pricePerDay ?? '',
        amenities: s.amenities || [],
        isActive: s.isActive,
      });
      setLoading(false);
    }).catch(() => navigate('/dashboard'));
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
    setSaving(true);
    setError('');
    try {
      await updateSpace(id, {
        ...form,
        pricePerHour: form.pricePerHour ? parseFloat(form.pricePerHour) : null,
        pricePerDay: form.pricePerDay ? parseFloat(form.pricePerDay) : null,
      });
      navigate(`/spaces/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteSpace(id);
      navigate('/hosted-bookings');
    } catch {
      setDeleting(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Edit Listing</h1>
          <Link to={`/spaces/${id}`} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</Link>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => set('title', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Space Type *</label>
              <select required value={form.type} onChange={(e) => set('type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="garage">Garage</option>
                <option value="driveway">Driveway</option>
                <option value="parking_lot">Parking Lot</option>
                <option value="carport">Carport</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Listing is active (visible to renters)</label>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Location</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
              <input type="text" required value={form.address} onChange={(e) => set('address', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input type="text" required value={form.city} onChange={(e) => set('city', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input type="text" required maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code *</label>
              <input type="text" required value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 text-lg">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Per Hour ($)</label>
                <input type="number" min="0.5" step="0.5" value={form.pricePerHour} onChange={(e) => set('pricePerHour', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Per Day ($)</label>
                <input type="number" min="1" step="0.5" value={form.pricePerDay} onChange={(e) => set('pricePerDay', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 text-lg mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${form.amenities.includes(a) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {form.amenities.includes(a) ? '✓ ' : ''}{a}
                </button>
              ))}
            </div>
          </section>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="px-6 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors border border-red-200">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
