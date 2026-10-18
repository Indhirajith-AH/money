import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · QuickSpend" },
      { name: "description", content: "Sign in to sync your QuickSpend expenses across devices." },
      { property: "og:title", content: "Sign in · QuickSpend" },
      { property: "og:description", content: "Sign in to sync your QuickSpend expenses across devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useSpend();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setMsg(error ? error.message : "Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  };
  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) setMsg(r.error.message ?? "Sign-in failed");
  };

  return (
    <main className="page stack">
      <section className="panel stack">
        <div className="row">
          <div className="icon-disc">
            <Icon name="cloud_sync" />
          </div>
          <div>
            <h2>{mode === "in" ? "Welcome back" : "Create your account"}</h2>
            <p className="small muted">Your expenses sync to every device you sign in on.</p>
          </div>
        </div>
        <Button variant="action" onClick={() => oauth("google")}>
          <Icon name="account_circle" />
          Continue with Google
        </Button>
        <button type="button" className="lovable-auth-button" onClick={() => oauth("lovable")}>
          Continue with Lovable
        </button>
        <div className="label uppercase text-center">or with email</div>
        <form className="stack" onSubmit={submit}>
          <input
            className="field"
            type="email"
            required
            aria-label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            type="password"
            required
            minLength={6}
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="save" type="submit" disabled={busy}>
            {mode === "in" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        {msg && <p className="small mint" role="status">{msg}</p>}
        <button type="button" className="qs-link small" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
