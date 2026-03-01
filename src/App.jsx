import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const STATUS = ["booked","in_transit","delivered","invoiced","paid"];

export default function App() {
  const [loads,setLoads] = useState([]);
  const [form,setForm] = useState({origin:"",destination:"",rate:"",status:"booked"});
  const [msg,setMsg] = useState("");

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

  useEffect(()=>{ fetchLoads(); },[]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          DispatcherHub PRO
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-6">

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-4">Create Load</h2>

            <form onSubmit={createLoad} className="space-y-3">
              <input placeholder="Origin"
                value={form.origin}
                onChange={e=>setForm({...form,origin:e.target.value})}
              />
              <input placeholder="Destination"
                value={form.destination}
                onChange={e=>setForm({...form,destination:e.target.value})}
              />
              <input placeholder="Rate"
                value={form.rate}
                onChange={e=>setForm({...form,rate:e.target.value})}
              />
              <select
                value={form.status}
                onChange={e=>setForm({...form,status:e.target.value})}
              >
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>

              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full">
                Create
              </button>
            </form>

            {msg && <p className="text-sm text-blue-600 mt-2">{msg}</p>}
          </div>

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
                    className="bg-white"
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
