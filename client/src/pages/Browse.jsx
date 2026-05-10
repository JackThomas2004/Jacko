import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpaceCard from '../components/SpaceCard';
import MapView from '../components/MapView';
import Footer from '../components/Footer';
import { getSpaces } from '../api/client';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'garage', label: 'Garage' },
  { value: 'driveway', label: 'Driveway' },
  { value: 'parking_lot', label: 'Parking Lot' },
  { value: 'carport', label: 'Carport' },
];

const INPUT_CLASS =
  'w-full border border-[#DDDDDD] rounded-lg px-4 py-3 text-sm text-[#222222] placeholder-[#717171] focus:border-[#222222] focus:outline-none focus:ring-0 bg-white transition-colors';

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: '',
    priceUnit: 'hour',
    minPrice: '',
    maxPrice: '',
  });

  const fetchSpaces = useCallback(async (f = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (f.city) params.city = f.city;
      if (f.type) params.type = f.type;
      if (f.minPrice) params.minPrice = f.minPrice;
      if (f.maxPrice) params.maxPrice = f.maxPrice;
      if (f.minPrice || f.maxPrice) params.priceUnit = f.priceUnit;
      const res = await getSpaces(params);
      setSpaces(res.data.spaces || []);
    } catch {
      setError('Failed to load spaces. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces(filters);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchSpaces(filters);
  }

  function set(key, val) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Filters bar */}
      <div className="border-b border-[#DDDDDD] bg-white sticky top-16 z-40">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* City */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-xs font-semibold text-[#717171] mb-1.5 uppercase tracking-wide">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Austin"
                className={INPUT_CLASS}
              />
            </div>

            {/* Type */}
            <div className="min-w-[140px]">
              <label className="block text-xs font-semibold text-[#717171] mb-1.5 uppercase tracking-wide">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => set('type', e.target.value)}
                className={INPUT_CLASS}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Price unit */}
            <div className="min-w-[130px]">
              <label className="block text-xs font-semibold text-[#717171] mb-1.5 uppercase tracking-wide">
                Billed by
              </label>
              <select
                value={filters.priceUnit}
                onChange={(e) => set('priceUnit', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
              </select>
            </div>

            {/* Min price */}
            <div className="w-24">
              <label className="block text-xs font-semibold text-[#717171] mb-1.5 uppercase tracking-wide">
                Min $
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.minPrice}
                onChange={(e) => set('minPrice', e.target.value)}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </div>

            {/* Max price */}
            <div className="w-24">
              <label className="block text-xs font-semibold text-[#717171] mb-1.5 uppercase tracking-wide">
                Max $
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.maxPrice}
                onChange={(e) => set('maxPrice', e.target.value)}
                placeholder="Any"
                className={INPUT_CLASS}
              />
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <FilterIcon />
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Result count + map toggle (mobile) */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#717171]">
            {loading ? 'Searching...' : `${spaces.length} space${spaces.length !== 1 ? 's' : ''} found`}
          </p>
          {MAPBOX_TOKEN && (
            <button
              onClick={() => setShowMap((v) => !v)}
              className="md:hidden flex items-center gap-2 border border-[#DDDDDD] rounded-full px-4 py-2 text-sm font-medium text-[#222222] hover:bg-[#F7F7F7] transition-colors"
            >
              {showMap ? <><ListIcon /> Show list</> : <><MapIcon /> Show map</>}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-[#C13515]/20 text-[#C13515] rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <FilterIcon />
            </div>
            <p className="text-lg font-semibold text-[#222222] mb-2">No spaces found</p>
            <p className="text-sm text-[#717171]">Try adjusting your filters or searching a different city.</p>
          </div>
        ) : MAPBOX_TOKEN ? (
          /* Two-panel layout on desktop */
          <div className="flex gap-6">
            {/* List - hidden on mobile when map is shown */}
            <div className={`${showMap ? 'hidden md:block' : 'block'} md:w-1/2 lg:w-[45%] space-y-4`}>
              {spaces.map((s) => (
                <div
                  key={s.id}
                  onMouseEnter={() => setSelectedId(s.id)}
                  onMouseLeave={() => setSelectedId(null)}
                >
                  <SpaceCard space={s} highlighted={selectedId === s.id} />
                </div>
              ))}
            </div>

            {/* Map */}
            <div
              className={`${showMap ? 'block' : 'hidden md:block'} md:flex-1 sticky top-36`}
              style={{ height: 'calc(100vh - 180px)' }}
            >
              <MapView
                spaces={spaces}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>
        ) : (
          /* Full-width grid when no Mapbox token */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spaces.map((s) => (
              <SpaceCard key={s.id} space={s} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
