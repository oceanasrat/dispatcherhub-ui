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
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Spinner label="Checking session..." />
      </div>
    );
  }
  if (!session) return <Login />;

  const email = session.user?.email ?? "user";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-semibold">
              D
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">DispatcherHub</div>
              <div className="text-[11px] text-slate-500">
                Mobile-first dispatcher workspace
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-xs text-slate-600 max-w-[180px] truncate">
              {email}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-2 rounded-xl border bg-white text-slate-800 text-sm shadow-sm active:scale-[.99]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
