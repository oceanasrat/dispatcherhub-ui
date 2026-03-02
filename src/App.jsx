import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Driver from "./Driver";
import LiveMap from "./LiveMap";
import AlertsPanel from "./AlertsPanel";

export default function App() {

  const [mode, setMode] = useState("dispatcher");

  // JOB STATE
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [form, setForm] = useState({
    type: "freight",
    title: "",
    origin: "",
    destination: "",
    pickup_time: "",
    revenue: ""
  });

  useEffect(() => {
    fetchJobs();
    fetchDrivers();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  }

  async function fetchDrivers() {
    const { data } = await supabase
      .from("drivers")
      .select("*");

    setDrivers(data || []);
  }

  async function createJob(e) {
    e.preventDefault();

    await supabase.from("jobs").insert({
      ...form,
      status: "pending"
    });

    setForm({
      type: "freight",
      title: "",
      origin: "",
      destination: "",
      pickup_time: "",
      revenue: ""
    });

    fetchJobs();
  }

  async function assignDriver(jobId, driverId) {
    await supabase
      .from("jobs")
      .update({ assigned_driver_id: driverId })
      .eq("id", jobId);

    fetchJobs();
  }

  // DRIVER MODE
  if (mode === "driver") {
    return (
      <div>
        <div className="p-4 bg-slate-100">
          <button
            onClick={() => setMode("dispatcher")}
            className="text-sm text-blue-600 underline"
          >
            ← Back to Dispatcher
          </button>
        </div>
        <Driver />
      </div>
    );
  }

  // MAP MODE
  if (mode === "map") {
    return (
      <div>
        <div className="p-4 bg-slate-100">
          <button
            onClick={() => setMode("dispatcher")}
            className="text-sm text-blue-600 underline"
          >
            ← Back to Dispatcher
          </button>
        </div>
        <LiveMap />
      </div>
    );
  }

  // DISPATCHER MODE
  return (
    <div className="min-h-screen p-6 bg-slate-100">
      <div className="max-w-6xl mx-auto">

        {/* MODE BUTTONS */}
        <div className="flex justify-end mb-4 space-x-4">
          <button
            onClick={() => setMode("driver")}
            className="text-sm text-indigo-600 underline"
          >
            Driver Mode
          </button>

          <button
            onClick={() => setMode("map")}
            className="text-sm text-purple-600 underline"
          >
            Live Map
          </button>
        </div>

        <AlertsPanel />

        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Universal Dispatch Control
        </h1>

        {/* CREATE JOB */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="font-semibold mb-4 text-lg">Create Job</h2>

          <form onSubmit={createJob} className="grid md:grid-cols-3 gap-3">

            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              className="border rounded px-3 py-2"
            >
              <option value="freight">Freight</option>
              <option value="delivery">Delivery</option>
              <option value="shuttle">Shuttle</option>
            </select>

            <input
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Origin"
              value={form.origin}
              onChange={e => setForm({...form, origin: e.target.value})}
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Destination"
              value={form.destination}
              onChange={e => setForm({...form, destination: e.target.value})}
              className="border rounded px-3 py-2"
            />

            <input
              type="datetime-local"
              value={form.pickup_time}
              onChange={e => setForm({...form, pickup_time: e.target.value})}
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Revenue"
              value={form.revenue}
              onChange={e => setForm({...form, revenue: e.target.value})}
              className="border rounded px-3 py-2"
            />

            <button className="bg-blue-600 text-white rounded px-4 py-2 col-span-full">
              Create Job
            </button>

          </form>
        </div>

        {/* JOB LIST */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 text-lg">Active Jobs</h2>

          {jobs.map(job => (
            <div key={job.id} className="border rounded p-4 mb-3 bg-gray-50">

              <div className="font-semibold">
                {job.type.toUpperCase()} — {job.title}
              </div>

              <div className="text-sm text-gray-600">
                {job.origin} → {job.destination}
              </div>

              <div className="text-sm">
                Revenue: ${job.revenue || 0}
              </div>

              <div className="mt-2">
                <select
                  value={job.assigned_driver_id || ""}
                  onChange={(e) => assignDriver(job.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="">Assign Driver</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.truck_number}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          ))}

          {jobs.length === 0 &&
            <p className="text-gray-400">No jobs yet</p>
          }

        </div>

      </div>
    </div>
  );
}
