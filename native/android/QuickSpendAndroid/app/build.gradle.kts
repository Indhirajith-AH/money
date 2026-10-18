plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-android")
    id("kotlin-kapt")
}

android {
    namespace = "com.quickspend"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.quickspend"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.13"
    }

    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1,LICENSE,NOTICE}"
        }
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.0")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // DataStore for preferences
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    
    // WorkManager for background sync
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    
    // Hilt for DI (optional, skip for simplicity)
    // implementation("com.google.dagger:hilt-android:2.48")
    // kapt("com.google.dagger:hilt-compiler:2.48")
    
    // Accompanist for system UI
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.32.0")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
}