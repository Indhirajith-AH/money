import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, useSpend, type Expense } from "@/components/spend-shell";
const catIcon: Record<string, string> = {
  "Food & Drink": "restaurant",
  "Food & Dining": "restaurant",
  Coffee: "local_cafe",
  Groceries: "shopping_cart",
  Transit: "directions_subway",
  Shopping: "shopping_bag",
  Bills: "receipt_long",
  Entertainment: "movie",
};
type Bucket = { label: string; total: number };
export function buildAnalytics(expenses: Expense[], period: string, dailyAllowance: number, now = new Date()) {
  const dated = expenses.map((e) => ({ ...e, d: e.spentAt ? new Date(e.spentAt) : now }));
  let buckets: Bucket[] = [];
  let from: Date;
  let target: number;
  if (period === "Week") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      return { label: "SMTWTFS".charAt(d.getDay()), total: 0 };
    });
    target = dailyAllowance;
    dated.forEach((e) => {
      const i = Math.floor((e.d.getTime() - from.getTime()) / 86400000);
      if (i >= 0 && i < 7) buckets[i]!.total += e.amount;
    });
  } else if (period === "Month") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 27);
    buckets = Array.from({ length: 4 }, (_, i) => ({ label: `W${i + 1}`, total: 0 }));
    target = dailyAllowance * 7;
    dated.forEach((e) => {
      const i = Math.floor((e.d.getTime() - from.getTime()) / (7 * 86400000));
      if (i >= 0 && i < 4) buckets[i]!.total += e.amount;
    });
  } else {
    from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    buckets = Array.from({ length: 12 }, (_, i) => ({
      label: "JFMAMJJASOND".charAt((from.getMonth() + i) % 12),
      total: 0,
    }));
    target = dailyAllowance * 30;
    dated.forEach((e) => {
      const i = (e.d.getFullYear() - from.getFullYear()) * 12 + e.d.getMonth() - from.getMonth();
      if (i >= 0 && i < 12) buckets[i]!.total += e.amount;
    });
  }
  const inRange = dated.filter((e) => e.d >= from);
  const total = inRange.reduce((s, e) => s + e.amount, 0);
  const byCat = new Map<string, number>();
  inRange.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  const categories = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, t]) => ({ name, total: t, percent: total ? Math.round((t / total) * 100) : 0 }));
  const hours = new Array(24).fill(0);
  inRange.forEach((e) => (hours[e.d.getHours()] += 1));
  const peakHour = inRange.length ? hours.indexOf(Math.max(...hours)) : -1;
  const under = buckets.filter((b) => b.total <= target).length;
  return { buckets, total, target, categories, peakHour, under };
}
const hourLabel = (h: number) => new Date(2000, 0, 1, h).toLocaleTimeString("en-US", { hour: "numeric" });
export function Analytics() {
  const { expenses, dailyAllowance, currencySymbol } = useSpend();
  const [period, setPeriod] = useState("Week");
  const a = buildAnalytics(expenses, period, dailyAllowance);
  const max = Math.max(a.target, ...a.buckets.map((b) => b.total), 1);
  const safe = a.buckets.length ? Math.round((a.under / a.buckets.length) * 100) : 0;
  return (
    <main className="page stack">
      <div className="segments">
        {["Week", "Month", "Year"].map((p) => (
          <Button
            key={p}
            variant="segment"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <section className="panel stack">
        <div className="row between">
          <span className="label uppercase">
            {period === "Week" ? "Weekly" : period === "Month" ? "Monthly" : "Yearly"} Total
          </span>
          <span className="badge success">
            <Icon name="receipt_long" />
            {a.categories.reduce((n, c) => n + (c.total > 0 ? 1 : 0), 0)} categories
          </span>
        </div>
        <div className="row items-baseline">
          <span className="money">
            {currencySymbol}{a.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="label mint">{a.under === a.buckets.length ? "on track" : "watch pace"}</span>
        </div>
        <p className="small muted">{a.under} of {a.buckets.length} periods stayed under your target.</p>
      </section>
      <section className="panel">
        <div className="row between">
          <div>
            <h2>{period === "Week" ? "Daily" : period === "Month" ? "Weekly" : "Monthly"} Pace</h2>
            <p className="small muted">Target: {currencySymbol}{a.target.toFixed(2)} per bar</p>
          </div>
          <div className="legend">
            <i className="dot" />
            Under
            <i className="dot pink" />
            Spike
          </div>
        </div>
        <div className="chart">
          <span className="target-label mono">Target {currencySymbol}{a.target.toFixed(0)}</span>
          {a.buckets.map((b, i) => (
            <div key={i} className="bar-col" title={`${currencySymbol}${b.total.toFixed(2)}`}>
              <span className={`bar-value ${b.total > a.target ? "pink" : "muted"}`}>{currencySymbol}{Math.round(b.total)}</span>
              <div
                className={`bar ${b.total > a.target ? "spike" : ""}`}
                style={{ height: `${Math.max(2, (b.total / max) * 100)}%` }}
              />
              <span className="label">{b.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel row">
        <div className="icon-disc">
          <Icon name="schedule" />
        </div>
        <div>
          <div className="label mint uppercase">Velocity Insight</div>
          <h4 className="strong">{a.peakHour < 0 ? "No activity yet" : "Peak Spending Hour"}</h4>
          <p className="small muted">
            {a.peakHour < 0 ? (
              "Log a few expenses to see when you spend most."
            ) : (
              <>
                Most expenses logged around{" "}
                <span className="text-foreground">{hourLabel(a.peakHour)} – {hourLabel((a.peakHour + 1) % 24)}</span>.
              </>
            )}
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="row between">
          <div>
            <h2>Category Breakdown</h2>
            <p className="small muted">{a.categories.length} active allocations</p>
          </div>
          <Icon name="donut_small" className="muted" />
        </div>
        {a.categories.length === 0 && <p className="small muted">No expenses in this period.</p>}
        {a.categories.map(({ name, total, percent }) => (
          <div className="category-row" key={name}>
            <div className="row between">
              <div className="row">
                <div className="icon-disc">
                  <Icon name={catIcon[name] ?? "payments"} />
                </div>
                <span>{name}</span>
              </div>
              <div className="row">
                <strong className="mono small">{currencySymbol}{total.toFixed(2)}</strong>
                <span className="label">{percent}%</span>
              </div>
            </div>
            <div className="progress">
              <progress value={percent} max="100" aria-label={name} />
            </div>
          </div>
        ))}
      </section>
      <section className="panel row between">
        <div className="row">
          <div className="icon-disc">
            <Icon name="eco" />
          </div>
          <div>
            <h4 className="strong">Pace Discipline</h4>
            <span className="small muted">{a.under} of {a.buckets.length} periods under target</span>
          </div>
        </div>
        <span className="badge success">{safe}% Safe</span>
      </section>
    </main>
  );
}
