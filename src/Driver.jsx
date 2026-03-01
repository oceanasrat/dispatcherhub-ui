import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Driver() {
  const [driverId, setDriverId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("offline");
  const [message, setMessage] = useState("");

  useEffect(() => {
  if (!tracking) return;

  navigator.permissions.query({ name: "geolocation" }).then(result => {
    alert("Permission state: " + result.state);
  });

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      alert("GPS OK");
    },
    (err) => {
      alert("GPS ERROR: " + err.message);
    }
  );
}, [tracking]);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { error } = await supabase
          .from("drivers")
          .update({
            lat: latitude,
            lng: longitude,
            status: "online",
            updated_at: new Date().toISOString()
          })
          .eq("id", driverId);

        if (error) {
          console.error("Update error:", error);
          setMessage("Database update failed");
        } else {
          setStatus("online");
          setMessage("Location updating...");
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setMessage("Location permission denied");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, driverId]);

  const startTracking = () => {
    if (!driverId) {
      alert("Please enter your Driver ID");
      return;
    }
    setTracking(true);
  };

  const stopTracking = async () => {
    await supabase
      .from("drivers")
      .update({ status: "offline" })
      .eq("id", driverId);

    setTracking(false);
    setStatus("offline");
    setMessage("Tracking stopped");
  };

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

        {!tracking ? (
          <button
            onClick={startTracking}
            className="w-full bg-green-600 text-white py-2 rounded-lg mb-4"
          >
            Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="w-full bg-red-600 text-white py-2 rounded-lg mb-4"
          >
            Stop Tracking
          </button>
        )}

        <div className="text-center mb-2">
          Status:
          <span
            className={`ml-2 font-semibold ${
              status === "online" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status}
          </span>
        </div>

        {message && (
          <div className="text-xs text-gray-500 text-center">
            {message}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 text-center">
          Keep this page open while driving.
        </p>
      </div>
    </div>
  );
}
