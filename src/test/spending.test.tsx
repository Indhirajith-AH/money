import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpendProvider, useSpend } from '@/components/spend-shell';
import { Split } from '@/components/spend/split';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function SpendingProbe() {
  const { remaining, expenses, addExpense, removeExpense } = useSpend();
  const latest = expenses[0];
  return <>
    <output aria-label="Remaining">{remaining.toFixed(2)}</output>
    <output aria-label="Count">{expenses.length}</output>
    <button onClick={() => addExpense({ name: 'Lunch', category: 'Food', amount: 12.5, icon: 'restaurant' })}>Add</button>
    <button onClick={() => { if (latest) removeExpense(latest.id); }}>Refund</button>
  </>;
}

describe('QuickSpend calculations', () => {
  it('deducts a 12.50 expense from 34.50 to leave 22.00', () => {
    vi.useFakeTimers();
    render(<SpendProvider><SpendingProbe /></SpendProvider>);
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByLabelText('Remaining')).toHaveTextContent('22.00');
    expect(screen.getByLabelText('Count')).toHaveTextContent('4');
  });

  it('returns the deducted amount when an expense is refunded', () => {
    vi.useFakeTimers();
    render(<SpendProvider><SpendingProbe /></SpendProvider>);
    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Refund'));
    expect(screen.getByLabelText('Remaining')).toHaveTextContent('34.50');
    expect(screen.getByLabelText('Count')).toHaveTextContent('3');
  });

  it('splits a 2400 bill equally into four 600 shares and recalculates changed totals', () => {
    render(<SpendProvider><Split /></SpendProvider>);
    expect(screen.getAllByText('₹600.00').length).toBeGreaterThanOrEqual(4);
    fireEvent.change(screen.getByRole('textbox', { name: 'Total Bill Amount' }), { target: { value: '1200' } });
    expect(screen.getAllByText('₹300.00').length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText('₹600.00')).toBeNull();
  });
});
import { dailyAllowanceFor } from '@/components/spend-shell';
import { buildAnalytics } from '@/components/spend/analytics';

describe('Cloud allowance and analytics', () => {
  it('spreads a 1500 monthly budget over a 30-day month as 50 per day', () => {
    expect(dailyAllowanceFor(1500, new Date(2026, 10, 10))).toBe(50);
  });
  it('totals the last 7 days by category from logged expenses', () => {
    const now = new Date(2026, 9, 16, 12);
    const e = (id: number, amount: number, category: string, daysAgo: number) => ({
      id, name: 'x', category, amount, icon: 'x', time: '',
      spentAt: new Date(2026, 9, 16 - daysAgo, 10).toISOString(),
    });
    const a = buildAnalytics([e(1, 10, 'Coffee', 0), e(2, 30, 'Groceries', 2), e(3, 99, 'Bills', 20)], 'Week', 50, now);
    expect(a.total).toBe(40);
    expect(a.categories[0]).toMatchObject({ name: 'Groceries', total: 30, percent: 75 });
  });
});
