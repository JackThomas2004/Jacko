import { useRef, useEffect, useState } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Dynamically import mapbox-gl only if token exists to avoid errors
export default function MapView({ spaces = [], selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let map;
    let cancelled = false;

    import('mapbox-gl').then((mbgl) => {
      if (cancelled) return;
      const mapboxgl = mbgl.default || mbgl;
      // Import CSS
      import('mapbox-gl/dist/mapbox-gl.css').catch(() => {});

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const validSpaces = spaces.filter(
        (s) => s.latitude != null && s.longitude != null
      );

      const center =
        validSpaces.length > 0
          ? [validSpaces[0].longitude, validSpaces[0].latitude]
          : [-98.5795, 39.8283];

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom: validSpaces.length > 0 ? 11 : 4,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        setReady(true);
        addMarkers(mapboxgl, map, validSpaces);
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when spaces or selection changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    import('mapbox-gl').then((mbgl) => {
      const mapboxgl = mbgl.default || mbgl;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      const validSpaces = spaces.filter(
        (s) => s.latitude != null && s.longitude != null
      );
      addMarkers(mapboxgl, mapRef.current, validSpaces);
    });
  }, [spaces, selectedId, ready]);

  function addMarkers(mapboxgl, map, validSpaces) {
    validSpaces.forEach((space) => {
      const isSelected = space.id === selectedId;

      const el = document.createElement('div');
      el.style.cssText = `
        background: ${isSelected ? '#FF385C' : '#222222'};
        color: white;
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
        font-family: Inter, sans-serif;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid ${isSelected ? '#E31C5F' : '#444'};
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.15s;
      `;
      const price = space.pricePerHour
        ? `$${space.pricePerHour}/hr`
        : `$${space.pricePerDay}/day`;
      el.textContent = price;

      el.addEventListener('mouseenter', () => {
        el.style.background = '#FF385C';
      });
      el.addEventListener('mouseleave', () => {
        if (space.id !== selectedId) el.style.background = '#222222';
      });
      el.addEventListener('click', () => {
        if (onSelect) onSelect(space.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([space.longitude, space.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }

  if (!MAPBOX_TOKEN) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}
