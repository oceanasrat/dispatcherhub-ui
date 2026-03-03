import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import StatusBadge from "./components/StatusBadge";
import Spinner from "./components/Spinner";
import { fmtMoney } from "./utils/format";

const STATUS = ["booked","in_transit","delivered","invoiced","paid"];

export default function App() {
  const [tab, setTab] = useState("loads");
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">DispatcherHub</h1>

        <nav className="mb-6 flex gap-2">
          <button onClick={() => setTab("loads")} className={`px-3 py-2 rounded border ${tab==="loads"?"bg-black text-white":"bg-white"}`}>Loads</button>
          <button onClick={() => setTab("invoices")} className={`px-3 py-2 rounded border ${tab==="invoices"?"bg-black text-white":"bg-white"}`}>Invoices</button>
        </nav>

        {tab === "loads" ? <LoadsView/> : <InvoicesView/>}

        <div className="mt-6 text-xs text-gray-500">
          Connected: {import.meta.env.VITE_SUPABASE_URL?.replace("https://","").slice(0,22)}…
        </div>
      </div>
    </div>
  );
}

function LoadsView() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ origin:"", destination:"", rate:"", status:"booked" });

  async function fetchLoads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("loads")
      .select("id, origin, destination, rate, status, truck_id, dispatcher_id")
      .order("id", { ascending: true });
    if (error) setMsg(error.message);
    setLoads(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setMsg("");
    const { data, error } = await supabase
      .from("loads")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();
    if (error) setMsg(error.message);
    else { setMsg(`Updated load ${data.id} -> ${data.status}`); fetchLoads(); }
  }

  async function createLoad(e) {
    e.preventDefault();
    setMsg("");
    const rateNum = Number(form.rate);
    if (!form.origin || !form.destination || Number.isNaN(rateNum)) {
      setMsg("Please enter origin, destination, and a valid rate.");
      return;
    }
    const payload = { origin: form.origin, destination: form.destination, rate: rateNum, status: form.status };
    const { data, error } = await supabase.from("loads").insert(payload).select("id").single();
    if (error) setMsg(error.message);
    else {
      setMsg(`Created load ${data.id}`);
      setForm({ origin:"", destination:"", rate:"", status:"booked" });
      fetchLoads();
    }
  }

  useEffect(() => { fetchLoads(); }, []);

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={createLoad} className="bg-white rounded border p-4 grid md:grid-cols-5 gap-3">
        <input value={form.origin} onChange={e=>setForm(f=>({...f, origin:e.target.value}))} className="border rounded px-3 py-2" placeholder="Origin" />
        <input value={form.destination} onChange={e=>setForm(f=>({...f, destination:e.target.value}))} className="border rounded px-3 py-2" placeholder="Destination" />
        <input value={form.rate} onChange={e=>setForm(f=>({...f, rate:e.target.value}))} className="border rounded px-3 py-2" placeholder="Rate (USD)" />
        <select value={form.status} onChange={e=>setForm(f=>({...f, status:e.target.value}))} className="border rounded px-3 py-2">
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white">Create Load</button>
      </form>

      <div className="mb-2 flex items-center gap-3">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={fetchLoads} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        {msg && <span className="text-sm text-blue-700">{msg}</span>}
      </div>

      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Origin</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loads.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>
                <td className="p-3">{row.origin}</td>
                <td className="p-3">{row.destination}</td>
                <td className="p-3">{fmtMoney(row.rate)}</td>
                <td className="p-3"><StatusBadge value={row.status} /></td>
                <td className="p-3">
                  <select className="border rounded px-2 py-1 mr-2" value={row.status}
                          onChange={(e) => updateStatus(row.id, e.target.value)}>
                    {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="px-3 py-1 border rounded" onClick={() => updateStatus(row.id, "delivered")}>
                    Mark Delivered
                  </button>
                </td>
              </tr>
            ))}
            {!loading && loads.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan="6">No loads found.</td></tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4"><Spinner label="Loading loads..." /></div>}
      </div>
    </div>
  );
}

function InvoicesView() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function fetchInvoices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("id, load_id, amount, factoring, paid_at, created_at")
      .order("id", { ascending: true });
    if (error) setMsg(error.message);
    setInvoices(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={fetchInvoices} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        {msg && <span className="text-sm text-blue-700">{msg}</span>}
      </div>

      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Load</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Factoring</th>
              <th className="p-3">Paid At</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>
                <td className="p-3">{row.load_id}</td>
                <td className="p-3">{fmtMoney(row.amount)}</td>
                <td className="p-3">{row.factoring ? "Yes" : "No"}</td>
                <td className="p-3">{row.paid_at ?? "-"}</td>
                <td className="p-3">{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan="6">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4"><Spinner label="Loading invoices..." /></div>}
      </div>
      <p className="text-xs text-gray-500">Tip: Changing a load to "invoiced" should auto-create an invoice if the DB trigger is active.</p>
    </div>
  );
}
