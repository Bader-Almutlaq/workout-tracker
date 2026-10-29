import SwiftUI
import WorkoutCore

/// A sheet to pick one or more exercises to add to the workout. Tapping a row ticks it;
/// "Add (n)" appends the ticked exercises in the order they were picked.
struct ExercisePickerView: View {
    @Bindable var model: ExercisePickerModel
    /// Called with the ticked exercises, in tick order, when "Add" is tapped.
    let onAdd: ([Int64]) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            content
                .background(AppColor.background)
                .navigationTitle("Add exercises")
                .navigationBarTitleDisplayMode(.inline)
                .searchable(text: $model.query, prompt: "Search exercises")
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(model.selection.isEmpty ? "Add" : "Add (\(model.selection.count))") {
                            onAdd(model.selection)
                            dismiss()
                        }
                        .font(AppFont.headline)
                        .disabled(model.selection.isEmpty)
                    }
                }
        }
        .task { await model.observe() }
    }

    @ViewBuilder
    private var content: some View {
        if let message = model.errorMessage {
            EmptyStateView(title: "Couldn't load exercises", message: message)
        } else {
            VStack(spacing: 0) {
                ExerciseFilterRow(filter: $model.filter)
                let results = model.results
                if results.isEmpty {
                    EmptyStateView(title: "No match", message: "Try another name, or clear the filters.")
                } else {
                    List(results) { row($0) }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                }
            }
        }
    }

    private func row(_ entry: ExerciseSearch.Entry) -> some View {
        let isSelected = model.isSelected(entry.id)
        return Button {
            model.toggle(entry.id)
        } label: {
            HStack(spacing: Spacing.m) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.name).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                    Text(model.subtitle(for: entry))
                        .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                }
                Spacer(minLength: Spacing.s)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.accent)
                }
            }
            .padding(.vertical, Spacing.xs)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .listRowBackground(isSelected ? AppColor.accentSubtle : AppColor.surface)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

#Preview {
    let environment = AppEnvironment.preview()
    ExercisePickerView(
        model: ExercisePickerModel(database: environment.database, library: environment.library),
        onAdd: { _ in }
    )
}
