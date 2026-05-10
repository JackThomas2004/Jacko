/**
 * Geocode an address using the Mapbox Geocoding API.
 * Returns { latitude, longitude } or { latitude: null, longitude: null } on failure/missing token.
 */
async function geocodeAddress(address, city, state, zipCode) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return { latitude: null, longitude: null };
  }

  const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ');

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${token}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[geocode] Mapbox HTTP error:', res.status, res.statusText);
      return { latitude: null, longitude: null };
    }
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) {
      console.warn('[geocode] No results for address:', fullAddress);
      return { latitude: null, longitude: null };
    }
    const [longitude, latitude] = feature.center;
    return { latitude, longitude };
  } catch (err) {
    console.error('[geocode] Error calling Mapbox:', err.message);
    return { latitude: null, longitude: null };
  }
}

module.exports = { geocodeAddress };
