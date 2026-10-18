import SwiftUI
import KeyboardShortcuts
import LaunchAtLogin

@main
struct QuickSpendMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var store = ExpenseStore()
    @StateObject private var settings = Settings()

    var body: some Scene {
        MenuBarExtra {
            ContentView()
                .environmentObject(store)
                .environmentObject(settings)
                .frame(width: 320)
        } label: {
            Image(systemName: "bolt.fill")
                .foregroundStyle(.mint)
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView()
                .environmentObject(settings)
                .frame(width: 480, height: 400)
        }

        WindowGroup(id: "quick-log") {
            QuickLogView()
                .environmentObject(store)
                .environmentObject(settings)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Register global shortcut
        KeyboardShortcuts.onKeyUp(for: .quickLog) {
            NSApp.sendAction(#selector(showQuickLogWindow), to: nil, from: nil)
        }
        
        // Register for power button double-press (via accessibility)
        setupPowerButtonListener()
    }
    
    @objc func showQuickLogWindow() {
        for window in NSApp.windows where window.identifier?.rawValue == "quick-log" {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        // Create new window if none exists
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 360, height: 420),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.identifier = NSUserInterfaceItemIdentifier("quick-log")
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.isMovableByWindowBackground = true
        window.center()
        window.contentView = NSHostingView(rootView: QuickLogView()
            .environmentObject(ExpenseStore.shared)
            .environmentObject(Settings.shared))
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    private func setupPowerButtonListener() {
        // Note: Double-press power button requires special entitlements
        // For now, we use the global keyboard shortcut ⌥⌘L
        // Power button handling would require IOHIDManager and special permissions
    }
}

// Shared instances for cross-window access
extension ExpenseStore {
    static let shared = ExpenseStore()
}

extension Settings {
    static let shared = Settings()
}