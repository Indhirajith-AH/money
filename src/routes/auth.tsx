import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";
import { supabase } from "@/integrations/supabase/client";

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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setIsError(false);

    const cleanEmail = email.trim();

    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: username.trim() || undefined,
          },
        },
      });

      if (error) {
        setMsg(error.message);
        setIsError(true);
      } else if (data?.session) {
        navigate({ to: "/", replace: true });
      } else {
        // Automatically attempt sign in
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (loginData?.session) {
          navigate({ to: "/", replace: true });
        } else if (loginErr) {
          if (loginErr.message.toLowerCase().includes("not confirmed")) {
            setMsg(
              "Email confirmation is enabled in your Supabase project. Turn off 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) for instant sign-up."
            );
          } else {
            setMsg(loginErr.message);
          }
          setIsError(true);
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed")) {
          setMsg(
            "Email confirmation is enabled in your Supabase project. Turn off 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) to sign in."
          );
        } else {
          setMsg(error.message);
        }
        setIsError(true);
      } else if (data?.session) {
        navigate({ to: "/", replace: true });
      }
    }
    setBusy(false);
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    setMsg("");
    setIsError(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMsg(error.message);
      setIsError(true);
      setBusy(false);
    }
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
        <Button variant="action" disabled={busy} onClick={signInWithGoogle}>
          <Icon name="account_circle" />
          Continue with Google
        </Button>
        <div className="label uppercase text-center">or with email</div>
        <form className="stack" onSubmit={submit}>
          {mode === "up" && (
            <input
              className="field"
              type="text"
              required
              aria-label="Username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
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
            placeholder="Password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="save" type="submit" disabled={busy}>
            {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        {msg && (
          <div
            className={`small rounded-lg p-3 ${
              isError
                ? "text-red-300 bg-red-950/40 border border-red-800/60"
                : "text-emerald-300 bg-emerald-950/40 border border-emerald-800/60"
            }`}
            role={isError ? "alert" : "status"}
          >
            <p>{msg}</p>
          </div>
        )}

        <button
          type="button"
          className="qs-link small"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMsg("");
          }}
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
