import SwiftUI
import WorkoutCore

/// One exercise in the workout being logged: its name, unit chip, column header, set rows and "Add set".
struct ExerciseLogCard: View {
    let model: ActiveWorkoutModel
    let entry: LiveWorkout.Entry
    /// Position in the workout (0-based) and the number of exercises, to disable Move up / Move down at the ends.
    let index: Int
    let count: Int

    private var tracking: ExerciseTracking { entry.exercise.tracking }
    private var unit: WeightUnit { entry.exercise.defaultEntryUnit }

    var body: some View {
        Card {
            header
            columnHeader
            ForEach(Array(entry.sets.enumerated()), id: \.element.id) { position, set in
                HairlineDivider()
                row(set, position: position)
            }
            HairlineDivider()
            addSetButton
        }
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: Spacing.s) {
            Text(entry.exercise.name)
                .font(AppFont.headline)
                .foregroundStyle(AppColor.textPrimary)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
            if tracking.recordsWeight, let entryID = entry.id {
                Button {
                    model.toggleUnit(entryID: entryID)
                } label: {
                    FilterChip(title: unit.symbol, isActive: false)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Unit \(unit.symbol). Tap to switch to \(unit.toggled.symbol).")
            }
            menu
        }
        .padding(.horizontal, Spacing.m)
        .padding(.vertical, Spacing.s)
    }

    private var menu: some View {
        Menu {
            if let entryID = entry.id {
                Button("Move up", systemImage: "arrow.up") { model.moveExercise(entryID: entryID, by: -1) }
                    .disabled(index == 0)
                Button("Move down", systemImage: "arrow.down") { model.moveExercise(entryID: entryID, by: 1) }
                    .disabled(index == count - 1)
            }
            Button("Remove exercise", systemImage: "trash", role: .destructive) { model.requestRemoval(of: entry) }
        } label: {
            Image(systemName: "ellipsis")
                .foregroundStyle(AppColor.textSecondary)
                .frame(width: SetRowView.Column.height, height: SetRowView.Column.height)
                .contentShape(.rect)
        }
        .accessibilityLabel("Exercise options")
    }

    private var columnHeader: some View {
        HStack(spacing: Spacing.xs) {
            SectionLabel("Set").frame(width: SetRowView.Column.set, alignment: .leading)
            SectionLabel("Previous").frame(maxWidth: .infinity, alignment: .leading)
            if tracking.recordsWeight {
                SectionLabel((tracking.isBodyweightLoad ? "+" : "") + unit.symbol).frame(width: SetRowView.Column.weight)
            }
            SectionLabel(tracking.recordsDuration ? "Time" : "Reps").frame(width: SetRowView.Column.reps)
            SectionLabel("RPE").frame(width: SetRowView.Column.rpe)
            Image(systemName: "checkmark")
                .font(AppFont.caption)
                .foregroundStyle(AppColor.textTertiary)
                .frame(width: SetRowView.Column.check)
        }
        .padding(.horizontal, Spacing.m)
        .padding(.bottom, Spacing.xs)
    }

    // MARK: Rows

    @ViewBuilder
    private func row(_ set: WorkoutSet, position: Int) -> some View {
        if let setID = set.id {
            let isEditingThisRow = model.editing?.setID == setID
            SetRowView(
                set: set,
                tracking: tracking,
                exerciseUnit: unit,
                label: set.kind.letter ?? String(workingNumber(at: position)),
                previous: entry.previous.indices.contains(position) ? entry.previous[position] : nil,
                editingField: isEditingThisRow ? model.editing?.field : nil,
                draftText: isEditingThisRow ? model.draft.text : "",
                onEdit: { model.beginEditing(setID: setID, field: $0) },
                onToggleCompleted: { model.toggleCompleted(setID: setID) },
                onSelectKind: { model.setKind($0, setID: setID) }
            )
            .id(setID)
            .swipeToDelete(accessibilityName: "Delete set") { model.deleteSet(setID: setID) }
        }
    }

    /// The set's number among the working sets so far (warm-up, drop and failure sets show letters and aren't counted).
    private func workingNumber(at position: Int) -> Int {
        entry.sets[...position].filter { $0.kind == .working }.count
    }

    private var addSetButton: some View {
        Button {
            if let entryID = entry.id { model.addSet(entryID: entryID) }
        } label: {
            Label("Add set", systemImage: "plus")
                .font(AppFont.callout)
                .foregroundStyle(AppColor.accent)
                .frame(maxWidth: .infinity)
                .frame(height: SetRowView.Column.height)
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }
}
