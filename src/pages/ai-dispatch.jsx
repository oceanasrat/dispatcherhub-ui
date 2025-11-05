// src/pages/ai-dispatch.jsx
import { useEffect, useMemo, useState } from 'react';
import LeafletMiniMap from '../components/LeafletMiniMap';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function json(r) {
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function StatusBadge({ status }) {
  const classes = {
    unassigned: 'bg-slate-100 text-slate-700',
    in_transit: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-sm ${classes[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
}

export default function AiDispatch() {
  const [health, setHealth] = useState('checking...');
  const [loads, setLoads] = useState([]);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [eta, setEta] = useState(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false);

  const openLoad = useMemo(() => loads.find(l => l.id === openId), [loads, openId]);
  const from = openLoad ? { lat: openLoad.pickup_lat, lon: openLoad.pickup_lon } : null;
  const to   = openLoad ? { lat: openLoad.drop_lat,   lon: openLoad.drop_lon }   : null;

  // Convert GeoJSON [lon,lat] -> [lat,lon]
  const lineCoords = useMemo(() => {
    const coords = route?.geometry?.coordinates || [];
    return coords.map(([lon, lat]) => [lat, lon]);
  }, [route]);

  async function refresh() {
    try {
      setError('');
      const data = await json(await fetch(`${API}/loads`));
      setLoads(data.loads || []);
    } catch (e) {
      setError(`Failed to fetch: ${e.message}`);
      setLoads([]);
    }
  }

  async function checkHealth() {
    try {
      await json(await fetch(`${API}/health`));
      setHealth('OK');
    } catch {
      setHealth('DOWN');
    }
  }

  async function seedDemo() {
    setBusy(true);
    try {
      await fetch(`${API}/loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_lat: 41.8781, pickup_lon: -87.6298, drop_lat: 39.7392, drop_lon: -104.9903 }),
      });
      await fetch(`${API}/loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_lat: 34.0522, pickup_lon: -118.2437, drop_lat: 36.1699, drop_lon: -115.1398 }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    setBusy(true);
    try {
      await fetch(`${API}/loads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function fetchEtaAndRoute() {
    if (!openLoad) return;
    setBusy(true);
    try {
      const qs = (o) => new URLSearchParams(o).toString();
      const etaRes = await json(await fetch(`${API}/eta?` + qs({
        from_lat: openLoad.pickup_lat, from_lon: openLoad.pickup_lon,
        to_lat:   openLoad.drop_lat,   to_lon:   openLoad.drop_lon,
      })));
      setEta(etaRes);

      const routeRes = await json(await fetch(`${API}/eta/route?` + qs({
        from_lat: openLoad.pickup_lat, from_lon: openLoad.pickup_lon,
        to_lat:   openLoad.drop_lat,   to_lon:   openLoad.drop_lon,
      })));
      setRoute(routeRes);
    } catch (e) {
      setError(`ETA/route failed: ${e.message}`);
      setEta(null); setRoute(null);
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(verdict) {
    if (!openLoad) return;
    try {
      await fetch(`${API}/copilot/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          load_id: openLoad.id,
          vehicle_id: null,
          verdict,
          reason: 'ui',
          score: verdict === 'up' ? 1 : 0,
        }),
      });
    } catch { /* non-blocking */ }
  }

  useEffect(() => { checkHealth(); refresh(); }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">DispatcherHub × ai-dispatch <span className="text-sm text-slate-500">UI v2</span></h1>

      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 rounded bg-slate-900 text-white" onClick={refresh}>Refresh</button>
        <button disabled={busy} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50" onClick={seedDemo}>
          Seed 2 demo loads
        </button>
        <div className="ml-3 text-sm">API health: <strong>{health}</strong></div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2">{error}</div>
      )}

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-3 py-2 w-40">Ref</th>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2 w-32">Status</th>
              <th className="px-3 py-2 w-44">Action</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <Fragment key={l.id || l.ref}>
                <tr className="border-t">
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-700 hover:underline"
                      onClick={() => {
                        setOpenId(openId === l.id ? null : l.id);
                        setEta(null); setRoute(null);
                      }}>
                      {l.ref}
                    </button>
                  </td>
                  <td className="px-3 py-2">{l.pickup_lat?.toFixed(3)}, {l.pickup_lon?.toFixed(3)}</td>
                  <td className="px-3 py-2">{l.drop_lat?.toFixed(3)}, {l.drop_lon?.toFixed(3)}</td>
                  <td className="px-3 py-2"><StatusBadge status={l.status} /></td>
                  <td className="px-3 py-2 flex gap-2">
                    <button disabled={busy} className="px-2 py-1 rounded bg-slate-200 disabled:opacity-50" onClick={() => setStatus(l.id, 'in_transit')}>Start</button>
                    <button disabled={busy} className="px-2 py-1 rounded bg-slate-200 disabled:opacity-50" onClick={() => setStatus(l.id, 'delivered')}>Deliver</button>
                  </td>
                </tr>

                {openId === l.id && (
                  <tr className="border-t bg-slate-50/40">
                    <td colSpan={5} className="px-3 py-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">ETA & Route</h3>
                            <div className="flex gap-2">
                              <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={fetchEtaAndRoute}>Show route</button>
                              <button className="px-2 py-1 rounded bg-slate-200" onClick={() => { setEta(null); setRoute(null); }}>Clear</button>
                            </div>
                          </div>
                          {eta && (
                            <div className="text-sm mb-2">
                              <div>Distance: <b>{eta.distance_km?.toFixed?.(1) ?? eta.distance_km} km</b></div>
                              <div>ETA: <b>{eta.eta_minutes} min</b> (avg {eta.avg_speed_kph} kph)</div>
                              {eta.source && <div className="text-slate-500">source={eta.source}</div>}
                            </div>
                          )}
                          <LeafletMiniMap from={from} to={to} lineCoords={lineCoords} />
                        </div>

                        <div className="rounded border p-3">
                          <h3 className="font-medium mb-2">Copilot</h3>
                          <div className="text-sm text-slate-600 mb-2">Thumb this recommendation:</div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => sendFeedback('up')}>👍 Up</button>
                            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => sendFeedback('down')}>👎 Down</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loads.length && (
              <tr className="border-t">
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">No loads yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-500">
        Uses <code>/loads</code> from your local <code>ai-dispatch</code> API ({API}).
      </p>
    </div>
  );
}

// tiny helper to use <Fragment/> without importing React everywhere in Vite
function Fragment({ children }) { return children; }
