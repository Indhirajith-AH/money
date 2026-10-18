import Foundation
import SwiftUI
import KeyboardShortcuts
import LaunchAtLogin
import Defaults

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var popover: NSPopover?
    var eventMonitor: EventMonitor?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Set up global keyboard shortcut (Option+Command+L)
        KeyboardShortcuts.onKeyUp(for: .quickLog) { [weak self] in
            self?.togglePopover()
        }
        
        // Create status bar item (Menu Bar)
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "bolt.fill", accessibilityDescription: "QuickSpend")
            button.image?.isTemplate = true
            button.action = #selector(togglePopover(_:))
            button.target = self
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        
        // Create popover with SwiftUI content
        let popover = NSPopover()
        popover.contentSize = NSSize(width: 360, height: 500)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(rootView: PopoverView())
        self.popover = popover
        
        // Monitor events outside popover to close it
        eventMonitor = EventMonitor(mask: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
            if let self = self, self.popover?.isShown == true {
                self.closePopover(event)
            }
        }
        eventMonitor?.start()
        
        // Launch at login if enabled
        if Defaults[.launchAtLogin] {
            LaunchAtLogin.isEnabled = true
        }
    }
    
    @objc func togglePopover(_ sender: Any?) {
        if let popover = popover, popover.isShown {
            closePopover(sender)
        } else {
            showPopover(sender)
        }
    }
    
    func showPopover(_ sender: Any?) {
        if let button = statusItem?.button, let popover = popover {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            eventMonitor?.start()
        }
    }
    
    func closePopover(_ sender: Any?) {
        popover?.performClose(sender)
        eventMonitor?.stop()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        eventMonitor?.stop()
    }
}

class EventMonitor {
    private var monitor: Any?
    private let mask: NSEvent.EventTypeMask
    private let handler: (NSEvent?) -> Void
    
    init(mask: NSEvent.EventTypeMask, handler: @escaping (NSEvent?) -> Void) {
        self.mask = mask
        self.handler = handler
    }
    
    func start() {
        monitor = NSEvent.addGlobalMonitorForEvents(matching: mask, handler: handler)
    }
    
    func stop() {
        if let monitor = monitor {
            NSEvent.removeMonitor(monitor)
            self.monitor = nil
        }
    }
}

extension Defaults.Keys {
    static let launchAtLogin = Key<Bool>("launchAtLogin", default: false)
    static let monthlyBudget = Key<Double>("monthlyBudget", default: 2250.0)
    static let currency = Key<String>("currency", default: "USD")
    static let hapticFeedback = Key<Bool>("hapticFeedback", default: true)
}