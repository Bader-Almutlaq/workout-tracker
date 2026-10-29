import SwiftUI
import WorkoutCore

/// One set in the logging screen: label, last session's numbers, the editable cells and the check.
///
/// It draws what it is given and reports taps; the model decides what they do.
struct SetRowView: View {
    /// Widths shared with the column header in ``ExerciseLogCard`` so the columns line up.
    enum Column {
        static let set: CGFloat = 32
        static let weight: CGFloat = 68
        static let reps: CGFloat = 56
        static let rpe: CGFloat = 44
        static let check: CGFloat = 36
        /// Height of a value cell and of the row's tap targets.
        static let height: CGFloat = 40
    }

    let set: WorkoutSet
    let tracking: ExerciseTracking
    /// The unit shown in the column header; a completed set in another unit shows its own unit next to the number.
    let exerciseUnit: WeightUnit
    /// "1", "2"…, or "W", "D", "F".
    let label: String
    /// The set done at the same position last session, if any.
    let previous: WorkoutSet?
    /// Which cell of this row the number pad is typing into, if any.
    let editingField: ActiveWorkoutModel.Field?
    /// The text typed so far in that cell.
    let draftText: String
    let onEdit: (ActiveWorkoutModel.Field) -> Void
    let onToggleCompleted: () -> Void
    let onSelectKind: (SetKind) -> Void

    var body: some View {
        HStack(spacing: Spacing.xs) {
            kindMenu
            Text(previous?.previousText(tracking: tracking, in: set.entryUnit) ?? "—")
                .font(AppFont.callout.monospacedDigit())
                .foregroundStyle(AppColor.textSecondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, alignment: .leading)
            if tracking.recordsWeight { weightCell }
            repsCell
            rpeCell
            checkButton
        }
        .padding(.horizontal, Spacing.m)
        .padding(.vertical, Spacing.xs)
        .background(set.isCompleted ? AppColor.accentSubtle : Color.clear)
    }

    // MARK: Cells

    private var kindMenu: some View {
        Menu {
            ForEach(SetKind.allCases, id: \.self) { kind in
                Button {
                    onSelectKind(kind)
                } label: {
                    if kind == set.kind {
                        Label(kind.displayName, systemImage: "checkmark")
                    } else {
                        Text(kind.displayName)
                    }
                }
            }
        } label: {
            Text(label)
                .font(AppFont.callout.monospacedDigit())
                .foregroundStyle(set.kind == .working ? AppColor.textTertiary : AppColor.accent)
                .frame(width: Column.set, height: Column.height, alignment: .leading)
                .contentShape(.rect)
        }
        .accessibilityLabel("Set \(label), \(set.kind.displayName)")
    }

    private var weightCell: some View {
        let showsOwnUnit = set.entryUnit != exerciseUnit && !(tracking.isBodyweightLoad && set.weightKilograms == 0)
        return valueCell(
            .weight, text: set.weightText(tracking: tracking), width: Column.weight,
            isEmpty: set.weightKilograms == 0 && !tracking.isBodyweightLoad,
            unitSuffix: showsOwnUnit ? set.entryUnit.symbol : nil
        )
    }

    private var repsCell: some View {
        let amount = tracking.recordsDuration ? (set.durationSeconds ?? 0) : Double(set.reps)
        return valueCell(.reps, text: set.repsText(tracking: tracking), width: Column.reps, isEmpty: amount == 0)
    }

    private var rpeCell: some View {
        valueCell(.rpe, text: set.rpeText, width: Column.rpe, isEmpty: set.rpe == nil)
    }

    private func valueCell(
        _ field: ActiveWorkoutModel.Field, text: String, width: CGFloat, isEmpty: Bool, unitSuffix: String? = nil
    ) -> some View {
        let isEditing = editingField == field
        let shown = isEditing ? (draftText.isEmpty ? (field == .rpe ? "—" : "0") : draftText) : text
        let isPlaceholder = isEditing ? draftText.isEmpty : isEmpty
        return Button {
            onEdit(field)
        } label: {
            HStack(spacing: 2) {
                Text(shown)
                    .font(AppFont.body.monospacedDigit())
                    .foregroundStyle(isPlaceholder ? AppColor.textTertiary : AppColor.textPrimary)
                if let unitSuffix, !isEditing {
                    Text(unitSuffix).font(AppFont.caption).foregroundStyle(AppColor.textTertiary)
                }
            }
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .frame(width: width, height: Column.height)
            .background(AppColor.surfaceRaised, in: .rect(cornerRadius: Radius.small))
            .overlay {
                if isEditing {
                    RoundedRectangle(cornerRadius: Radius.small).strokeBorder(AppColor.borderStrong, lineWidth: 1)
                }
            }
            .contentShape(.rect(cornerRadius: Radius.small))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Self.accessibilityName(of: field, tracking: tracking))
        .accessibilityValue(text)
    }

    private var checkButton: some View {
        Button(action: onToggleCompleted) {
            Image(systemName: "checkmark")
                .font(AppFont.headline)
                .foregroundStyle(set.isCompleted ? AppColor.background : AppColor.textTertiary)
                .frame(width: Column.check, height: Column.check - Spacing.xs)
                .background(set.isCompleted ? AppColor.accent : AppColor.surfaceRaised, in: .rect(cornerRadius: Radius.small))
                .frame(height: Column.height)
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(trigger: set.isCompleted) { _, isCompleted in isCompleted ? .success : nil }
        .accessibilityLabel(set.isCompleted ? "Completed" : "Mark as completed")
    }

    private static func accessibilityName(of field: ActiveWorkoutModel.Field, tracking: ExerciseTracking) -> String {
        switch field {
        case .weight: "Weight"
        case .reps: tracking.recordsDuration ? "Time" : "Reps"
        case .rpe: "RPE"
        }
    }
}

#Preview("Rows") {
    let lastTime = WorkoutSet(
        workoutExerciseId: 1, position: 0, kind: .working, weightKilograms: 61.23, entryUnit: .pounds, reps: 8
    )
    VStack(spacing: 0) {
        ForEach([SetKind.warmup, .working, .failure], id: \.self) { kind in
            SetRowView(
                set: WorkoutSet(
                    workoutExerciseId: 1, position: 0, kind: kind, weightKilograms: 61.23, entryUnit: .pounds,
                    reps: 8, rpe: 8.5, isCompleted: kind == .working
                ),
                tracking: .weightAndReps, exerciseUnit: .pounds, label: kind.letter ?? "1", previous: lastTime,
                editingField: kind == .failure ? .reps : nil, draftText: "10",
                onEdit: { _ in }, onToggleCompleted: {}, onSelectKind: { _ in }
            )
        }
    }
    .background(AppColor.surface)
}
