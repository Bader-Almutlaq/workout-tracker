// swift-tools-version: 6.2
// WorkoutCore holds every piece of app logic (models, database, import, analytics, backup).
// It has no UI dependencies, so `swift test` runs it on the Mac.

import PackageDescription

let package = Package(
    name: "WorkoutCore",
    platforms: [
        .iOS(.v26),
        .macOS(.v15),
    ],
    products: [
        .library(name: "WorkoutCore", targets: ["WorkoutCore"]),
    ],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0"),
    ],
    targets: [
        .target(
            name: "WorkoutCore",
            dependencies: [.product(name: "GRDB", package: "GRDB.swift")]
        ),
        .testTarget(
            name: "WorkoutCoreTests",
            dependencies: ["WorkoutCore"]
        ),
    ],
    swiftLanguageModes: [.v6]
)
