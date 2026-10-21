import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`icon ${className}`}>
      {name}
    </span>
  );
}
export type Expense = {
  id: number | string;
  spentAt?: string;
  name: string;
  category: string;
  amount: number;
  time: string;
  image?: string;
  icon: string;
};
const referenceImages = {
  logo: "/apple-touch-icon.png",
  profile:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKtR-lnXIVAaLLur7Ewk5eC-4GzVG-N8r1W9VXZUoPm0YjqexwTTlXwlpJHBbx7RGOTsgLt1BMEXk4Cb7umCZjFiUAOtaMKueXZuFoK3hRykw7PLMsU2gWkpf4epaK6SW2ieg2BXYkx7vK4hG6ePiO2R1q0Ema7RwDeKDhwTv6DftEYCGbTMdOFdyPJ7E_K11R9ZoVUUeLRL7osUPczkJjE2KxSWy2cDQG3fdKRhMvWPGalY6AI7gy",
};
const initial: Expense[] = [];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

export type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_budget: number;
};
export type SpendContext = {
  expenses: Expense[];
  remaining: number;
  dailyAllowance: number;
  currency: string;
  currencySymbol: string;
  formatMoney: (amount: number) => string;
  session: Session | null;
  profile: Profile | null;
  synced: boolean;
  addExpense: (e: Omit<Expense, "id" | "time">) => void;
  removeExpense: (id: Expense["id"]) => void;
  editExpense: (id: Expense["id"], name: string, category: string, amount: number) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  budgets: Record<string, number>;
  setBudget: (category: string, cap: number | null) => void;
  online: boolean;
  pending: number;
  signOut: () => Promise<void>;
  notify: (message: string) => void;
};
type Row = {
  id: string;
  name: string;
  category: string;
  icon: string;
  amount: number;
  spent_at: string;
};
const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const toExpense = (r: Row): Expense => ({
  id: r.id,
  name: r.name,
  category: r.category,
  icon: r.icon,
  amount: Number(r.amount),
  spentAt: r.spent_at,
  time: fmtTime(new Date(r.spent_at)),
});
export function dailyAllowanceFor(monthlyBudget: number, date = new Date()) {
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return monthlyBudget / days;
}
const isToday = (iso?: string) => {
  if (!iso) return true;
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
};
type ExpenseDraft = { name: string; category: string; icon: string; amount: number; spent_at: string };
export type Op =
  | { type: "expense"; row: ExpenseDraft }
  | { type: "profile"; patch: Partial<Profile> }
  | { type: "budget"; category: string; cap: number | null };
