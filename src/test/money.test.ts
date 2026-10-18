import { computePace, groupBalances, settleUp, spendByCategory } from "@/lib/money";

describe("pace alerts", () => {
  it("warns when $800 spent by day 10 of a 30-day month with a $1500 budget", () => {
    const p = computePace(1500, 800, new Date(2026, 8, 10));
    expect(p.status).toBe("warning");
    expect(p.projected).toBe(2400);
    expect(p.runsOutOnDay).toBe(18);
  });
  it("is on track when $300 spent by day 10 of a $1500 budget", () => {
    const p = computePace(1500, 300, new Date(2026, 8, 10));
    expect(p.status).toBe("on-track");
    expect(p.runsOutOnDay).toBeNull();
  });
  it("is over once the whole budget is spent", () => {
    expect(computePace(1500, 1600, new Date(2026, 8, 20)).status).toBe("over");
  });
});

describe("category budgets", () => {
  it("counts Food & Dining toward the dining (Food & Drink) cap", () => {
    expect(spendByCategory([{ category: "Food & Dining", amount: 10 }, { category: "Food & Drink", amount: 5 }])["Food & Drink"]).toBe(15);
  });
});

describe("shared groups", () => {
  it("you pay 90 for three people: each friend owes you 30", () => {
    const b = groupBalances(["You", "Rahul", "Ananya"], [{ kind: "expense", amount: 90, paidBy: "You", splitAmong: [] }]);
    expect(b).toEqual({ You: 60, Rahul: -30, Ananya: -30 });
    expect(settleUp(b)).toEqual([
      { from: "Rahul", to: "You", amount: 30 },
      { from: "Ananya", to: "You", amount: 30 },
    ]);
  });
  it("a recorded settle-up clears that debt", () => {
    const b = groupBalances(["You", "Rahul"], [
      { kind: "expense", amount: 100, paidBy: "You", splitAmong: [] },
      { kind: "settle", amount: 50, paidBy: "Rahul", splitAmong: ["You"] },
    ]);
    expect(b).toEqual({ You: 0, Rahul: 0 });
  });
});
