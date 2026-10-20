import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";
import { playChimeSound } from "@/lib/sound";
import {
  DEFAULT_MAIN_CATEGORIES,
  FOOTER_QUICK_CATEGORY,
  getCustomCategories,
  type CategoryItem,
} from "@/lib/categories";

export function QuickLog() {
  const { addExpense, notify, remaining, currencySymbol } = useSpend();
  const navigate = useNavigate();

  const [customCats, setCustomCats] = useState<CategoryItem[]>([]);
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    inputRef.current?.focus();
  }, []);

  const closePopup = () => {
    navigate({ to: "/", replace: true });
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

    // Play cool chime/cash sound effect
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

    notify(`Logged ${currencySymbol}${numAmount.toFixed(2)} for ${category}!`);
    closePopup();
  };

  return (
    <div
      className="w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
    >
      {/* Top Bar: Title & Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <Icon name="bolt" className="text-lg" />
          </div>
          <div>
            <h2 id="quick-log-title" className="text-base font-semibold text-foreground leading-tight">
              Quick Log
            </h2>
            <p className="text-xs text-muted-foreground">Instant pop-up expense logger</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <Icon name="close" className="text-lg" />
        </button>
      </div>

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
    </div>
  );
}
