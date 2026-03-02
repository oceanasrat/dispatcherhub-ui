import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
  fetchAlerts();

  const channel = supabase
    .channel("alerts-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "alerts" },
      () => {
        fetchAlerts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function fetchAlerts() {
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    setAlerts(data || []);
  }

  async function resolveAlert(id) {
    await supabase
      .from("alerts")
      .update({ resolved: true })
      .eq("id", id);

    fetchAlerts();
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h2 className="font-semibold text-red-600 mb-3">
        Active Alerts
      </h2>

      {alerts.length === 0 && (
        <p className="text-sm text-gray-400">No active alerts</p>
      )}

      {alerts.map(alert => (
        <div
          key={alert.id}
          className="border p-3 rounded-lg mb-2 bg-red-50"
        >
          <div className="text-sm font-medium">
            {alert.type}
          </div>

          <div className="text-xs text-gray-600">
            {alert.message}
          </div>

          <button
            onClick={() => resolveAlert(alert.id)}
            className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
