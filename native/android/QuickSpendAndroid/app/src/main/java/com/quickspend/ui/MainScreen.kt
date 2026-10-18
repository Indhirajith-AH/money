package com.quickspend.ui

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.quickspend.data.Expense
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickSpendApp() {
    MaterialTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            val navController = rememberNavController()
            NavHost(navController, startDestination = "main") {
                composable("main") {
                    MainScreen(onOpenQuickLog = { navController.navigate("quicklog") })
                }
                composable("quicklog") {
                    QuickLogScreen(onClose = { navController.popBackStack() })
                }
                composable("settings") {
                    SettingsScreen()
                }
            }
        }
    }
}

@Composable
fun MainScreen(onOpenQuickLog: () -> Unit) {
    val viewModel: MainViewModel = viewModel()
    val expenses by viewModel.expenses.collectAsStateWithLifecycle()
    val todayExpenses by viewModel.todayExpenses.collectAsStateWithLifecycle()
    val todayTotal by viewModel.todayTotal.collectAsStateWithLifecycle()
    val dailyAllowance by viewModel.dailyAllowance.collectAsStateWithLifecycle()
    val remainingToday by viewModel.remainingToday.collectAsStateWithLifecycle()
    val percentUsed by viewModel.percentUsed.collectAsStateWithLifecycle()
    val currencySymbol by viewModel.currencySymbol.collectAsStateWithLifecycle()
    val hapticFeedback by viewModel.hapticFeedback.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("QuickSpend") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainerLow
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onOpenQuickLog,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add expense")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Daily Allowance Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Today's Allowance", style = MaterialTheme.typography.titleMedium)
                        Text("$${dailyAllowance:.2f}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("$${remainingToday:.2f}", style = MaterialTheme.typography.displayMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (remainingToday >= 0) MaterialTheme.colorScheme.primary else Color.Red
                        ))
                        Text("$${todayTotal:.2f} used of $${dailyAllowance:.2f}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    LinearProgressIndicator(
                        progress = percentUsed,
                        modifier = Modifier.fillMaxWidth(),
                        color = if (remainingToday >= 0) MaterialTheme.colorScheme.primary else Color.Red,
                        trackColor = MaterialTheme.colorScheme.surfaceContainerHighest
                    )
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("${(percentUsed * 100).toInt()}% used", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Recent Expenses
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Recent Expenses", style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = { /* TODO: open all expenses */ }) {
                    Text("View All")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (expenses.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(16.dp))
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.ReceiptLong, contentDescription = "", tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f), size = 48.dp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No expenses yet", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Tap + to log your first expense", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    items(expenses.take(10)) { expense ->
                        ExpenseItem(expense, currencySymbol)
                        Divider(modifier = Modifier.padding(start = 72.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ExpenseItem(expense: Expense, currencySymbol: String) {
    val icon = when (expense.category) {
        "Food & Dining" -> Icons.Default.Restaurant
        "Coffee" -> Icons.Default.LocalCafe
        "Transport" -> Icons.Default.DirectionsBus
        "Shopping" -> Icons.Default.ShoppingBag
        "Entertainment" -> Icons.Default.SportsEsports
        "Bills" -> Icons.Default.Receipt
        "Health" -> Icons.Default.LocalHospital
        else -> Icons.Default.Category
    }
    
    val dateFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .height(64.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(40.dp)
                .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(12.dp))
                .align(Alignment.Center),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = "", tint = MaterialTheme.colorScheme.primary, size = 24.dp)
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Text(expense.name, style = MaterialTheme.typography.bodyLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(expense.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        
        Column(
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.End
        ) {
            Text("$${expense.amount:.2f}", style = MaterialTheme.typography.bodyLarge.copy(
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            ))
            Text(dateFormat.format(expense.getDate()), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun QuickLogScreen(onClose: () -> Unit) {
    val viewModel: MainViewModel = viewModel()
    val currencySymbol by viewModel.currencySymbol.collectAsStateWithLifecycle()
    val hapticFeedback by viewModel.hapticFeedback.collectAsStateWithLifecycle()
    val categories = remember { listOf("Food & Dining", "Coffee", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Other") }
    
    var amount by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(categories[0]) }
    var showCategoryDropdown by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Quick Log", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Enter amount and tap Save", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Amount input
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(currencySymbol, style = MaterialTheme.typography.displayLarge.copy(fontWeight = FontWeight.Medium), color = MaterialTheme.colorScheme.onSurfaceVariant)
                TextField(
                    value = amount,
                    onValueChange = { amount = it },
                    modifier = Modifier
                        .width(200.dp)
                        .padding(start = 8.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    textStyle = MaterialTheme.typography.displayLarge.copy(fontWeight = FontWeight.Medium),
                    singleLine = true,
                    placeholder = { Text("0.00", style = MaterialTheme.typography.displayLarge.copy(fontWeight = FontWeight.Medium), color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Name field
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("What for? (optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Category dropdown
        MenuAnchor = { dropdownMenu ->
            DropdownMenu(
                expanded = showCategoryDropdown,
                onDismissRequest = { showCategoryDropdown = false }
            ) {
                categories.forEach { cat ->
                    DropdownMenuItem(
                        text = { Text(cat) },
                        onClick = {
                            selectedCategory = cat
                            showCategoryDropdown = false
                        }
                    )
                }
            }
        }
        
        OutlinedTextField(
            value = selectedCategory,
            onValueChange = {},
            label = { Text("Category") },
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                IconButton(onClick = { showCategoryDropdown = !showCategoryDropdown }) {
                    Icon(Icons.Default.ExpandMore, contentDescription = "Category")
                }
            },
            readOnly = true
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Save button
        Button(
            onClick = {
                val amountValue = amount.toDoubleOrNull()
                if (amountValue != null && amountValue > 0) {
                    val expense = Expense(
                        name = if (name.isBlank()) selectedCategory else name,
                        category = selectedCategory,
                        amount = amountValue,
                        icon = selectedCategory.lowercase().replace(" ", "_")
                    )
                    viewModel.addExpense(expense)
                    
                    if (hapticFeedback) {
                        // Haptic feedback
                        val context = LocalContext.current
                        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
                        vibrator?.vibrate(android.os.VibrationEffect.createOneShot(50, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
                    }
                    
                    onClose()
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = amount.toDoubleOrNull() != null && amount.toDoubleOrNull()!! > 0,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        ) {
            Text("Save Expense", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
        }
    }
}

@Composable
fun SettingsScreen() {
    val viewModel: MainViewModel = viewModel()
    val monthlyBudget by viewModel.monthlyBudget.collectAsStateWithLifecycle()
    val currency by viewModel.currency.collectAsStateWithLifecycle()
    val hapticFeedback by viewModel.hapticFeedback.collectAsStateWithLifecycle()
    val currencies = remember { listOf("USD", "EUR", "GBP", "INR", "AED") }
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Settings") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column {
                    ListItem(
                        headlineContent = { Text("Monthly Budget") },
                        supportingContent = { Text("Total monthly allocation") },
                        trailingContent = {
                            OutlinedTextField(
                                value = monthlyBudget.toString(),
                                onValueChange = { viewModel.updateMonthlyBudget(it.toDoubleOrNull() ?: monthlyBudget) },
                                modifier = Modifier.width(120.dp),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                            )
                        }
                    )
                    Divider()
                    ListItem(
                        headlineContent = { Text("Currency") },
                        trailingContent = {
                            MenuAnchor = { dropdownMenu ->
                                DropdownMenu(
                                    expanded = false, // simplified
                                    onDismissRequest = {}
                                ) {
                                    currencies.forEach { curr ->
                                        DropdownMenuItem(
                                            text = { Text(curr) },
                                            onClick = { viewModel.updateCurrency(curr) }
                                        )
                                    }
                                }
                            }
                            Text(currency)
                        }
                    )
                    Divider()
                    ListItem(
                        headlineContent = { Text("Haptic Feedback") },
                        supportingContent = { Text("Vibration on save") },
                        trailingContent = {
                            Switch(
                                checked = hapticFeedback,
                                onCheckedChange = { viewModel.setHapticFeedback(it) }
                            )
                        }
                    )
                    Divider()
                    ListItem(
                        headlineContent = { Text("Power Button Double-Tap") },
                        supportingContent = { Text("Open Quick Log with double-press power") },
                        trailingContent = {
                            Switch(
                                checked = false, // TODO: connect to settings
                                onCheckedChange = { viewModel.setPowerButtonDoubleTap(it) }
                            )
                        }
                    )
                }
            }
        }
    }
}

// Quick Settings Tile Service
class QuickLogTileService : TileService() {
    override fun onClick(request: TileRequest) {
        super.onClick(request)
        val context = applicationContext
        val intent = Intent(context, MainActivity::class.java)
            .apply {
                action = "QUICK_LOG"
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
        context.startActivity(intent)
        
        // Update tile state
        val tile = getQsTile()
        tile.state = Tile.STATE_ACTIVE
        tile.updateTile()
    }
    
    override fun onTileAdded() {
        super.onTileAdded()
        val tile = getQsTile()
        tile.label = "Quick Log"
        tile.icon = Icon.createWithResource(applicationContext, R.drawable.ic_bolt)
        tile.updateTile()
    }
}

// Power Button Double-Tap Receiver (requires special permission)
class PowerButtonReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_SCREEN_ON) {
            // Check for double-tap - this requires SYSTEM_ALERT_WINDOW or special OEM APIs
            // Most Android versions don't expose power button double-tap to apps directly
            // Alternative: Use Quick Settings Tile or Accessibility Service
        }
    }
}

@Composable
@Preview(showBackground = true)
fun QuickSpendPreview() {
    QuickSpendApp()
}