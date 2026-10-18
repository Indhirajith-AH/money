package com.quickspend.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.quickspend.data.Expense
import com.quickspend.data.ExpenseDatabase
import com.quickspend.prefs.SettingsRepository
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.sharingStarted.WhileSubscribed

class MainViewModel(
    private val expenseDao: ExpenseDao = ExpenseDatabase.getInstance().expenseDao(),
    private val settingsRepository: SettingsRepository = SettingsRepository.getInstance(
        QuickSpendApplication.instance
    )
) : ViewModel() {
    
    private val _expenses = expenseDao.getAll().stateIn(
        viewModelScope, WhileSubscribed(), emptyList()
    )
    val expenses = _expenses
    
    private val _todayExpenses = expenseDao.getTodayExpenses().stateIn(
        viewModelScope, WhileSubscribed(), emptyList()
    )
    val todayExpenses = _todayExpenses
    
    private val _todayTotal = expenseDao.getTodayTotal().stateIn(
        viewModelScope, WhileSubscribed(), 0.0
    )
    val todayTotal = _todayTotal
    
    val monthlyBudget = settingsRepository.monthlyBudget
        .toFlow()
        .stateIn(viewModelScope, WhileSubscribed(), 2250.0)
    
    val currency = settingsRepository.currency
        .toFlow()
        .stateIn(viewModelScope, WhileSubscribed(), "USD")
    
    val hapticFeedback = settingsRepository.hapticFeedback
        .toFlow()
        .stateIn(viewModelScope, WhileSubscribed(), true)
    
    val dailyAllowance = combine(monthlyBudget) { budget ->
        val daysInMonth = java.util.Calendar.getInstance().getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
        budget / daysInMonth
    }.stateIn(viewModelScope, WhileSubscribed(), 75.0)
    
    val remainingToday = combine(todayTotal, dailyAllowance) { total, allowance ->
        allowance - total
    }.stateIn(viewModelScope, WhileSubscribed(), 75.0)
    
    val percentUsed = combine(todayTotal, dailyAllowance) { total, allowance ->
        if (allowance > 0) minOf(total / allowance, 1.0) else 0.0
    }.stateIn(viewModelScope, WhileSubscribed(), 0.0)
    
    val currencySymbol = currency.map { curr ->
        when (curr) {
            "USD" -> "$"
            "EUR" -> "€"
            "GBP" -> "£"
            "INR" -> "₹"
            "AED" -> "د.إ"
            else -> "$"
        }
    }.stateIn(viewModelScope, WhileSubscribed(), "$")
    
    fun addExpense(expense: Expense) {
        viewModelScope.launch {
            expenseDao.insert(expense)
        }
    }
    
    fun deleteExpense(expense: Expense) {
        viewModelScope.launch {
            expenseDao.delete(expense)
        }
    }
    
    fun updateMonthlyBudget(budget: Double) {
        viewModelScope.launch {
            settingsRepository.setMonthlyBudget(budget)
        }
    }
    
    fun updateCurrency(curr: String) {
        viewModelScope.launch {
            settingsRepository.setCurrency(curr)
        }
    }
    
    fun setHapticFeedback(enabled: Boolean) {
        viewModelScope.launch {
            settingsRepository.setHapticFeedback(enabled)
        }
    }
    
    fun setPowerButtonDoubleTap(enabled: Boolean) {
        viewModelScope.launch {
            settingsRepository.setPowerButtonDoubleTap(enabled)
        }
    }
}