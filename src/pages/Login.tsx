import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function signUp() {
    setBusy(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      // profile upsert
      await supabase.from("profiles").upsert({ id: data.user.id, email });
    }
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="border-0 shadow-sm rounded-2xl w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-serif font-semibold">BudgetFlow</h1>
            <p className="text-muted-foreground mt-1">Log in om je financiën te beheren</p>
          </div>

          <form onSubmit={signIn} className="space-y-3">
            <Input
              className="rounded-xl border-0 bg-card shadow-sm"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              className="rounded-xl border-0 bg-card shadow-sm"
              placeholder="Wachtwoord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button disabled={busy} type="submit" className="rounded-xl flex-1">Inloggen</Button>
              <Button disabled={busy} type="button" variant="secondary" className="rounded-xl" onClick={signUp}>
                Registreren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
