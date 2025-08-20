import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setMsg(error ? error.message : "Check your email for the magic link.");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">DispatcherHub – Sign in</h1>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
               required placeholder="you@example.com" className="border w-full rounded px-3 py-2"/>
        <button className="w-full bg-black text-white rounded px-3 py-2">Send magic link</button>
        {msg && <p className="text-sm text-blue-700">{msg}</p>}
        <p className="text-xs text-gray-500">A sign-in link will be emailed to you.</p>
      </form>
    </div>
  );
}
