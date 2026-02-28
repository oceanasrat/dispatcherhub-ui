import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import StatusBadge from "./components/StatusBadge";
import Spinner from "./components/Spinner";
import { fmtMoney } from "./utils/format";

const STATUS = ["booked", "in_transit", "delivered", "invoiced", "paid"];

export default function App() {
  const [tab, setTab] = useState("loads");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-5 md:py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              DispatcherHub
            </h1>
            <p className="text-sm text-slate-600">
              Loads, invoicing, and payment tracking.
            </p>
          </div>

          <div className="inline-flex rounded-xl border bg-white p-1 w-fit shadow-sm">
            <TabButton active={tab === "loads"} onClick={() => setTab("loads")}>
              Loads
            </TabButton>
            <TabButton
              active={tab === "invoices"}
              onClick={() => setTab("invoices")}
            >
              Invoices
            </TabButton>
          </div>
        </div>

        {tab === "loads" ? <LoadsView /> : <InvoicesView />}

        <div className="mt-6 text-[11px] text-slate-500">
          Connected:{" "}
          {import.meta.env.VITE_SUPABASE_URL?.replace("https://", "").slice(0, 28)}
          …
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-lg text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CardStat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function LoadsView() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    rate: "",
    status: "booked",
  });

  async function fetchLoads() {
    setLoading(true);
    setMsg("");
    const { data, error } = await supabase
      .from("loads")
      .select("id, origin, destination, rate, status, truck_id, dispatcher_id")
      .order("id", { ascending: false });
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
    else {
      setMsg(`Updated load ${data.id} → ${data.status}`);
      fetchLoads();
    }
  }

  async function createLoad(e) {
    e.preventDefault();
    setMsg("");
    const rateNum = Number(form.rate);
    if (!form.origin.trim() || !form.destination.trim() || Number.isNaN(rateNum)) {
      setMsg("Enter origin, destination, and a valid rate.");
      return;
    }
    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      rate: rateNum,
      status: form.status,
    };
    const { data, error } = await supabase
      .from("loads")
      .insert(payload)
      .select("id")
      .single();
    if (error) setMsg(error.message);
    else {
      setMsg(`Created load ${data.id}`);
      setForm({ origin: "", destination: "", rate: "", status: "booked" });
      fetchLoads();
    }
  }

  useEffect(() => {
    fetchLoads();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return loads.filter((l) => {
      const matchesQ =
        !needle ||
        `${l.id} ${l.origin} ${l.destination}`.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [loads, q, statusFilter]);

  const totals = useMemo(() => {
    const total = loads.reduce((s, l) => s + Number(l.rate ?? 0), 0);
    const paid = loads
      .filter((l) => l.status === "paid")
      .reduce((s, l) => s + Number(l.rate ?? 0), 0);
    const outstanding = total - paid;
    return { total, paid, outstanding, count: loads.length };
  }, [loads]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardStat label="Total loads" value={totals.count} />
        <CardStat label="Total revenue" value={fmtMoney(totals.total)} />
        <CardStat label="Paid" value={fmtMoney(totals.paid)} />
        <CardStat label="Outstanding" value={fmtMoney(totals.outstanding)} />
      </div>

      <form
        onSubmit={createLoad}
        className="rounded-2xl border bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={form.origin}
            onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
            className="border rounded-xl px-3 py-2"
            placeholder="Origin"
          />
          <input
            value={form.destination}
            onChange={(e) =>
              setForm((f) => ({ ...f, destination: e.target.value }))
            }
            className="border rounded-xl px-3 py-2"
            placeholder="Destination"
          />
          <input
            inputMode="decimal"
            value={form.rate}
            onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            className="border rounded-xl px-3 py-2"
            placeholder="Rate (USD)"
          />
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="border rounded-xl px-3 py-2"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium active:scale-[.99]">
            Create load
          </button>
        </div>
        {msg && <div className="mt-3 text-sm text-blue-700">{msg}</div>}
      </form>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <button
          className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm"
          onClick={fetchLoads}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        <div className="flex-1 flex flex-col md:flex-row gap-2 md:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded-xl px-3 py-2 bg-white"
            placeholder="Search by ID / origin / destination"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 bg-white"
          >
            <option value="all">All statuses</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Spinner label="Loading loads..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
            No loads found.
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">Load #{row.id}</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {row.origin} → {row.destination}
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {fmtMoney(row.rate)}
                  </div>
                </div>
                <StatusBadge value={row.status} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <select
                  className="flex-1 border rounded-xl px-3 py-2"
                  value={row.status}
                  onChange={(e) => updateStatus(row.id, e.target.value)}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className="px-3 py-2 border rounded-xl"
                  onClick={() => updateStatus(row.id, "delivered")}
                >
                  Delivered
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="text-slate-600">
              <th className="p-3">ID</th>
              <th className="p-3">Origin</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>
                <td className="p-3">{row.origin}</td>
                <td className="p-3">{row.destination}</td>
                <td className="p-3">{fmtMoney(row.rate)}</td>
                <td className="p-3">
                  <StatusBadge value={row.status} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded-xl px-2 py-1"
                      value={row.status}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      className="px-3 py-1 border rounded-xl"
                      onClick={() => updateStatus(row.id, "delivered")}
                    >
                      Mark delivered
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan="6">
                  No loads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-4">
            <Spinner label="Loading loads..." />
          </div>
        )}
      </div>
    </div>
  );
}

