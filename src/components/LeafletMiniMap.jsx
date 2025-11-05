// src/components/LeafletMiniMap.jsx
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useMemo } from 'react';

// Fix default marker icons in bundlers
const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconBase + 'marker-icon-2x.png',
  iconUrl: iconBase + 'marker-icon.png',
  shadowUrl: iconBase + 'marker-shadow.png',
});

export default function LeafletMiniMap({ from, to, lineCoords }) {
  const center = useMemo(() => {
    if (lineCoords?.length) return lineCoords[Math.floor(lineCoords.length / 2)];
    if (from && to) return [(from.lat + to.lat) / 2, (from.lon + to.lon) / 2];
    return [39.5, -98.35]; // US center-ish
  }, [from, to, lineCoords]);

  return (
    <div style={{ height: 220 }}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {from && (
          <Marker position={[from.lat, from.lon]}>
            <Popup>Pickup: {from.lat.toFixed(3)}, {from.lon.toFixed(3)}</Popup>
          </Marker>
        )}
        {to && (
          <Marker position={[to.lat, to.lon]}>
            <Popup>Drop: {to.lat.toFixed(3)}, {to.lon.toFixed(3)}</Popup>
          </Marker>
        )}
        {lineCoords?.length ? <Polyline positions={lineCoords} /> : null}
      </MapContainer>
    </div>
  );
}
