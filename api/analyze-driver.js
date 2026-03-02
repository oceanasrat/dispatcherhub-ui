import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ error: "Missing driver_id" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        error: "Missing Supabase environment variables",
        debug: {
          SUPABASE_URL_exists: !!supabaseUrl,
          SERVICE_KEY_exists: !!serviceKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("driver_locations")
      .select("lat,lng,created_at")
      .eq("driver_id", driver_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      driver_id,
      location_count: data.length,
      latest_location: data[0] || null
    });

  } catch (err) {
    return res.status(500).json({
      crash: err.message
    });
  }
}
