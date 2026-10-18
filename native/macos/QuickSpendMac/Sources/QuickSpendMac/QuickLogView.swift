import SwiftUI
import Defaults

struct QuickLogView: View {
    @EnvironmentObject var store: ExpenseStore
    @Default(.currency) var currency
    @Default(.hapticFeedback) var hapticFeedback
    @Environment(\.dismiss) var dismiss
    
    @State private var amount = ""
    @State private var name = ""
    @State private var selectedCategory = "Food & Dining"
    @FocusState private var amountFocused: Bool
    
    let categories = ["Food & Dining", "Coffee", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Other"]
    
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
    
    var canSave: Bool {
        Double(amount) != nil && (Double(amount) ?? 0) > 0
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack(spacing: 8) {
                        Text(currencySymbol)
                            .font(.system(size: 36, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                        
                        TextField("0.00", text: $amount)
                            .font(.system(size: 36, weight: .medium, design: .rounded))
                            .multilineTextAlignment(.leading)
                            .keyboardType(.decimalPad)
                            .focused($amountFocused)
                    }
                    .listRowBackground(Color.clear)
                    .padding(.vertical, 8)
                } header: {
                    Text("Amount")
                        .textCase(.uppercase)
                        .font(.caption)
                }
                
                Section {
                    TextField("What for? (optional)", text: $name)
                        .textInputAutocapitalization(.words)
                } header: {
                    Text("Note")
                        .textCase(.uppercase)
                        .font(.caption)
                }
                
                Section {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(categories, id: \.self) { category in
                            HStack {
                                Image(systemName: iconForCategory(category))
                                    .foregroundStyle(colorForCategory(category))
                                Text(category)
                            }
                            .tag(category)
                        }
                    }
                    .pickerStyle(.menu)
                } header: {
                    Text("Category")
                        .textCase(.uppercase)
                        .font(.caption)
                }
            }
            .navigationTitle("Quick Log")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveExpense()
                    }
                    .disabled(!canSave)
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                amountFocused = true
            }
        }
        .frame(width: 360, height: 480)
    }
    
    func saveExpense() {
        guard let amountValue = Double(amount), amountValue > 0 else { return }
        
        let expense = Expense(
            name: name.isEmpty ? selectedCategory : name,
            category: selectedCategory,
            amount: amountValue,
            icon: selectedCategory.lowercased().replacingOccurrences(of: " & ", with: "_").replacingOccurrences(of: " ", with: "_")
        )
        
        store.addExpense(expense)
        
        if hapticFeedback {
            NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .default)
        }
        
        dismiss()
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

#Preview {
    QuickLogView()
        .environmentObject(ExpenseStore.shared)
}