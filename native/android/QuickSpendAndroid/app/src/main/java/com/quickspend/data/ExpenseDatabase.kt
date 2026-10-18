package com.quickspend.data

import androidx.room.*
import kotlinx.serialization.Serializable

@Entity(tableName = "expenses")
@Serializable
data class Expense(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: String,
    val amount: Double,
    val timestamp: Long = System.currentTimeMillis(),
    val icon: String = "other"
) {
    fun getDate() = java.util.Date(timestamp)
}

@Dao
interface ExpenseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(expense: Expense): Long
    
    @Update
    suspend fun update(expense: Expense)
    
    @Delete
    suspend fun delete(expense: Expense)
    
    @Query("DELETE FROM expenses")
    suspend fun clearAll()
    
    @Query("SELECT * FROM expenses ORDER BY timestamp DESC")
    fun getAll(): Flow<List<Expense>>
    
    @Query("SELECT * FROM expenses WHERE date(timestamp/1000, 'unixepoch') = date('now') ORDER BY timestamp DESC")
    fun getTodayExpenses(): Flow<List<Expense>>
    
    @Query("SELECT * FROM expenses WHERE date(timestamp/1000, 'unixepoch') >= date('now', '-6 days') ORDER BY timestamp DESC")
    fun getLast7Days(): Flow<List<Expense>>
    
    @Query("SELECT SUM(amount) FROM expenses WHERE date(timestamp/1000, 'unixepoch') = date('now')")
    suspend fun getTodayTotal(): Double
    
    @Query("SELECT category, SUM(amount) as total FROM expenses WHERE date(timestamp/1000, 'unixepoch') >= date('now', '-6 days') GROUP BY category")
    suspend fun getCategoryTotalsLast7Days(): List<CategoryTotal>
    
    @Query("SELECT strftime('%w', timestamp/1000, 'unixepoch') as dayOfWeek, SUM(amount) as total FROM expenses WHERE date(timestamp/1000, 'unixepoch') >= date('now', '-6 days') GROUP BY dayOfWeek")
    suspend fun getDailyTotalsLast7Days(): List<DailyTotal>
}

data class CategoryTotal(val category: String, val total: Double)
data class DailyTotal(val dayOfWeek: String, val total: Double)

@Database(entities = [Expense::class], version = 1, exportSchema = false)
abstract class ExpenseDatabase : RoomDatabase() {
    abstract fun expenseDao(): ExpenseDao
    
    companion object {
        @Volatile private var INSTANCE: ExpenseDatabase? = null
        
        fun initialize(context: android.content.Context) {
            if (INSTANCE == null) {
                synchronized(this) {
                    if (INSTANCE == null) {
                        INSTANCE = Room.databaseBuilder(
                            context.applicationContext,
                            ExpenseDatabase::class.java,
                            "quickspend.db"
                        ).fallbackToDestructiveMigration().build()
                    }
                }
            }
        }
        
        fun getInstance(): ExpenseDatabase = INSTANCE!!
    }
}