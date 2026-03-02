import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);
  const mapRef = useRef(null);

  // Fetch drivers every 5 seconds
  useEffect(() => {
  async function loadDrivers() {
    const { data } = await supabase.from("drivers").select("*");
    setDrivers(data || []);
  }

  loadDrivers();

  const channel = supabase
    .channel("drivers-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "drivers" },
      (payload) => {
        loadDrivers();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  // Initialize map only once
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map");
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    map.setView([39.5, -98.35], 4);
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const validDrivers = drivers.filter(d => d.lat && d.lng);

    if (validDrivers.length > 0) {
      const latlngs = validDrivers.map(d => [d.lat, d.lng]);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });

      validDrivers.forEach((driver) => {
        const color =
  driver.stopped
    ? "red"
    : driver.status === "online"
    ? "green"
    : "gray";

        L.circleMarker([driver.lat, driver.lng], {
          color,
          radius: 8
        })
          .addTo(map)
          .bindPopup(`
            <b>${driver.name || "Driver"}</b><br/>
            Truck: ${driver.truck_number || "-"}<br/>
            Status: ${driver.status}
          `);
      });
    }
  }, [drivers]);

  return (
    <div className="h-screen w-full relative">
      <button
        onClick={() => window.location.reload()}
        className="absolute top-4 left-4 bg-white px-3 py-1 rounded shadow z-[1000]"
      >
        ← Back to Dispatcher
      </button>

      <div id="map" className="h-full w-full"></div>
    </div>
  );
}
