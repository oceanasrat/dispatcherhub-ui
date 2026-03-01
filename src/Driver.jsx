import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Driver() {
  const [driverId, setDriverId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("offline");
  const [watchId, setWatchId] = useState(null);

  const startTracking = () => {
    if (!driverId) {
      alert("Enter Driver ID first");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    // FORCE permission request directly from button click
    navigator.geolocation.getCurrentPosition(
      () => {
        // Permission granted — now start watch
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            const { error } = await supabase
              .from("drivers")
              .update({
                lat: latitude,
                lng: longitude,
                status: "online",
                updated_at: new Date(),
              })
              .eq("id", driverId);

            if (error) {
              console.log("Update error:", error);
            } else {
              setStatus("online");
            }
          },
          (err) => {
            console.log("Watch error:", err);
            setStatus("offline");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
          }
        );

        setWatchId(id);
        setTracking(true);
      },
      (err) => {
        alert("Permission denied: " + err.message);
        setStatus("offline");
      },
      {
        enableHighAccuracy: true,
      }
    );
  };

  const stopTracking = async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    await supabase
      .from("drivers")
      .update({ status: "offline" })
      .eq("id", driverId);

    setTracking(false);
    setStatus("offline");
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

        <div className="text-center">
          Status:
          <span
            className={`ml-2 font-semibold ${
              status === "online"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
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
