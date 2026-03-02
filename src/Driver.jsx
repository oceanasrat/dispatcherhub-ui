import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

export default function Driver() {
  const [driverId, setDriverId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("offline");

  const watchRef = useRef(null);

  // ---------------------------
  // START TRACKING
  // ---------------------------
  const startTracking = () => {
    if (!driverId) {
      alert("Enter Driver ID first");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const now = new Date().toISOString();

              // 1️⃣ Update driver live location
              const { error: updateError } = await supabase
                .from("drivers")
                .update({
                  lat: latitude,
                  lng: longitude,
                  status: "online",
                  updated_at: now,
                })
                .eq("id", driverId);

              if (updateError) {
                console.error("Driver update error:", updateError);
                return;
              }

              // 2️⃣ Insert location history
              const { error: insertError } = await supabase
                .from("driver_locations")
                .insert({
                  driver_id: driverId,
                  lat: latitude,
                  lng: longitude,
                  created_at: now,
                });

              if (insertError) {
                console.error("Location insert error:", insertError);
              }

              // 3️⃣ Trigger AI monitoring
              try {
                await fetch(
                  `/api/analyze-driver?driver_id=${driverId}`
                );
              } catch (aiError) {
                console.error("AI monitor error:", aiError);
              }

              setStatus("online");
            } catch (err) {
              console.error("Tracking error:", err);
              setStatus("offline");
            }
          },
          (err) => {
            console.error("Watch error:", err);
            setStatus("offline");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
          }
        );

        watchRef.current = id;
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

  // ---------------------------
  // STOP TRACKING
  // ---------------------------
  const stopTracking = async () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    await supabase
      .from("drivers")
      .update({
        status: "offline",
        updated_at: new Date().toISOString(),
      })
      .eq("id", driverId);

    setTracking(false);
    setStatus("offline");
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

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
