import SwiftUI
import KeyboardShortcuts
import Defaults

struct PopoverView: View {
    @EnvironmentObject var store: ExpenseStore
    @Default(.monthlyBudget) var monthlyBudget
    @Default(.currency) var currency
    @Default(.hapticFeedback) var hapticFeedback
    
    var dailyAllowance: Double {
        let daysInMonth = Calendar.current.range(of: .day, in: .month, for: Date())?.count ?? 30
        return monthlyBudget / Double(daysInMonth)
    }
    
    var todayTotal: Double {
        store.todayExpenses.reduce(0) { $0 + $1.amount }
    }
    
    var remainingToday: Double {
        dailyAllowance - todayTotal
    }
    
    var percentUsed: Double {
        dailyAllowance > 0 ? min(todayTotal / dailyAllowance, 1.0) : 0.0
    }
    
    var currencySymbol: String {
        switch currency {
        case "USD": return "$"
        case "EUR": return "€"
        case "GBP": return "£"
        case "INR": return "₹"
        case "AED": return "د.إ"
        default: return "$"
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "bolt.fill")
                    .font(.title2)
                    .foregroundStyle(.orange)
                Text("QuickSpend")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Button(action: { NSApp.sendAction(#selector(NSApplication.terminate(_:)), to: nil, from: nil) }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
            
            Divider()
            
            // Daily Allowance Card
            VStack(spacing: 12) {
                HStack {
                    Text("Today's Allowance")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(currencySymbol)\(dailyAllowance, specifier: "%.2f")")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                VStack(spacing: 4) {
                    Text("\(currencySymbol)\(remainingToday, specifier: "%.2f")")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(remainingToday >= 0 ? .primary : .red)
                    
                    Text("\(currencySymbol)\(todayTotal, specifier: "%.2f") used of \(currencySymbol)\(dailyAllowance, specifier: "%.2f")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                ProgressView(value: percentUsed)
                    .progressViewStyle(.linear)
                    .tint(remainingToday >= 0 ? .orange : .red)
                    .scaleEffect(y: 2)
                
                Text("\(Int(percentUsed * 100))% used")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal, 12)
            .padding(.top, 12)
            
            Divider()
                .padding(.vertical, 8)
            
            // Quick Log Button
            Button(action: { store.showingQuickLog = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                    Text("Log Expense")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .padding(.horizontal, 12)
            
            // Recent Expenses
            if store.expenses.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "receipt")
                        .font(.system(size: 32))
                        .foregroundStyle(.secondary)
                    Text("No expenses yet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("Click \"Log Expense\" to start")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(store.expenses.prefix(10)) { expense in
                            ExpenseRow(expense: expense, currencySymbol: currencySymbol)
                            if expense.id != store.expenses.prefix(10).last?.id {
                                Divider()
                                    .padding(.leading, 56)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, 8)
                }
            }
            
            Divider()
                .padding(.vertical, 8)
            
            // Footer actions
            HStack(spacing: 16) {
                Button("Settings") {
                    store.showingSettings = true
                }
                .buttonStyle(.plain)
                .font(.caption)
                
                Spacer()
                
                Button("Open App") {
                    NSApp.activate(ignoringOtherApps: true)
                    store.showingMainWindow = true
                }
                .buttonStyle(.plain)
                .font(.caption)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
        .frame(width: 360)
        .background(.regularMaterial)
    }
}

struct ExpenseRow: View {
    let expense: Expense
    let currencySymbol: String
    
    var iconName: String {
        switch expense.category {
        case "Food & Dining": return "fork.knife"
        case "Coffee": return "cup.and.saucer.fill"
        case "Transport": return "bus.fill"
        case "Shopping": return "bag.fill"
        case "Entertainment": return "gamecontroller.fill"
        case "Bills": return "doc.text.fill"
        case "Health": return "cross.case.fill"
        default: return "circle.fill"
        }
    }
    
    var categoryColor: Color {
        switch expense.category {
        case "Food & Dining": return .orange
        case "Coffee": return .brown
        case "Transport": return .blue
        case "Shopping": return .purple
        case "Entertainment": return .pink
        case "Bills": return .red
        case "Health": return .green
        default: return .gray
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(categoryColor)
                .frame(width: 32, height: 32)
                .background(categoryColor.opacity(0.15), in: RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(expense.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                Text(expense.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(currencySymbol)\(expense.amount, specifier: "%.2f")")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .monospacedDigit()
                Text(expense.date, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    PopoverView()
        .environmentObject(ExpenseStore.shared)
}