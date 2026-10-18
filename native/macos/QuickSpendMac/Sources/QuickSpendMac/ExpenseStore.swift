import Foundation
import SwiftUI
import Defaults

@MainActor
class ExpenseStore: ObservableObject {
    static let shared = ExpenseStore()
    
    @Published var expenses: [Expense] = []
    @Published var showingQuickLog = false
    @Published var showingSettings = false
    @Published var showingMainWindow = false
    @Published var selectedTab: Tab = .dashboard
    
    private let saveURL: URL
    
    var todayExpenses: [Expense] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return expenses.filter { calendar.isDate($0.date, inSameDayAs: startOfDay) }
    }
    
    init() {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        saveURL = documents.appendingPathComponent("quickspend_expenses.json")
        loadExpenses()
        
        // Add sample data if empty
        if expenses.isEmpty {
            addSampleData()
        }
    }
    
    func addExpense(_ expense: Expense) {
        expenses.insert(expense, at: 0)
        saveExpenses()
    }
    
    func deleteExpense(_ expense: Expense) {
        expenses.removeAll { $0.id == expense.id }
        saveExpenses()
    }
    
    func deleteExpenses(at offsets: IndexSet) {
        expenses.remove(atOffsets: offsets)
        saveExpenses()
    }
    
    private func saveExpenses() {
        do {
            let data = try JSONEncoder().encode(expenses)
            try data.write(to: saveURL, options: .atomic)
        } catch {
            print("Failed to save expenses: \(error)")
        }
    }
    
    private func loadExpenses() {
        do {
            let data = try Data(contentsOf: saveURL)
            expenses = try JSONDecoder().decode([Expense].self, from: data)
        } catch {
            expenses = []
        }
    }
    
    private func addSampleData() {
        let calendar = Calendar.current
        let now = Date()
        
        expenses = [
            Expense(name: "Lunch", category: "Food & Dining", amount: 24.50, icon: "food_dining", date: calendar.date(byAdding: .hour, value: -2, to: now)!),
            Expense(name: "Coffee", category: "Coffee", amount: 5.75, icon: "coffee", date: calendar.date(byAdding: .hour, value: -4, to: now)!),
            Expense(name: "Uber to office", category: "Transport", amount: 18.00, icon: "transport", date: calendar.date(byAdding: .hour, value: -6, to: now)!),
            Expense(name: "Groceries", category: "Shopping", amount: 67.30, icon: "shopping", date: calendar.date(byAdding: .day, value: -1, to: now)!),
            Expense(name: "Netflix", category: "Entertainment", amount: 15.99, icon: "entertainment", date: calendar.date(byAdding: .day, value: -2, to: now)!),
        ]
        saveExpenses()
    }
}