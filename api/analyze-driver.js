import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    // Only allow GET
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ error: "Missing driver_id" });
    }

    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase environment variables"
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch latest 20 locations
    const { data, error } = await supabase
      .from("driver_locations")
      .select("lat, lng, created_at")
      .eq("driver_id", driver_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({
        error: "Supabase query failed",
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        driver_id,
        message: "No location history found",
        location_count: 0
      });
    }

    return res.status(200).json({
      driver_id,
      location_count: data.length,
      latest_location: data[0]
    });

  } catch (err) {
    return res.status(500).json({
      crash: err.message
    });
  }
}
