// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "QuickSpendMac",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "QuickSpendMac", targets: ["QuickSpendMac"])
    ],
    dependencies: [
        .package(url: "https://github.com/sindresorhus/KeyboardShortcuts", from: "1.5.0"),
        .package(url: "https://github.com/sindresorhus/LaunchAtLogin", from: "1.3.0"),
        .package(url: "https://github.com/sindresorhus/Defaults", from: "7.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "QuickSpendMac",
            dependencies: [
                .product(name: "KeyboardShortcuts", package: "KeyboardShortcuts"),
                .product(name: "LaunchAtLogin", package: "LaunchAtLogin"),
                .product(name: "Defaults", package: "Defaults"),
            ],
            resources: [.process("Resources")]
        )
    ]
)