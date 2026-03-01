import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ error: "Missing driver_id" });
    }

    const { data, error } = await supabase
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
      location_count: data.length,
      locations: data
    });

  } catch (err) {
    return res.status(500).json({
      crash: err.message
    });
  }
}
