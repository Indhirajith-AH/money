import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Icon, Modal, useSpend, type Expense } from "@/components/spend-shell";
import { computePace, spendByCategory } from "@/lib/money";
import { expenseImages } from "./reference-images";
const thisMonth = (iso?: string) => {
  if (!iso) return true;
  const d = new Date(iso);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};
export function Today() {
  const { expenses, remaining, dailyAllowance, removeExpense, editExpense, profile, budgets, setBudget } = useSpend();
  const [tile, setTile] = useState(true);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [capEdit, setCapEdit] = useState<{ category: string; cap: string } | null>(null);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthItems = expenses.filter((e) => thisMonth(e.spentAt));
  const monthBudget = profile?.monthly_budget ?? dailyAllowance * computePace(1, 0).daysInMonth;
  const pace = computePace(monthBudget, monthItems.reduce((s, e) => s + e.amount, 0));
  const byCat = spendByCategory(monthItems);
  const tone = pace.status === "on-track" ? "success" : "pink";
  return (
    <main className="page today-page stack">
      <div className={`panel high row between ${pace.status !== "on-track" ? "alert-panel" : ""}`} role={pace.status !== "on-track" ? "alert" : undefined}>
        <div className="row">
          <div className="icon-disc">
            <Icon name={pace.status === "on-track" ? "trending_up" : "warning"} />
          </div>
          <div>
            <div className={`label uppercase ${pace.status === "on-track" ? "mint" : "pink"}`}>Pace Alert</div>
            <div className="small">
              {pace.status === "over" ? (
                <>Monthly budget is used up — <strong className="mono pink">${(pace.spent - monthBudget).toFixed(2)}</strong> over</>
              ) : pace.status === "warning" ? (
                <>At ${pace.velocity.toFixed(2)}/day you run out on <strong className="pink">day {pace.runsOutOnDay}</strong>. Keep to <strong className="mono mint">${pace.safeDaily.toFixed(2)}/day</strong></>
              ) : (
                <>On track — month-end projection <strong className="mono mint">${pace.projected.toFixed(2)}</strong> of ${monthBudget.toFixed(0)}</>
              )}
            </div>
          </div>
        </div>
        <span className={`badge ${tone}`}>{pace.status === "on-track" ? "Optimal" : pace.status === "warning" ? "Too fast" : "Over"}</span>
      </div>
      <section className="panel allowance">
        <div className="row between w-full">
          <span className="label uppercase row">
            <i className="dot" />
            Today's Allowance
          </span>
          <span className="badge mint">Day 14 of 30</span>
        </div>
        <div className="gauge">
          <svg viewBox="0 0 160 160">
            <circle className="gauge-track" cx="80" cy="80" r="66" fill="none" strokeWidth="10" />
            <circle
              className="gauge-fill"
              cx="80"
              cy="80"
              r="66"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="414.69"
              strokeDashoffset={414.69 * (1 - Math.max(0, Math.min(1, remaining / dailyAllowance)))}
            />
          </svg>
          <div className="gauge-text">
            <span className="label uppercase">Remaining</span>
            <div className="money">
              <span className="symbol">$</span>
              {remaining.toFixed(2)}
            </div>
            <div className="row label">
              <span>of ${dailyAllowance.toFixed(2)}</span>
              <span>·</span>
              <strong className="mint">{Math.round((remaining / dailyAllowance) * 100)}% Safe</strong>
            </div>
          </div>
        </div>
        <div className="status-pill">
          <Icon name="verified" className="mint" />
          Under daily budget by <strong className="mono mint">$18.20</strong>
        </div>
      </section>
      <section className="panel">
        <div className="row between">
          <div>
            <div className="label uppercase">Cycle Reserve</div>
            <div className="row">
              <strong className="mono">$1,420.00</strong>
              <span className="label">/ $2,250.00</span>
            </div>
          </div>
          <div className="text-right">
            <div className="label uppercase">Velocity Window</div>
            <strong className="mono mint">16 days left</strong>
          </div>
        </div>
        <div className="progress">
          <progress value="63" max="100" aria-label="Cycle reserve" />
        </div>
      </section>
      <section className="panel stack">
        <div className="row between">
          <h2>Category Budgets</h2>
          <span className="label">This month</span>
        </div>
        <div className="cat-gauges">
          {["Food & Drink", "Groceries", "Entertainment", "Coffee", "Transit", "Shopping", "Bills"]
            .filter((c, i) => i < 3 || budgets[c])
            .map((c) => {
              const cap = budgets[c];
              const spent = byCat[c] ?? 0;
              const ratio = cap ? spent / cap : 0;
              const label = c === "Food & Drink" ? "Dining" : c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`cat-gauge ${ratio >= 1 ? "over" : ratio >= 0.8 ? "near" : ""}`}
                  aria-label={`${label} budget: $${spent.toFixed(2)} of ${cap ? "$" + cap : "no cap"}. Tap to set cap`}
                  onClick={() => setCapEdit({ category: c, cap: cap ? String(cap) : "" })}
                >
                  <svg viewBox="0 0 60 60">
                    <circle className="gauge-track" cx="30" cy="30" r="24" fill="none" strokeWidth="6" />
                    <circle
                      className="gauge-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 * (1 - Math.min(1, ratio))}
                    />
                  </svg>
                  <span className="cat-pct mono">{cap ? `${Math.round(ratio * 100)}%` : "—"}</span>
                  <span className="label">{label}</span>
                  <span className="small mono">
                    ${spent.toFixed(0)}
                    {cap ? ` / $${cap}` : " · set cap"}
                  </span>
                </button>
              );
            })}
        </div>
      </section>
      <section className="panel high row between">
        <div className="row grow">
          <div className="icon-disc">
            <Icon name="touch_app" />
          </div>
          <div>
            <div className="strong">Phone shortcut</div>
            <div className="small muted">Install QuickSpend, then long-press its icon for Quick Log</div>
          </div>
        </div>
        <Link to="/settings" className="label mint">
          Set up
        </Link>
      </section>
      <section className="activity">
        <div className="row between mb-1">
          <div className="row">
            <h2>Today's Activity</h2>
            <span className="badge">{expenses.length} Logged</span>
          </div>
          <span className="label">-${total.toFixed(2)} total</span>
        </div>
        {expenses.map((e) => (
          <div key={e.id} className="panel expense row between">
            <div className="row grow">
              <div className="expense-thumb">
                {typeof e.id === "number" && e.id <= 3 && <img src={expenseImages[e.id - 1]} alt={e.category} />}
                <Icon name={e.icon} />
              </div>
              <div className="grow">
                <div className="expense-name">{e.name}</div>
                <div className="row mt-1">
                  <span className="label">{e.time}</span>
                  <span className="label">·</span>
                  <span className={`badge ${e.category === "Coffee" ? "pink" : "success"}`}>
                    {e.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="expense-right">
              <strong className="mono pink">- ${e.amount.toFixed(2)}</strong>
              <div>
                <Button
                  variant="glyph"
                  aria-label={`Edit ${e.name}`}
                  onClick={() => {
                    setEditing(e);
                    setName(e.name);
                    setCategory(e.category);
                    setAmount(String(e.amount));
                  }}
                >
                  <Icon name="more_horiz" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <div className="row justify-center label mt-3">
          <Icon name="swipe_left" />
          Swipe left on any line item to categorize or refund
        </div>
      </section>
      {editing && (
        <Modal title="Edit transaction" onClose={() => setEditing(null)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (Number(amount) <= 0) return;
              editExpense(editing.id, name, category, Number(amount));
              setEditing(null);
            }}
          >
            <label className="stack small">
              Name
              <input
                className="field"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="stack small">
              Category
              <select
                className="field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "Coffee",
                  "Transit",
                  "Food & Dining",
                  "Food & Drink",
                  "Shopping",
                  "Groceries",
                  "Bills",
                  "Entertainment",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="stack small">
              Amount
              <input
                className="field"
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="row between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  removeExpense(editing.id);
                  setEditing(null);
                }}
              >
                <Icon name="undo" />
                Refund
              </Button>
              <Button type="submit">
                <Icon name="check" />
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {capEdit && (
        <Modal title={`${capEdit.category} monthly cap`} onClose={() => setCapEdit(null)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              setBudget(capEdit.category, Number(capEdit.cap) || null);
              setCapEdit(null);
            }}
          >
            <label className="stack small">
              Cap per month ($) — leave empty to remove
              <input
                className="field"
                type="number"
                min="0"
                step="1"
                value={capEdit.cap}
                onChange={(e) => setCapEdit({ ...capEdit, cap: e.target.value })}
              />
            </label>
            <Button type="submit">
              <Icon name="check" />
              Save cap
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