const demoBudgets: Record<string, number> = {};
async function runOp(op: Op, userId: string): Promise<boolean> {
  try {
    if (op.type === "expense") {
      const { error } = await supabase.from("expenses").insert({ user_id: userId, ...op.row });
      return !error;
    }
    if (op.type === "profile") {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...op.patch, updated_at: new Date().toISOString() });
      return !error;
    }
    if (op.cap && op.cap > 0) {
      const { error } = await supabase
        .from("category_budgets")
        .upsert({ user_id: userId, category: op.category, cap: op.cap, updated_at: new Date().toISOString() });
      return !error;
    }
    const { error } = await supabase.from("category_budgets").delete().eq("category", op.category);
    return !error;
  } catch {
    return false;
  }
}
const Context = createContext<SpendContext | null>(null);
export function SpendProvider({ children }: { children: ReactNode }) {
  const [demoExpenses, setDemoExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem("qs-demo-expenses");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [demoProfile, setDemoProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem("qs-demo-profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { display_name: null, avatar_url: null, currency: "INR", monthly_budget: 0 };
  });
  const [cloudExpenses, setCloudExpenses] = useState<Expense[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState("");
  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }, []);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: d }) => setSession(d.session));
    return () => data.subscription.unsubscribe();
  }, []);
  const userId = session?.user.id;
  const [budgets, setBudgets] = useState<Record<string, number>>(demoBudgets);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<Op[]>([]);
  const [reload, setReload] = useState(0);
  const enqueue = (op: Op) => {
    setQueue((q) => {
      const n = [...q, op];
      if (userId) localStorage.setItem(`qs-queue-${userId}`, JSON.stringify(n));
      return n;
    });
  };
  // Load the local copy first (works offline), then refresh from the cloud.
  useEffect(() => {
    if (!userId) {
      setCloudExpenses([]);
      setProfile(null);
      setBudgets(demoBudgets);
      setQueue([]);
      return;
    }
    try {
      const c = JSON.parse(localStorage.getItem(`qs-cache-${userId}`) ?? "null");
      if (c) {
        setCloudExpenses(c.expenses ?? []);
        setProfile(c.profile ?? null);
        setBudgets(c.budgets ?? {});
      }
      setQueue(JSON.parse(localStorage.getItem(`qs-queue-${userId}`) ?? "[]"));
    } catch {
      /* ignore broken cache */
    }
    if (!navigator.onLine) return;
    let live = true;
    (async () => {
      const [{ data: p, error: pe }, { data: rows, error: re }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("display_name,avatar_url,currency,monthly_budget").eq("id", userId).maybeSingle(),
        supabase.from("expenses").select("id,name,category,icon,amount,spent_at").order("spent_at", { ascending: false }).limit(1000),
        supabase.from("category_budgets").select("category,cap"),
      ]);
      if (!live || pe || re) return;
      const pending: Op[] = JSON.parse(localStorage.getItem(`qs-queue-${userId}`) ?? "[]");
      const localRows = pending.flatMap((o, i) => (o.type === "expense" ? [toExpense({ ...o.row, id: `local-${i}` })] : []));
      setProfile(p ? { ...p, monthly_budget: Number(p.monthly_budget) } : { display_name: null, avatar_url: null, currency: "INR", monthly_budget: 0 });
      setCloudExpenses([...localRows, ...(rows ?? []).map((r) => toExpense(r as Row))]);
      setBudgets(Object.fromEntries((b ?? []).map((x) => [x.category, Number(x.cap)])));
    })();
    return () => {
      live = false;
    };
  }, [userId, reload]);
  // Keep the local copy fresh.
  useEffect(() => {
    if (userId) localStorage.setItem(`qs-cache-${userId}`, JSON.stringify({ expenses: cloudExpenses, profile, budgets }));
  }, [userId, cloudExpenses, profile, budgets]);
  // Sync queued changes when the connection returns.
  useEffect(() => {
    setOnline(navigator.onLine);
    const flush = async () => {
      setOnline(true);
      if (!userId) return;
      const pending: Op[] = JSON.parse(localStorage.getItem(`qs-queue-${userId}`) ?? "[]");
      if (!pending.length) return;
      const left: Op[] = [];
      for (const op of pending) if (!(await runOp(op, userId))) left.push(op);
      localStorage.setItem(`qs-queue-${userId}`, JSON.stringify(left));
      setQueue(left);
      if (left.length < pending.length) {
        notify("Back online — changes synced");
        setReload((r) => r + 1);
      }
    };
    const off = () => setOnline(false);
    window.addEventListener("online", flush);
    window.addEventListener("offline", off);
    if (navigator.onLine) flush();
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener("offline", off);
    };
  }, [userId, notify]);
  const synced = !!userId;
  const activeProfile = synced ? profile : demoProfile;
  const currency = activeProfile?.currency || "INR";
  const currencySymbol = CURRENCY_SYMBOLS[currency] || "₹";

  const formatMoney = useCallback(
    (n: number) => {
      const sym = CURRENCY_SYMBOLS[currency] || "₹";
      const loc = currency === "INR" ? "en-IN" : "en-US";
      return `${sym}${Number(n || 0).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [currency],
  );

  const monthlyBudget = activeProfile?.monthly_budget ?? 0;
  const dailyAllowance = monthlyBudget > 0 ? dailyAllowanceFor(monthlyBudget) : 0;
  const expenses = synced ? cloudExpenses : demoExpenses;
  const todaySpent = expenses.filter((e) => isToday(e.spentAt)).reduce((s, e) => s + e.amount, 0);
  const remaining = dailyAllowance - todaySpent;

  const addExpense = (e: Omit<Expense, "id" | "time">) => {
    if (synced && userId) {
      const spent_at = new Date().toISOString();
      const row = { name: e.name, category: e.category, icon: e.icon, amount: e.amount, spent_at };
      const saveLocal = () => {
        const local: Row = { ...row, id: "local-" + Date.now() };
        setCloudExpenses((a) => [toExpense(local), ...a]);
        enqueue({ type: "expense", row });
        notify("Saved offline — will sync when back online");
      };
      if (!navigator.onLine) return saveLocal();
      supabase
        .from("expenses")
        .insert({ user_id: userId, ...row })
        .select("id,name,category,icon,amount,spent_at")
        .single()
        .then(({ data, error }) => {
          if (error || !data) return saveLocal();
          setCloudExpenses((a) => [toExpense(data as Row), ...a]);
          notify("Expense Recorded!");
        });
      return;
    }
    const newExp: Expense = { ...e, id: Date.now(), time: fmtTime(new Date()), spentAt: new Date().toISOString() };
    setDemoExpenses((a) => {
      const updated = [newExp, ...a];
      try {
        localStorage.setItem("qs-demo-expenses", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify("Expense Recorded!");
  };
  const removeExpense = (id: Expense["id"]) => {
    const e = expenses.find((x) => x.id === id);
    if (!e) return;
    if (synced) {
      setCloudExpenses((a) => a.filter((x) => x.id !== id));
      supabase.from("expenses").delete().eq("id", String(id)).then(({ error }) => {
        if (error) {
          setCloudExpenses((a) => [e, ...a]);
          notify("Couldn't refund — try again");
        } else notify("Expense refunded");
      });
      return;
    }
    setDemoExpenses((a) => {
      const updated = a.filter((x) => x.id !== id);
      try {
        localStorage.setItem("qs-demo-expenses", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify("Expense refunded");
  };
  const editExpense = (id: Expense["id"], name: string, category: string, amount: number) => {
    const e = expenses.find((x) => x.id === id);
    if (!e) return;
    if (synced) {
      setCloudExpenses((a) => a.map((x) => (x.id === id ? { ...x, name, category, amount } : x)));
      supabase.from("expenses").update({ name, category, amount }).eq("id", String(id)).then(({ error }) => {
        notify(error ? "Couldn't update — try again" : "Expense updated");
      });
      return;
    }
    setDemoExpenses((a) => {
      const updated = a.map((x) => (x.id === id ? { ...x, name, category, amount } : x));
      try {
        localStorage.setItem("qs-demo-expenses", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify("Expense updated");
  };
  const updateProfile = async (patch: Partial<Profile>) => {
    if (!userId) {
      setDemoProfile((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem("qs-demo-profile", JSON.stringify(next));
        } catch {}
        return next;
      });
      notify("Profile updated");
      return;
    }
    setProfile((p) => (p ? { ...p, ...patch } : p));
    if (!navigator.onLine) return enqueue({ type: "profile", patch });
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...patch, updated_at: new Date().toISOString() });
    if (error) enqueue({ type: "profile", patch });
  };
  const setBudget = (category: string, cap: number | null) => {
    setBudgets((b) => {
      const n = { ...b };
      if (cap && cap > 0) n[category] = cap;
      else delete n[category];
      if (!userId) {
        try {
          localStorage.setItem("qs-demo-budgets", JSON.stringify(n));
        } catch {}
      }
      return n;
    });
    if (!userId) return;
    const op: Op = { type: "budget", category, cap };
    if (!navigator.onLine) return enqueue(op);
    runOp(op, userId).then((ok) => !ok && enqueue(op));
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    notify("Signed out");
  };
  return (
    <Context.Provider
      value={{
        expenses,
        remaining,
        dailyAllowance,
        currency,
        currencySymbol,
        formatMoney,
        session,
        profile: activeProfile,
        synced,
        addExpense,
        removeExpense,
        editExpense,
        updateProfile,
        signOut,
        notify,
        budgets,
        setBudget,
        online,
        pending: queue.length,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check_circle" />
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export function useSpend() {
  const c = useContext(Context);
  if (!c) throw new Error("Spend provider missing");
  return c;
}
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { session, profile, online, pending } = useSpend();
  const [verifiedModal, setVerifiedModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isSignupVerified =
      urlParams.get("verified") === "true" ||
      urlParams.get("type") === "signup" ||
      hash.includes("type=signup") ||
      hash.includes("type=email_change") ||
      hash.includes("type=recovery") ||
      (hash.includes("access_token") && (hash.includes("signup") || hash.includes("bearer")));

    if (isSignupVerified) {
      setVerifiedModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" &&
        (window.location.hash.includes("type=signup") || window.location.search.includes("verified"))
      ) {
        setVerifiedModal(true);
      }
    });

    const syncMatch = hash.match(/sync_token=([^&]+)/);
    if (syncMatch && syncMatch[1]) {
      const refreshToken = decodeURIComponent(syncMatch[1]);
      void supabase.auth.setSession({ refresh_token: refreshToken, access_token: "" }).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    return () => {
      authSub.subscription.unsubscribe();
    };
  }, []);

  const titles: Record<string, string> = {
    "/": "Today",
    "/quick-log": "Quick Log",
    "/analytics": "Analytics",
    "/settings": "Settings",
    "/split": "Split Settlement",
    "/auth": "Account",
  };
  const links = [
    { to: "/" as const, name: "Today", icon: "dashboard" },
    { to: "/split" as const, name: "Split", icon: "call_split" },
    { to: "/quick-log" as const, name: "Quick Log", icon: "bolt" },
    { to: "/analytics" as const, name: "Analytics", icon: "insights" },
    { to: "/settings" as const, name: "Settings", icon: "tune" },
  ];
  const isQuickLog = pathname === "/quick-log";

  const verifiedBanner = verifiedModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-card border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-center stack animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1 border border-emerald-500/40">
          <Icon name="verified" className="text-3xl text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Welcome to QuickSpend!</h2>
        <p className="text-sm font-semibold text-emerald-400">
          Your email has been verified successfully.
        </p>
        <p className="small muted">
          Your account is active and your expenses will sync across all your devices.
        </p>
        <div className="mt-3">
          <Button
            variant="save"
            className="w-full py-3 text-base font-semibold cursor-pointer"
            onClick={() => setVerifiedModal(false)}
          >
            <Icon name="check_circle" />
            Start Logging
          </Button>
        </div>
      </div>
    </div>
  );

  if (isQuickLog) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
        {verifiedBanner}
        {children}
      </main>
    );
  }

  return (
    <>
      {verifiedBanner}
      {(!online || pending > 0) && (
        <div className="offline-bar" role="status">
          <Icon name={online ? "sync" : "cloud_off"} />
          {online ? `Syncing ${pending} change${pending === 1 ? "" : "s"}…` : `Offline — saving on this device${pending ? ` (${pending} waiting)` : ""}`}
        </div>
      )}
      <header className="topbar">
        <div className="header-inner">
          <Link to="/" className="row">
            <img className="brand-logo" src={referenceImages.logo} alt="QuickSpend logo" />
            <div>
              <div className="brand-name">QuickSpend{pathname === "/split" ? " Split" : ""}</div>
              <div className="label">{titles[pathname] ?? "QuickSpend"}</div>
            </div>
          </Link>
          {session ? (
            <Link to="/settings" aria-label="Profile settings" className="profile-wrap">
              <img
                className="profile"
                src={profile?.avatar_url || referenceImages.profile}
                alt={profile?.display_name ?? "Profile"}
              />
            </Link>
          ) : (
            <Link to="/auth" className="badge success">
              <Icon name="login" />
              Sign in
            </Link>
          )}
        </div>
      </header>
      {children}
      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="nav-inner">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={pathname === l.to ? "page" : undefined}
              className={`nav-item ${pathname === l.to ? "active" : ""} ${l.to === "/quick-log" ? "quick" : ""}`}
            >
              {l.to === "/quick-log" ? (
                <div className="quick-disc">
                  <Icon name={l.icon} />
                </div>
              ) : (
                <Icon name={l.icon} />
              )}
              <span>{l.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <Button
      variant="toggle"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onChange}
    >
      <span />
    </Button>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between mb-5">
          <h2>{title}</h2>
          <Button variant="glyph" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
