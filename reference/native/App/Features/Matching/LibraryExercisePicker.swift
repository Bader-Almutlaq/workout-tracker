import SwiftUI
import WorkoutCore

/// A searchable list of library exercises, shown as a sheet. Tapping one picks it.
///
/// Only the entries inside `search` are listed, so the caller decides what can be picked
/// (the matching screen passes library exercises only).
struct LibraryExercisePicker: View {
    /// The exercises to choose from.
    let search: ExerciseSearch
    /// Called with the tapped exercise. The caller dismisses the sheet.
    let onPick: (ExerciseSearch.Entry) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    var body: some View {
        let results = search.results(for: query)
        NavigationStack {
            List(results) { entry in
                Button { onPick(entry) } label: {
                    MatchingCandidateRow(entry: entry)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .listRowBackground(AppColor.surface)
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(AppColor.background)
            .overlay {
                if results.isEmpty {
                    EmptyStateView(title: "No match", message: "Try another word, or keep this exercise as your own.")
                }
            }
            .searchable(text: $query, prompt: "Search library")
            .navigationTitle("Library")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

/// A library exercise's name with its primary muscles underneath, used by suggestion rows and the picker.
struct MatchingCandidateRow: View {
    /// The exercise to describe.
    let entry: ExerciseSearch.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.name)
                .font(AppFont.body)
                .foregroundStyle(AppColor.textPrimary)
            Text(entry.primaryMuscles.map(\.displayName).joined(separator: ", "))
                .font(AppFont.callout)
                .foregroundStyle(AppColor.textTertiary)
        }
    }
}
