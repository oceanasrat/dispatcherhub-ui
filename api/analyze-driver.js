const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

module.exports = async function handler(req, res) {
  try {
    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ error: "Missing driver_id" });
    }

    const { data: locations, error } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("driver_id", driver_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      driver_id,
      location_count: locations.length,
    });
  } catch (err) {
    return res.status(500).json({
      crash: err.message,
    });
  }
};
