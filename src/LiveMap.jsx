import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase.from("drivers").select("*");
      setDrivers(data || []);
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const map = L.map("map").setView([39.5, -98.35], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    drivers.forEach((driver) => {
      if (driver.lat && driver.lng) {
        const color =
          driver.status === "online"
            ? "green"
            : driver.status === "issue"
            ? "red"
            : "gray";

        const marker = L.circleMarker([driver.lat, driver.lng], {
          color,
          radius: 8
        }).addTo(map);

        marker.bindPopup(`
          <b>${driver.name || "Driver"}</b><br/>
          Truck: ${driver.truck_number || "-"}<br/>
          Status: ${driver.status}
        `);
      }
    });

    return () => map.remove();
  }, [drivers]);

  return (
    <div className="h-screen w-full">
      <div id="map" className="h-full w-full"></div>
    </div>
  );
}
