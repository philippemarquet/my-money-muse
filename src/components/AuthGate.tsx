import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/pages/Login";

type AuthGateState =
  | { status: "loading" }
  | { status: "authed" }
  | { status: "unauthed" }
  | { status: "error"; message: string };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthGateState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;

        const authed = !!data.session;
        setState({ status: authed ? "authed" : "unauthed" });
      } catch (e: any) {
        if (!mounted) return;
        setState({
          status: "error",
          message:
            e?.message ??
            "Auth initialisatie mislukt. Controleer Supabase config (URL/anon key) en netwerk.",
        });
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({ status: session ? "authed" : "unauthed" });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Laden…</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-lg w-full rounded-2xl bg-card shadow-sm p-6 text-left">
          <h1 className="text-xl font-serif font-semibold">Authenticatie fout</h1>
          <p className="text-muted-foreground mt-2">
            {state.message}
          </p>
          <p className="text-muted-foreground mt-4 text-sm">
            Tip: dit gebeurt vaak als de Supabase URL/anon key niet beschikbaar is in de runtime
            (Lovable/Vercel secrets). De app kan dan geen sessie ophalen.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "unauthed") {
    return <Login />;
  }

  return <>{children}</>;
}
