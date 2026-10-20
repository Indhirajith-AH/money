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
const initial: Expense[] = [
  {
    id: 1,
    name: "Artisan Espresso Bar",
    category: "Coffee",
    amount: 4.75,
    time: "12:45 PM",
    icon: "local_cafe",
  },
  {
    id: 2,
    name: "Metro Transit Card",
    category: "Transit",
    amount: 2.75,
    time: "9:15 AM",
    icon: "directions_subway",
  },
  {
    id: 3,
    name: "Avocado Toast & Matcha",
    category: "Food & Dining",
    amount: 16.5,
    time: "8:30 AM",
    icon: "restaurant",
  },
];
export type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_budget: number;
};
type SpendContext = {
  expenses: Expense[];
  remaining: number;
  dailyAllowance: number;
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
const demoBudgets: Record<string, number> = { "Food & Drink": 300, Groceries: 400, Entertainment: 150 };
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
  const [demoExpenses, setDemoExpenses] = useState(initial);
  const [demoRemaining, setDemoRemaining] = useState(34.5);
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
      setProfile(p ? { ...p, monthly_budget: Number(p.monthly_budget) } : { display_name: null, avatar_url: null, currency: "USD", monthly_budget: 1500 });
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
  const dailyAllowance = synced ? dailyAllowanceFor(profile?.monthly_budget ?? 1500) : 75;
  const expenses = synced ? cloudExpenses : demoExpenses;
  const remaining = synced
    ? dailyAllowance - cloudExpenses.filter((e) => isToday(e.spentAt)).reduce((s, e) => s + e.amount, 0)
    : demoRemaining;
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
    setDemoExpenses((a) => [{ ...e, id: Date.now(), time: fmtTime(new Date()), spentAt: new Date().toISOString() }, ...a]);
    setDemoRemaining((r) => r - e.amount);
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
    setDemoExpenses((a) => a.filter((x) => x.id !== id));
    setDemoRemaining((r) => r + e.amount);
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
    setDemoRemaining((r) => r + e.amount - amount);
    setDemoExpenses((a) => a.map((x) => (x.id === id ? { ...x, name, category, amount } : x)));
    notify("Expense updated");
  };
  const updateProfile = async (patch: Partial<Profile>) => {
    if (!userId) return;
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
      value={{ expenses, remaining, dailyAllowance, session, profile, synced, addExpense, removeExpense, editExpense, updateProfile, signOut, notify, budgets, setBudget, online, pending: queue.length }}
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

  if (isQuickLog) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <>
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
