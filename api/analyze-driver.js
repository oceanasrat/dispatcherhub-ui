import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Convert degrees to radians
function toRad(x) {
  return (x * Math.PI) / 180;
}

// Haversine distance formula (meters)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function handler(req, res) {
  try {
    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ error: "Missing driver_id" });
    }

    // Get last 10 locations
    const { data: locations, error } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("driver_id", driver_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!locations || locations.length < 5) {
      return res.json({ message: "Not enough data yet" });
    }

    const first = locations[locations.length - 1];
    const last = locations[0];

    const distance = getDistance(
      first.lat,
      first.lng,
      last.lat,
      last.lng
    );

    const minutes =
      (new Date(last.created_at) - new Date(first.created_at)) / 60000;

    let stopped = false;
    let riskIncrease = 0;

    // STOP RULE (serious stop)
    if (distance < 100 && minutes > 1) {
      stopped = true;
      riskIncrease = 30;
    }

    // Slow movement risk
    if (distance < 200 && minutes > 10) {
      riskIncrease += 10;
    }

    if (stopped) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("risk_score")
        .eq("id", driver_id)
        .single();

      const newRisk = (driver?.risk_score || 0) + riskIncrease;

      await supabase
        .from("drivers")
        .update({
          stopped: true,
          risk_score: newRisk,
          last_movement_at: last.created_at
        })
        .eq("id", driver_id);

      await supabase.from("alerts").insert({
        driver_id,
        type: "STOPPED_TOO_LONG",
        message: `Driver stopped ${minutes.toFixed(
          1
        )} minutes. Risk score: ${newRisk}`
      });
    } else {
      await supabase
        .from("drivers")
        .update({
          stopped: false
        })
        .eq("id", driver_id);
    }

    return res.json({
      distance_meters: Math.round(distance),
      minutes: minutes.toFixed(2),
      stopped
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
