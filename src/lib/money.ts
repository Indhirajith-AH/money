// Pure money logic shared by screens and tests.

export type Pace = {
  day: number;
  daysInMonth: number;
  spent: number;
  velocity: number; // average spend per day so far
  projected: number; // month-end spend at this velocity
  safeDaily: number; // what you can spend per remaining day to stay on budget
  runsOutOnDay: number | null; // day of month the budget hits zero, if before month end
  status: "on-track" | "warning" | "over";
};

export function computePace(monthlyBudget: number, spentThisMonth: number, date = new Date()): Pace {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const day = date.getDate();
  const velocity = spentThisMonth / day;
  const projected = velocity * daysInMonth;
  const daysLeft = daysInMonth - day + 1;
  const safeDaily = Math.max(0, (monthlyBudget - spentThisMonth) / daysLeft);
  let runsOutOnDay: number | null = null;
  if (velocity > 0 && projected > monthlyBudget) runsOutOnDay = Math.max(1, Math.floor(monthlyBudget / velocity));
  const status = spentThisMonth >= monthlyBudget ? "over" : projected > monthlyBudget ? "warning" : "on-track";
  return { day, daysInMonth, spent: spentThisMonth, velocity, projected, safeDaily, runsOutOnDay, status };
}

const ALIASES: Record<string, string> = { "Food & Dining": "Food & Drink" };
export const budgetCategory = (c: string) => ALIASES[c] ?? c;

export function spendByCategory(items: { category: string; amount: number }[]) {
  const out: Record<string, number> = {};
  for (const e of items) {
    const c = budgetCategory(e.category);
    out[c] = (out[c] ?? 0) + e.amount;
  }
  return out;
}

export type SplitEntry = {
  kind: "expense" | "settle";
  amount: number;
  paidBy: string;
  splitAmong: string[];
};

/** Positive = member is owed money, negative = member owes. */
export function groupBalances(members: string[], entries: SplitEntry[]) {
  const bal: Record<string, number> = Object.fromEntries(members.map((m) => [m, 0]));
  for (const e of entries) {
    const among = e.splitAmong.length ? e.splitAmong : members;
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + e.amount;
    const each = e.amount / among.length;
    for (const m of among) bal[m] = (bal[m] ?? 0) - each;
  }
  for (const k in bal) bal[k] = Math.round((bal[k] ?? 0) * 100) / 100;
  return bal;
}

/** Minimal list of who pays whom to clear all balances. */
export function settleUp(balances: Record<string, number>) {
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.004).map(([n, v]) => ({ n, v: -v }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.004).map(([n, v]) => ({ n, v }));
  debtors.sort((a, b) => b.v - a.v);
  creditors.sort((a, b) => b.v - a.v);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const amt = Math.min(d.v, c.v);
    out.push({ from: d.n, to: c.n, amount: Math.round(amt * 100) / 100 });
    d.v -= amt;
    c.v -= amt;
    if (d.v < 0.005) i++;
    if (c.v < 0.005) j++;
  }
  return out;
}
