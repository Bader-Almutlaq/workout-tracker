import SwiftUI
import WorkoutCore

/// A row of chips that filter exercises by primary muscle and by equipment.
///
/// It looks and behaves like the chips on the Exercises tab. That tab keeps its own private copy;
/// it can adopt this view later (it was out of scope for the logging task).
struct ExerciseFilterRow: View {
    @Binding var filter: ExerciseSearch.Filter

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.s) {
                muscleMenu
                equipmentMenu
            }
            .padding(.horizontal, Spacing.l)
            .padding(.vertical, Spacing.s)
        }
    }

    private var muscleMenu: some View {
        Menu {
            Button {
                filter.muscle = nil
            } label: {
                checkedLabel("Any muscle", isChecked: filter.muscle == nil)
            }
            ForEach(MusclePickerView.groups, id: \.region) { group in
                Section(group.region.displayName) {
                    ForEach(group.muscles, id: \.self) { muscle in
                        Button {
                            filter.muscle = muscle
                        } label: {
                            checkedLabel(muscle.displayName, isChecked: filter.muscle == muscle)
                        }
                    }
                }
            }
        } label: {
            FilterChip(
                title: filter.muscle?.displayName ?? "Muscle",
                isActive: filter.muscle != nil, showsChevron: true
            )
        }
    }

    private var equipmentMenu: some View {
        Menu {
            Button {
                filter.equipment = nil
            } label: {
                checkedLabel("Any equipment", isChecked: filter.equipment == nil)
            }
            ForEach(Equipment.allCases, id: \.self) { equipment in
                Button {
                    filter.equipment = equipment
                } label: {
                    checkedLabel(equipment.displayName, isChecked: filter.equipment == equipment)
                }
            }
        } label: {
            FilterChip(
                title: filter.equipment?.displayName ?? "Equipment",
                isActive: filter.equipment != nil, showsChevron: true
            )
        }
    }

    @ViewBuilder
    private func checkedLabel(_ title: String, isChecked: Bool) -> some View {
        if isChecked {
            Label(title, systemImage: "checkmark")
        } else {
            Text(title)
        }
    }
}
