import SwiftUI
import WorkoutCore

/// Shown instead of the app when the database can't be opened.
///
/// Never crash here: the data file is still on disk, and the message tells the
/// owner what happened (for example, a backup from a newer app version).
struct LaunchErrorView: View {
    let error: any Error

    var body: some View {
        EmptyStateView(
            title: "Your data couldn't be opened",
            message: error.localizedDescription + "\n\nNothing has been deleted."
        )
        .onAppear {
            Log.database.fault("Launch failed: \(String(describing: error), privacy: .public)")
        }
    }
}
