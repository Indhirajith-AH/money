import SwiftUI
import KeyboardShortcuts
import LaunchAtLogin

extension KeyboardShortcuts.Name {
    static let quickLog = Self("quickLog", default: .init(.l, modifiers: [.option, .command]))
}

struct ContentView: View {
    @EnvironmentObject var store: ExpenseStore
    @EnvironmentObject var settings: Settings
    @State private var showingQuickLog = false
    @State private var showingSettings = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with allowance
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "bolt.fill")
                        .foregroundStyle(.mint)
                    Text("QuickSpend")
                        .font(.headline)
                    Spacer()
                }
                
                // Daily allowance gauge
                VStack(spacing: 4) {
                    HStack {
                        Text("Today's Allowance")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(store.currencySymbol)\(store.remainingToday, specifier: "%.2f")")
                            .font(.system(.title2, design: .monospaced))
                            .fontWeight(.semibold)
                            .foregroundStyle(store.remainingToday >= 0 ? .mint : .red)
                    }
                    
                    ProgressView(value: store.percentUsed)
                        .progressViewStyle(.linear)
                        .tint(store.remainingToday >= 0 ? .mint : .red)
                        .scaleEffect(y: 1.5)
                    
                    HStack {
                        Text("\(store.currencySymbol)\(store.todayTotal, specifier: "%.2f") used of \(store.currencySymbol)\(store.dailyAllowance, specifier: "%.2f")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(Int(store.percentUsed * 100))%")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
            
            Divider()
            
            // Recent expenses
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Recent")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Spacer()
                    Button("View All") {
                        showingSettings = true
                    }
                    .font(.caption)
                }
                .padding(.horizontal)
                
                if store.expenses.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "tray")
                            .font(.system(size: 32))
                            .foregroundStyle(.secondary)
                        Text("No expenses yet")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                        Button("Log First Expense") {
                            showingQuickLog = true
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 4) {
                            ForEach(store.expenses.prefix(5)) { expense in
                                ExpenseRow(expense: expense)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .frame(maxHeight: 200)
                }
            }
            
            Divider()
            
            // Quick actions
            VStack(spacing: 8) {
                Button {
                    showingQuickLog = true
                } label: {
                    Label("Log Expense (⌥⌘L)", systemImage: "plus.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                
                HStack(spacing: 12) {
                    Button {
                        showingSettings = true
                    } label: {
                        Label("Settings", systemImage: "gear")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    
                    LaunchAtLogin.Toggle {
                        Label("Launch at Login", systemImage: "power")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
        .sheet(isPresented: $showingQuickLog) {
            QuickLogWindow()
                .environmentObject(store)
                .environmentObject(settings)
        }
        .sheet(isPresented: $showingSettings) {
            SettingsWindow()
                .environmentObject(store)
                .environmentObject(settings)
        }
    }
}

struct ExpenseRow: View {
    let expense: Expense
    @EnvironmentObject var store: ExpenseStore
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: expense.categoryIcon)
                .font(.system(size: 16))
                .foregroundStyle(.mint)
                .frame(width: 32, height: 32)
                .background(.mint.opacity(0.15))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(expense.name)
                    .font(.subheadline)
                    .lineLimit(1)
                Text(expense.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Text("\(store.currencySymbol)\(expense.amount, specifier: "%.2f")")
                .font(.system(.subheadline, design: .monospaced))
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}

struct QuickLogWindow: View {
    @EnvironmentObject var store: ExpenseStore
    @EnvironmentObject var settings: Settings
    @Environment(\.dismiss) var dismiss
    @FocusState private var amountFocused: Bool
    
    @State private var amount = ""
    @State private var name = ""
    @State private var category = "Food & Dining"
    @State private var showCategoryPicker = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Amount input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Amount")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack {
                        Text(store.currencySymbol)
                            .font(.system(size: 48, weight: .medium, design: .monospaced))
                            .foregroundStyle(.secondary)
                        TextField("0.00", text: $amount)
                            .font(.system(size: 48, weight: .medium, design: .monospaced))
                            .multilineTextAlignment(.trailing)
                            .focused($amountFocused)
                            .keyboardType(.decimalPad)
                    }
                }
                
                // Name & Category
                VStack(spacing: 16) {
                    TextField("What for? (e.g., Coffee, Lunch)", text: $name)
                        .textFieldStyle(.roundedBorder)
                        .font(.body)
                    
                    Menu {
                        ForEach(Expense.categories.keys.sorted(), id: \.self) { cat in
                            Button(cat) { category = cat }
                        }
                    } label: {
                        HStack {
                            Image(systemName: Expense.categories[category] ?? "square.grid.2x2")
                                .foregroundStyle(.mint)
                            Text(category)
                            Spacer()
                            Image(systemName: "chevron.up.chevron.down")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(Color(nsColor: .controlBackgroundColor))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .menuStyle(.borderlessButton)
                }
                
                Spacer()
                
                // Save button
                Button {
                    saveExpense()
                } label: {
                    Text("Save Expense")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(amount.isEmpty || Double(amount) == nil)
                .keyboardShortcut(.defaultAction)
            }
            .padding()
            .frame(width: 360, height: 420)
            .navigationTitle("Quick Log")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                amountFocused = true
            }
        }
    }
    
    private func saveExpense() {
        guard let amountValue = Double(amount), amountValue > 0 else { return }
        let expense = Expense(
            name: name.isEmpty ? category : name,
            category: category,
            amount: amountValue,
            date: Date(),
            icon: Expense.categories[category] ?? "square.grid.2x2"
        )
        store.add(expense)
        
        if settings.hapticFeedback {
            NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .default)
        }
        
        dismiss()
    }
}

