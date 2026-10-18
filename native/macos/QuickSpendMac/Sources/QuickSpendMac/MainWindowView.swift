import SwiftUI
import Defaults
import LaunchAtLogin
import KeyboardShortcuts

struct MainWindowView: View {
    @EnvironmentObject var store: ExpenseStore
    @Default(.monthlyBudget) var monthlyBudget
    @Default(.currency) var currency
    @Default(.hapticFeedback) var hapticFeedback
    @Default(.launchAtLogin) var launchAtLogin
    
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
        NavigationSplitView {
            // Sidebar
            List(selection: $store.selectedTab) {
                Section {
                    Label("Dashboard", systemImage: "house.fill")
                        .tag(Tab.dashboard)
                    Label("Expenses", systemImage: "list.bullet.rectangle")
                        .tag(Tab.expenses)
                    Label("Analytics", systemImage: "chart.bar.fill")
                        .tag(Tab.analytics)
                }
                
                Section {
                    Label("Groups", systemImage: "person.2.fill")
                        .tag(Tab.groups)
                    Label("Split Bills", systemImage: "arrow.left.arrow.right")
                        .tag(Tab.split)
                }
            }
            .listStyle(.sidebar)
            .navigationTitle("QuickSpend")
            .frame(minWidth: 200, idealWidth: 220)
        } detail: {
            // Detail view
            switch store.selectedTab {
            case .dashboard:
                DashboardView(
                    dailyAllowance: dailyAllowance,
                    todayTotal: todayTotal,
                    remainingToday: remainingToday,
                    percentUsed: percentUsed,
                    currencySymbol: currencySymbol,
                    expenses: store.expenses
                )
            case .expenses:
                ExpensesListView(expenses: store.expenses, currencySymbol: currencySymbol)
                    .environmentObject(store)
            case .analytics:
                AnalyticsView(expenses: store.expenses, currencySymbol: currencySymbol)
            case .groups:
                GroupsView()
            case .split:
                SplitView()
            case .settings:
                SettingsView(
                    monthlyBudget: $monthlyBudget,
                    currency: $currency,
                    hapticFeedback: $hapticFeedback,
                    launchAtLogin: $launchAtLogin
                )
            }
        }
        .frame(minWidth: 900, minHeight: 600)
    }
}

enum Tab: Hashable {
    case dashboard, expenses, analytics, groups, split, settings
}

