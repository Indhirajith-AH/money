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

  const [verifiedHandled, setVerifiedHandled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isVerified =
      urlParams.get("verified") === "true" ||
      hash.includes("type=signup") ||
      hash.includes("type=email_change") ||
      hash.includes("type=recovery");

    if (isVerified) {
      setVerifiedHandled(true);
      void supabase.auth.signOut();
      setMode("in");
      setMsg("Email verified successfully! You can now sign in with your credentials.");
      setIsError(false);
      window.history.replaceState({}, document.title, "/auth");
      return;
    }

    if (session && !verifiedHandled) {
      navigate({ to: "/", replace: true });
    }
  }, [session, navigate, verifiedHandled]);

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
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });

      if (error) {
        setMsg(error.message);
        setIsError(true);
      } else if (data?.session) {
        navigate({ to: "/", replace: true });
      } else {
        setMsg("Account created! Please check your email to confirm your account before signing in.");
        setIsError(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed")) {
          setMsg("Please check your email to confirm your account before signing in.");
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

  const resendConfirmation = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setMsg(error.message);
      setIsError(true);
    } else {
      setMsg("Confirmation email resent! Please check your inbox and spam folder.");
      setIsError(false);
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
            {isError && msg.toLowerCase().includes("confirm your account") && (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={busy}
                className="mt-2 text-xs underline font-semibold text-amber-300 hover:text-amber-200 block"
              >
                Resend confirmation email to {email}
              </button>
            )}
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
