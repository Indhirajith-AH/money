package com.quickspend.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.lifecycle.viewmodel.CreationExtras
import com.quickspend.data.ExpenseDatabase
import com.quickspend.prefs.SettingsRepository
import com.quickspend.ui.MainViewModel

class MainActivity : ComponentActivity() {
    private val viewModelFactory = MainViewModel.Factory()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            QuickSpendApp()
        }
        
        // Handle quick log intent from tile/shortcut
        if (intent.action == "QUICK_LOG") {
            // Navigate to quick log screen - handled by nav controller
        }
    }
    
    override fun getDefaultViewModelCreationExtras(): CreationExtras {
        return super.getDefaultViewModelCreationExtras()
    }
}

class MainViewModelFactory : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : androidx.lifecycle.ViewModel?> create(
        modelClass: Class<T>,
        extras: CreationExtras
    ): T {
        return MainViewModel(
            ExpenseDatabase.getInstance().expenseDao(),
            SettingsRepository.getInstance(QuickSpendApplication.instance)
        ) as T
    }
}