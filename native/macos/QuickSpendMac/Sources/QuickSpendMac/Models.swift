import Foundation
import SwiftUI
import Defaults

struct Expense: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var category: String
    var amount: Double
    var date: Date
    var icon: String
    
    static let categories = [
        "Food & Dining": "fork.knife",
        "Coffee": "cup.and.saucer.fill",
        "Transport": "bus.fill",
        "Shopping": "bag.fill",
        "Entertainment": "gamecontroller.fill",
        "Bills": "doc.text.fill",
        "Health": "cross.fill",
        "Other": "square.grid.2x2.fill"
    ]
    
    var categoryIcon: String {
        Self.categories[category] ?? "square.grid.2x2.fill"
    }
}

class ExpenseStore: ObservableObject {
    @Published var expenses: [Expense] = []
    @Published var monthlyBudget: Double = 2250
    @Published var currency: String = "USD"
    
    private let expensesKey = "expenses"
    private let budgetKey = "monthlyBudget"
    private let currencyKey = "currency"
    
    init() {
        load()
    }
    
    func add(_ expense: Expense) {
        expenses.insert(expense, at: 0)
        save()
    }
    
    func remove(_ expense: Expense) {
        expenses.removeAll { $0.id == expense.id }
        save()
    }
    
    func update(_ expense: Expense) {
        if let index = expenses.firstIndex(where: { $0.id == expense.id }) {
            expenses[index] = expense
            save()
        }
    }
    
    var todayTotal: Double {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        return expenses
            .filter { calendar.isDate($0.date, inSameDayAs: today) }
            .reduce(0) { $0 + $1.amount }
    }
    
    var dailyAllowance: Double {
        let daysInMonth = Calendar.current.range(of: .day, in: .month, for: Date())?.count ?? 30
        return monthlyBudget / Double(daysInMonth)
    }
    
    var remainingToday: Double {
        dailyAllowance - todayTotal
    }
    
    var percentUsed: Double {
        min(todayTotal / dailyAllowance, 1.0)
    }
    
    private func save() {
        if let data = try? JSONEncoder().encode(expenses) {
            UserDefaults.standard.set(data, forKey: expensesKey)
        }
        UserDefaults.standard.set(monthlyBudget, forKey: budgetKey)
        UserDefaults.standard.set(currency, forKey: currencyKey)
    }
    
    private func load() {
        if let data = UserDefaults.standard.data(forKey: expensesKey),
           let decoded = try? JSONDecoder().decode([Expense].self, from: data) {
            expenses = decoded
        }
        monthlyBudget = UserDefaults.standard.double(forKey: budgetKey)
        if monthlyBudget == 0 { monthlyBudget = 2250 }
        currency = UserDefaults.standard.string(forKey: currencyKey) ?? "USD"
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
}

extension Defaults.Keys {
    static let monthlyBudget = Key<Double>("monthlyBudget", default: 2250)
    static let currency = Key<String>("currency", default: "USD")
    static let launchAtLogin = Key<Bool>("launchAtLogin", default: true)
    static let hapticFeedback = Key<Bool>("hapticFeedback", default: true)
    static let globalShortcut = Key<String>("globalShortcut", default: "⌥⌘L")
}