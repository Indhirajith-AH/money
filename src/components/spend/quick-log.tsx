import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Icon, useSpend } from "@/components/spend-shell";

const categories = [
  { name: "Coffee", icon: "local_cafe" },
  { name: "Food", icon: "restaurant" },
  { name: "Transport", icon: "directions_subway" },
  { name: "Bill", icon: "receipt_long" },
  { name: "Groceries", icon: "shopping_cart" },
  { name: "Shopping", icon: "shopping_bag" },
  { name: "Entertainment", icon: "movie" },
  { name: "Other", icon: "credit_card" },
] as const;

const quickAmounts = [5, 10, 20, 50];

export function QuickLog() {
  const { addExpense, notify, remaining } = useSpend();
  const navigate = useNavigate();

  const [category, setCategory] = useState<string>("Coffee");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically focus the amount input on mount
    inputRef.current?.focus();
  }, []);

  const closePopup = () => {
    navigate({ to: "/", replace: true });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      notify("Please enter a valid amount above zero");
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    const catObj = categories.find((c) => c.name === category);

    addExpense({
      name: note.trim() || category,
      category,
      amount: num,
      icon: catObj?.icon ?? "receipt_long",
    });

    notify(`Logged $${num.toFixed(2)} for ${category}!`);
    closePopup();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePopup();
      }}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <Icon name="bolt" className="text-lg" />
            </div>
            <div>
              <h2 id="quick-log-title" className="text-base font-semibold text-foreground leading-tight">
                Quick Log
              </h2>
              <p className="text-xs text-muted-foreground">
                Remaining today: <span className="font-semibold text-primary">${remaining.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Step 1: Choose Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Choose Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => {
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
                $
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
                className="w-full pl-9 pr-4 py-3.5 bg-secondary/60 border border-border rounded-xl text-3xl font-bold font-mono text-foreground tracking-tight focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left"
              />
            </div>

            {/* Quick Amount Suggestion Chips */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Quick:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q.toString())}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-secondary/80 border border-border/70 hover:border-primary hover:text-primary transition-all"
                >
                  ${q}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="Note (optional, e.g. Starbucks, Uber)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-border transition-colors"
            />
          </div>

          {/* Step 3: Save Button */}
          <Button
            type="submit"
            variant="save"
            disabled={saving || !amount || parseFloat(amount) <= 0}
            className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 rounded-xl mt-1 cursor-pointer"
          >
            <Icon name="check" className="text-xl" />
            Save to Logger
          </Button>
        </form>
      </div>
    </div>
  );
}
