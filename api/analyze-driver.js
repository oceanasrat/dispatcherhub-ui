import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Haversine distance formula (meters)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;

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
  const { driver_id } = req.query;

  if (!driver_id) {
    return res.status(400).json({ error: "Missing driver_id" });
  }

  // Get last 10 locations
  const { data: locations } = await supabase
    .from("driver_locations")
    .select("*")
    .eq("driver_id", driver_id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!locations || locations.length < 5) {
    return res.json({ message: "Not enough data" });
  }

  const first = locations[locations.length - 1];
  const last = locations[0];

  const distance = getDistance(
    first.lat,
    first.lng,
    last.lat,
    last.lng
  );

  const timeDiff =
    (new Date(last.created_at) - new Date(first.created_at)) / 60000;

  let stopped = false;

  if (distance < 100 && timeDiff > 15) {
    stopped = true;

    await supabase
      .from("drivers")
      .update({
        stopped: true,
        risk_score: 50
      })
      .eq("id", driver_id);

    await supabase.from("alerts").insert({
      driver_id,
      type: "STOPPED_TOO_LONG",
      message: "Driver has not moved for over 15 minutes."
    });
  }

  res.json({
    distance_meters: distance,
    minutes: timeDiff,
    stopped
  });
}
