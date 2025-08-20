import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Login from "../pages/Login";
import Spinner from "../components/Spinner";

export default function AuthWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => { sub.subscription.unsubscribe(); mounted = false; };
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner label="Checking session..." /></div>;
  if (!session) return <Login />;

  const email = session.user?.email ?? "user";
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="font-semibold">DispatcherHub</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{email}</span>
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1 border rounded">
            Sign out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
