import Driver from "./Driver";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LiveMap from "./LiveMap";
const STATUS = ["booked","in_transit","delivered","invoiced","paid"];

export default function App() {

  // 🔵 MODE SWITCH
  const [mode, setMode] = useState("dispatcher");

  const [loads,setLoads] = useState([]);
  const [form,setForm] = useState({origin:"",destination:"",rate:"",status:"booked"});
  const [msg,setMsg] = useState("");

  // ✅ AI STATE
  const [aiText,setAiText] = useState("");
  const [aiResult,setAiResult] = useState("");
  const [aiLoading,setAiLoading] = useState(false);

  async function fetchLoads(){
    const {data} = await supabase.from("loads").select("*").order("id");
    setLoads(data || []);
  }

  async function createLoad(e){
    e.preventDefault();

    const {error} = await supabase.from("loads").insert({
      origin:form.origin,
      destination:form.destination,
      rate:Number(form.rate),
      status:form.status
    });

    if(error) setMsg(error.message);
    else{
      setMsg("Load Created");
      setForm({origin:"",destination:"",rate:"",status:"booked"});
      fetchLoads();
    }
  }

  async function updateStatus(id,status){
    await supabase.from("loads").update({status}).eq("id",id);
    fetchLoads();
  }

  // ✅ AI EXTRACT LOAD
  async function handleAiFill(){
    if(!aiText) return;

    setAiLoading(true);
    setAiResult("Analyzing...");

    try{
      const res = await fetch("/api/ai-load",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ text: aiText })
      });

      const data = await res.json();

      if(data.origin){
        setForm({
          origin: data.origin || "",
          destination: data.destination || "",
          rate: data.rate || "",
          status:"booked"
        });

        setAiResult(data.analysis || "Load extracted.");
      }else{
        setAiResult("AI failed.");
      }

    }catch(err){
      setAiResult("Error connecting AI.");
    }

    setAiLoading(false);
  }

  useEffect(()=>{ fetchLoads(); },[]);

  // 🔴 DRIVER MODE RETURN
  const [mode, setMode] = useState("dispatcher");

if (mode === "driver") return <Driver />;
if (mode === "map") return <LiveMap />;
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

  // 🟢 DISPATCHER UI
  return (
    <div className="min-h-screen p-6 bg-slate-100">
      <div className="max-w-6xl mx-auto">

        {/* MODE SWITCH BUTTON */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setMode("driver")}
            className="text-sm text-indigo-600 underline"
          >
            Switch to Driver Mode
          </button>
          <button
  onClick={() => setMode("map")}
  className="text-xs text-purple-600 ml-3"
>
  Live Map
</button>
        </div>

        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          DispatcherHub PRO
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-6">

          {/* ================= AI PANEL ================= */}
          <div className="bg-white p-6 rounded-2xl shadow-lg md:col-span-3">
            <h2 className="font-semibold mb-3 text-purple-600">
              AI Dispatcher Assistant
            </h2>

            <textarea
              placeholder="Paste broker message here..."
              value={aiText}
              onChange={e=>setAiText(e.target.value)}
              className="w-full p-3 border rounded-lg mb-3"
              rows="3"
            />

            <button
              onClick={handleAiFill}
              disabled={aiLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {aiLoading ? "Analyzing..." : "Extract Load With AI"}
            </button>

            {aiResult && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-slate-700">
                {aiResult}
              </div>
            )}
          </div>

          {/* ================= CREATE LOAD ================= */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-4">Create Load</h2>

            <form onSubmit={createLoad} className="space-y-3">
              <input
                className="w-full p-2 border rounded-lg"
                placeholder="Origin"
                value={form.origin}
                onChange={e=>setForm({...form,origin:e.target.value})}
              />
              <input
                className="w-full p-2 border rounded-lg"
                placeholder="Destination"
                value={form.destination}
                onChange={e=>setForm({...form,destination:e.target.value})}
              />
              <input
                className="w-full p-2 border rounded-lg"
                placeholder="Rate"
                value={form.rate}
                onChange={e=>setForm({...form,rate:e.target.value})}
              />

              <select
                className="w-full p-2 border rounded-lg"
                value={form.status}
                onChange={e=>setForm({...form,status:e.target.value})}
              >
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>

              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full py-2 rounded-lg">
                Create
              </button>
            </form>

            {msg && <p className="text-sm text-blue-600 mt-2">{msg}</p>}
          </div>

          {/* ================= LOADS LIST ================= */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-4">Loads</h2>

            <div className="space-y-3">
              {loads.map(l=>(
                <div key={l.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-semibold">{l.origin} → {l.destination}</div>
                    <div className="text-sm text-slate-500">${l.rate}</div>
                  </div>

                  <select
                    value={l.status}
                    onChange={e=>updateStatus(l.id,e.target.value)}
                    className="bg-white border rounded-lg p-1"
                  >
                    {STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              ))}

              {loads.length===0 && <p className="text-slate-400">No loads yet</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
