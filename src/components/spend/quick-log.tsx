import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";
import { playChimeSound } from "@/lib/sound";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_MAIN_CATEGORIES,
  FOOTER_QUICK_CATEGORY,
  getCustomCategories,
  type CategoryItem,
} from "@/lib/categories";

export function QuickLog() {
  const { addExpense, notify, remaining, currencySymbol, session, profile } = useSpend();
  const navigate = useNavigate();

  const [customCats, setCustomCats] = useState<CategoryItem[]>([]);
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState<{ amount: number; category: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inline auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const quickAmounts = currencySymbol === "₹" ? [50, 100, 200, 500] : [5, 10, 20, 50];

  // Load custom categories from settings
  useEffect(() => {
    setCustomCats(getCustomCategories());
    const onUpdated = () => setCustomCats(getCustomCategories());
    window.addEventListener("qs-categories-updated", onUpdated);
    return () => window.removeEventListener("qs-categories-updated", onUpdated);
  }, []);

  useEffect(() => {
    // Auto-focus amount field on launch
    if (!loggedSuccess && !showAuthModal) {
      inputRef.current?.focus();
    }
  }, [loggedSuccess, showAuthModal]);

  const closePopup = () => {
    try {
      window.close();
    } catch {}
    navigate({ to: "/", replace: true });
  };

  const handleInlineSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setShowAuthModal(false);
      setAuthPassword("");
      notify("Signed in to your account!");
    }
  };

  const allMainCategories = [...DEFAULT_MAIN_CATEGORIES, ...customCats];
  const numAmount = parseFloat(amount) || 0;
  const projectedRemaining = remaining - numAmount;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      notify("Please enter a valid amount above zero");
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    playChimeSound();

    const selectedCat =
      category === FOOTER_QUICK_CATEGORY.name
        ? FOOTER_QUICK_CATEGORY
        : allMainCategories.find((c) => c.name === category);

    addExpense({
      name: note.trim() || category,
      category,
      amount: numAmount,
      icon: selectedCat?.icon ?? "receipt_long",
    });

    setLoggedSuccess({ amount: numAmount, category });
    setSaving(false);
  };

  const handleLogAnother = () => {
    setLoggedSuccess(null);
    setAmount("");
    setNote("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div
      className="w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
    >
      {/* Top Bar: Title & UA Account Status & Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Icon name="bolt" className="text-lg" />
          </div>
          <div>
            <h2 id="quick-log-title" className="text-base font-semibold text-foreground leading-tight">
              Quick Log
            </h2>
            <p className="text-xs text-muted-foreground">Instant pop-up expense logger</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <div
              title={`Logged in as ${session.user.email}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium max-w-[130px] truncate"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{profile?.display_name || session.user.email?.split("@")[0]}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Icon name="login" className="text-xs" />
              <span>Sign in to UA</span>
            </button>
          )}

          <button
            type="button"
            onClick={closePopup}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Inline Sign-in Modal for isolated shortcut Web Views */}
      {showAuthModal && (
        <div className="p-4 rounded-2xl bg-secondary/80 border border-primary/40 flex flex-col gap-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Icon name="account_circle" className="text-primary text-base" />
              <span>Sign in with your User Account (UA)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleInlineSignIn} className="flex flex-col gap-2.5">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background/80 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              placeholder="Your password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background/80 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />

            {authError && (
              <p className="text-[11px] text-destructive leading-tight font-medium">{authError}</p>
            )}

            <Button
              type="submit"
              variant="save"
              disabled={authBusy}
              className="w-full py-2 text-xs font-semibold cursor-pointer"
            >
              {authBusy ? "Signing in…" : "Sign In to UA"}
            </Button>
          </form>
        </div>
      )}

      {/* If just logged, show success card */}
      {loggedSuccess ? (
        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Icon name="check_circle" className="text-4xl text-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-foreground">Expense Logged!</h3>
            <p className="text-sm text-emerald-400 font-semibold">
              {currencySymbol}{loggedSuccess.amount.toFixed(2)} for {loggedSuccess.category}
            </p>
            <p className="text-xs text-muted-foreground">
              New Remaining Balance:{" "}
              <span className="font-bold text-foreground font-mono">
                {currencySymbol}{remaining.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full mt-2">
            <Button
              type="button"
              variant="action"
              onClick={handleLogAnother}
              className="flex-1 py-3 text-sm font-semibold cursor-pointer"
            >
              <Icon name="add" />
              Log Another
            </Button>
            <Button
              type="button"
              variant="save"
              onClick={closePopup}
              className="flex-1 py-3 text-sm font-semibold cursor-pointer"
            >
              <Icon name="done_all" />
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Card showing Remaining Balance */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Remaining Balance
              </span>
              <span className="text-2xl font-bold font-mono text-primary leading-tight">
                {currencySymbol}{remaining.toFixed(2)}
              </span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                After Expense
              </span>
              <span
                className={`text-lg font-bold font-mono leading-tight ${
                  projectedRemaining < 0 ? "text-destructive" : "text-primary/90"
                }`}
              >
                {projectedRemaining < 0 ? "-" : ""}{currencySymbol}{Math.abs(projectedRemaining).toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Step 1: Choose Category */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Select Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {allMainCategories.map((c) => {
                  const isSelected = category === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary font-semibold shadow-sm scale-[1.02]"
                          : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border"
                      }`}
                    >
                      <Icon name={c.icon} className={`text-xl mb-1 ${isSelected ? "text-primary" : ""}`} />
                      <span className="text-xs leading-none truncate w-full">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Enter Amount */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Enter Amount
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-2xl font-bold font-mono text-primary pointer-events-none">
                  {currencySymbol}
                </span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-secondary/60 border border-border rounded-xl text-3xl font-bold font-mono text-foreground tracking-tight focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left"
                />
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground mr-1">Quick:</span>
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q.toString())}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-secondary/80 border border-border/70 hover:border-primary hover:text-primary transition-all cursor-pointer"
                  >
                    {currencySymbol}{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-border transition-colors"
              />
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              variant="save"
              disabled={saving || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 rounded-xl mt-1 shadow-md cursor-pointer"
            >
              <Icon name="check_circle" className="text-xl" />
              Save to Logger
            </Button>
          </form>

          {/* Footer: Quick Coffee Action & Settings Extra Configuration */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setCategory(FOOTER_QUICK_CATEGORY.name);
                inputRef.current?.focus();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                category === FOOTER_QUICK_CATEGORY.name
                  ? "bg-primary/20 border-primary text-primary font-semibold"
                  : "bg-secondary/40 border-border/60 hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon name={FOOTER_QUICK_CATEGORY.icon} className="text-base" />
              <span>☕ Coffee</span>
            </button>

            <Link
              to="/settings"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="tune" className="text-sm" />
              <span>+ Add Extra in Settings</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
