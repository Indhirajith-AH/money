package com.quickspend.prefs

import android.content.Context
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.preferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.rxjava3.RxPreferenceDataStoreBuilder
import androidx.datastore.rxjava3.RxDataStore
import io.reactivex.rxjava3.core.Flowable

object PreferencesKeys {
    val MONTHLY_BUDGET = doublePreferencesKey("monthly_budget")
    val CURRENCY = stringPreferencesKey("currency")
    val HAPTIC_FEEDBACK = preferencesKey<Boolean>("haptic_feedback")
    val LAUNCH_AT_BOOT = preferencesKey<Boolean>("launch_at_boot")
    val QUICK_SETTINGS_TILE = preferencesKey<Boolean>("quick_settings_tile")
    val POWER_BUTTON_DOUBLE_TAP = preferencesKey<Boolean>("power_button_double_tap")
}

class SettingsRepository(private val dataStore: RxDataStore<Preferences>) {
    
    val monthlyBudget: Flowable<Double> = dataStore.data
        .map { it[PreferencesKeys.MONTHLY_BUDGET] ?: 2250.0 }
        .distinctUntilChanged()
    
    val currency: Flowable<String> = dataStore.data
        .map { it[PreferencesKeys.CURRENCY] ?: "USD" }
        .distinctUntilChanged()
    
    val hapticFeedback: Flowable<Boolean> = dataStore.data
        .map { it[PreferencesKeys.HAPTIC_FEEDBACK] ?: true }
        .distinctUntilChanged()
    
    val powerButtonDoubleTap: Flowable<Boolean> = dataStore.data
        .map { it[PreferencesKeys.POWER_BUTTON_DOUBLE_TAP] ?: false }
        .distinctUntilChanged()
    
    suspend fun setMonthlyBudget(budget: Double) {
        dataStore.updateData { it[PreferencesKeys.MONTHLY_BUDGET] = budget }
    }
    
    suspend fun setCurrency(currency: String) {
        dataStore.updateData { it[PreferencesKeys.CURRENCY] = currency }
    }
    
    suspend fun setHapticFeedback(enabled: Boolean) {
        dataStore.updateData { it[PreferencesKeys.HAPTIC_FEEDBACK] = enabled }
    }
    
    suspend fun setPowerButtonDoubleTap(enabled: Boolean) {
        dataStore.updateData { it[PreferencesKeys.POWER_BUTTON_DOUBLE_TAP] = enabled }
    }
    
    companion object {
        @Volatile private var INSTANCE: SettingsRepository? = null
        
        fun getInstance(context: Context): SettingsRepository = INSTANCE ?: synchronized(this) {
            INSTANCE ?: SettingsRepository(
                RxPreferenceDataStoreBuilder(context, "settings").build()
            ).also { INSTANCE = it }
        }
    }
}