struct DashboardView: View {
    let dailyAllowance: Double
    let todayTotal: Double
    let remainingToday: Double
    let percentUsed: Double
    let currencySymbol: String
    let expenses: [Expense]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Daily Allowance Card
                VStack(spacing: 16) {
                    HStack {
                        Text("Today's Allowance")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(currencySymbol)\(dailyAllowance, specifier: "%.2f")")
                            .font(.headline)
                            .fontWeight(.semibold)
                    }
                    
                    VStack(spacing: 8) {
                        Text("\(currencySymbol)\(remainingToday, specifier: "%.2f")")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(remainingToday >= 0 ? .primary : .red)
                        
                        Text("\(currencySymbol)\(todayTotal, specifier: "%.2f") used of \(currencySymbol)\(dailyAllowance, specifier: "%.2f")")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    
                    ProgressView(value: percentUsed)
                        .progressViewStyle(.linear)
                        .tint(remainingToday >= 0 ? .orange : .red)
                        .scaleEffect(y: 3)
                    
                    Text("\(Int(percentUsed * 100))% used")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
                
                // Quick Actions
                HStack(spacing: 16) {
                    QuickActionButton(
                        icon: "plus.circle.fill",
                        title: "Log Expense",
                        color: .orange,
                        action: { store.showingQuickLog = true }
                    )
                    
                    QuickActionButton(
                        icon: "person.2.fill",
                        title: "Split Bill",
                        color: .cyan,
                        action: { store.selectedTab = .split }
                    )
                    
                    QuickActionButton(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Analytics",
                        color: .purple,
                        action: { store.selectedTab = .analytics }
                    )
                }
                
                // Recent Expenses
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Recent Expenses")
                            .font(.headline)
                        Spacer()
                        Button("View All") {
                            store.selectedTab = .expenses
                        }
                        .font(.subheadline)
                    }
                    
                    if expenses.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "receipt")
                                .font(.system(size: 48))
                                .foregroundStyle(.tertiary)
                            Text("No expenses yet")
                                .font(.title3)
                                .foregroundStyle(.secondary)
                            Text("Click \"Log Expense\" to start tracking")
                                .font(.subheadline)
                                .foregroundStyle(.tertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else {
                        LazyVStack(spacing: 8) {
                            ForEach(expenses.prefix(10)) { expense in
                                ExpenseCard(expense: expense, currencySymbol: currencySymbol)
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .padding(24)
        }
        .navigationTitle("Dashboard")
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(color)
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct ExpenseCard: View {
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
        HStack(spacing: 14) {
            Image(systemName: iconName)
                .font(.system(size: 20, weight: .medium))
                .foregroundStyle(categoryColor)
                .frame(width: 44, height: 44)
                .background(categoryColor.opacity(0.15), in: RoundedRectangle(cornerRadius: 12))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(expense.name)
                    .font(.body)
                    .fontWeight(.medium)
                Text(expense.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(currencySymbol)\(expense.amount, specifier: "%.2f")")
                    .font(.body)
                    .fontWeight(.semibold)
                    .monospacedDigit()
                Text(expense.date, style: .time)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
    }
}

struct ExpensesListView: View {
    let expenses: [Expense]
    let currencySymbol: String
    @EnvironmentObject var store: ExpenseStore
    
    var body: some View {
        List {
            ForEach(expenses) { expense in
                ExpenseCard(expense: expense, currencySymbol: currencySymbol)
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
            }
            .onDelete { indexSet in
                for index in indexSet {
                    store.deleteExpense(expenses[index])
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("All Expenses")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    store.showingQuickLog = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
    }
}

struct AnalyticsView: View {
    let expenses: [Expense]
    let currencySymbol: String
    
    var categoryTotals: [(String, Double)] {
        let grouped = Dictionary(grouping: expenses, by: \.category)
        return grouped.map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.1 > $1.1 }
    }
    
    var total: Double {
        expenses.reduce(0) { $0 + $1.amount }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Total
                VStack(spacing: 8) {
                    Text("Total Spent")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                    Text("\(currencySymbol)\(total, specifier: "%.2f")")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 32)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
                
                // Category breakdown
                VStack(alignment: .leading, spacing: 16) {
                    Text("By Category")
                        .font(.headline)
                    
                    ForEach(categoryTotals, id: \.0) { category, amount in
                        HStack {
                            Image(systemName: iconForCategory(category))
                                .foregroundStyle(colorForCategory(category))
                                .frame(width: 24)
                            Text(category)
                                .font(.body)
                            Spacer()
                            Text("\(currencySymbol)\(amount, specifier: "%.2f")")
                                .font(.body)
                                .fontWeight(.semibold)
                                .monospacedDigit()
                            Text("\(Int(amount / total * 100))%")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .frame(width: 45, alignment: .trailing)
                        }
                        .padding(.vertical, 8)
                        
                        if category != categoryTotals.last?.0 {
                            Divider()
                        }
                    }
                }
                .padding(20)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                
                Spacer()
            }
            .padding(24)
        }
        .navigationTitle("Analytics")
    }
    
    func iconForCategory(_ category: String) -> String {
        switch category {
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
    
    func colorForCategory(_ category: String) -> Color {
        switch category {
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
}

struct GroupsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 64))
                .foregroundStyle(.tertiary)
            Text("Groups")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("Shared expenses with friends")
                .font(.body)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle("Groups")
    }
}

struct SplitView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "arrow.left.arrow.right")
                .font(.system(size: 64))
                .foregroundStyle(.tertiary)
            Text("Split Bills")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("Split expenses with friends")
                .font(.body)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle("Split Bills")
    }
}

struct SettingsView: View {
    @Binding var monthlyBudget: Double
    @Binding var currency: String
    @Binding var hapticFeedback: Bool
    @Binding var launchAtLogin: Bool
    
    let currencies = ["USD", "EUR", "GBP", "INR", "AED"]
    
    var body: some View {
        Form {
            Section("General") {
                LabeledContent("Monthly Budget") {
                    TextField("Budget", value: $monthlyBudget, format: .number)
                        .frame(width: 120)
                        .multilineTextAlignment(.trailing)
                }
                
                Picker("Currency", selection: $currency) {
                    ForEach(currencies, id: \.self) { Text($0) }
                }
                
                Toggle("Launch at Login", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { _, newValue in
                        LaunchAtLogin.isEnabled = newValue
                    }
            }
            
            Section("Feedback") {
                Toggle("Haptic Feedback", isOn: $hapticFeedback)
            }
            
            Section("Shortcuts") {
                LabeledContent("Quick Log") {
                    KeyboardShortcuts.Recorder(for: .quickLog)
                }
            }
            
            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }
                Link("Privacy Policy", destination: URL(string: "https://quickspend.app/privacy")!)
                Link("Support", destination: URL(string: "https://quickspend.app/support")!)
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Settings")
        .padding()
    }
}

#Preview {
    MainWindowView()
        .environmentObject(ExpenseStore.shared)
}