struct SettingsWindow: View {
    @EnvironmentObject var store: ExpenseStore
    @EnvironmentObject var settings: Settings
    @Environment(\.dismiss) var dismiss
    
    @Default(.monthlyBudget) var monthlyBudget
    @Default(.currency) var currency
    @Default(.launchAtLogin) var launchAtLogin
    @Default(.hapticFeedback) var hapticFeedback
    
    let currencies = ["USD", "EUR", "GBP", "INR", "AED"]
    
    var body: some View {
        Form {
            Section("Budget") {
                HStack {
                    Text("Monthly Budget")
                    Spacer()
                    TextField("Budget", value: $monthlyBudget, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 120)
                        .multilineTextAlignment(.trailing)
                    Text(store.currencySymbol)
                        .foregroundStyle(.secondary)
                }
                .onChange(of: monthlyBudget) { _ in
                    store.monthlyBudget = monthlyBudget
                }
                
                Picker("Currency", selection: $currency) {
                    ForEach(currencies, id: \.self) { Text($0) }
                }
                .onChange(of: currency) { _ in
                    store.currency = currency
                }
            }
            
            Section("General") {
                Toggle("Launch at Login", isOn: $launchAtLogin)
                Toggle("Haptic Feedback", isOn: $hapticFeedback)
            }
            
            Section("Shortcuts") {
                KeyboardShortcuts.Recorder(for: .quickLog)
                Text("Press to open Quick Log from anywhere")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Section("Data") {
                Button("Export CSV") {
                    exportCSV()
                }
                Button("Clear All Data", role: .destructive) {
                    store.expenses.removeAll()
                    store.save()
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 480, height: 400)
        .navigationTitle("Settings")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") { dismiss() }
            }
        }
    }
    
    private func exportCSV() {
        let csv = "Name,Category,Amount,Date\n" +
            store.expenses.map { "\($0.name),\($0.category),\($0.amount),\($0.date.ISO8601Format())" }.joined(separator: "\n")
        
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.commaSeparatedText]
        panel.nameFieldStringValue = "quickspend-expenses.csv"
        panel.begin { response in
            if response == .OK, let url = panel.url {
                try? csv.write(to: url, atomically: true, encoding: .utf8)
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(ExpenseStore.shared)
        .environmentObject(Settings.shared)
}