function InvoicesView() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  async function fetchInvoices() {
    setLoading(true);
    setMsg("");
    const { data, error } = await supabase
      .from("invoices")
      .select("id, load_id, amount, factoring, paid_at, created_at")
      .order("id", { ascending: false });
    if (error) setMsg(error.message);
    setInvoices(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices.filter((i) => {
      if (!needle) return true;
      return `${i.id} ${i.load_id}`.toLowerCase().includes(needle);
    });
  }, [invoices, q]);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const paid = invoices
      .filter((i) => i.paid_at)
      .reduce((s, i) => s + Number(i.amount ?? 0), 0);
    return { total, paid, count: invoices.length };
  }, [invoices]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CardStat label="Invoices" value={totals.count} />
        <CardStat label="Invoiced" value={fmtMoney(totals.total)} />
        <CardStat label="Paid (invoices)" value={fmtMoney(totals.paid)} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <button
          className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm"
          onClick={fetchInvoices}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        <div className="flex-1 md:flex md:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full md:max-w-sm border rounded-xl px-3 py-2 bg-white"
            placeholder="Search invoice / load id"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <Spinner label="Loading invoices..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
            No invoices yet.
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">Invoice #{row.id}</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    Load #{row.load_id}
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {fmtMoney(row.amount)}
                  </div>
                </div>
                <div className="text-xs text-slate-600 text-right">
                  <div>{row.factoring ? "Factoring: Yes" : "Factoring: No"}</div>
                  <div className="mt-1">{row.paid_at ? "Paid" : "Unpaid"}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Created:{" "}
                {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="text-slate-600">
              <th className="p-3">Invoice</th>
              <th className="p-3">Load</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Factoring</th>
              <th className="p-3">Paid At</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>
                <td className="p-3">{row.load_id}</td>
                <td className="p-3">{fmtMoney(row.amount)}</td>
                <td className="p-3">{row.factoring ? "Yes" : "No"}</td>
                <td className="p-3">
                  {row.paid_at ? new Date(row.paid_at).toLocaleDateString() : "-"}
                </td>
                <td className="p-3">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan="6">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-4">
            <Spinner label="Loading invoices..." />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Tip: changing a load to <span className="font-medium">invoiced</span>{" "}
        auto-creates an invoice if the DB trigger is active.
      </p>
    </div>
  );
}
