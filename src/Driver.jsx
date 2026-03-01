import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Driver() {
  const [driverId, setDriverId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("offline");

  useEffect(() => {
  if (!tracking) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      alert("GPS WORKING: " + position.coords.latitude);
    },
    (err) => {
      alert("GPS ERROR: " + err.message);
    }
  );
}, [tracking]);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        await supabase
          .from("drivers")
          .update({
    lat: latitude,
    lng: longitude,
    status: "online",
    updated_at: new Date()
  })
  .eq("id", driverId);

if (error) {
  console.log("Update error:", error);
}

        setStatus("online");
      },
      (err) => {
        console.error(err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, driverId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-bold mb-4 text-center">
          Driver Tracking
        </h1>

        <input
          type="text"
          placeholder="Enter your Driver ID"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <button
          onClick={() => setTracking(true)}
          className="w-full bg-green-600 text-white py-2 rounded-lg mb-4"
        >
          Start Tracking
        </button>

        <div className="text-center">
          Status:
          <span className={`ml-2 font-semibold ${status === "online" ? "text-green-600" : "text-red-600"}`}>
            {status}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Keep this page open while driving.
        </p>
      </div>
    </div>
  );
}
