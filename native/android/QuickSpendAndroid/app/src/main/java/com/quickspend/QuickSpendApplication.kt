package com.quickspend

import android.app.Application
import androidx.room.Room
import com.quickspend.data.ExpenseDatabase

class QuickSpendApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ExpenseDatabase.initialize(this)
    }
    
    companion object {
        lateinit var instance: QuickSpendApplication
            private set
    }
}