import SwiftUI
import WorkoutCore

/// App entry point. Opens the database once and starts automatic backups.
@main
struct WorkoutTrackerApp: App {
    /// The environment, or the error that stopped the database from opening.
    @State private var launch: Result<AppEnvironment, any Error> = Result { try AppEnvironment.live() }
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage(AppearancePreference.storageKey) private var appearance = AppearancePreference.system

    var body: some Scene {
        WindowGroup {
            Group {
                switch launch {
                case .success(let environment):
                    RootView(environment: environment)
                case .failure(let error):
                    LaunchErrorView(error: error)
                }
            }
            .preferredColorScheme(appearance.colorScheme)
        }
        .onChange(of: scenePhase) { _, phase in
            // Back up whenever the app leaves the screen (throttled by BackupPolicy).
            guard phase == .background, case .success(let environment) = launch else { return }
            environment.backupSettings.backUpIfDue()
        }
    }
}
