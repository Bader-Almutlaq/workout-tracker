import SwiftUI
import WorkoutCore

/// A multi-select list of muscles grouped by body region. Used for an exercise's primary and
/// secondary muscles.
///
/// The view only shows state: the model decides what a tap does (see ``CustomExerciseModel``).
struct MusclePickerView: View {
    let title: String
    let selected: [Muscle]
    /// Muscles that can't be chosen here, shown dimmed (a primary muscle in the secondary list).
    var disabled: Set<Muscle> = []
    let onToggle: (Muscle) -> Void

    /// Every muscle grouped by region, head to toe. Also the order of the muscle filter menu.
    static let groups: [(region: MuscleRegion, muscles: [Muscle])] = MuscleRegion.allCases.map { region in
        (region, Muscle.allCases.filter { $0.region == region })
    }

    var body: some View {
        List {
            ForEach(Self.groups, id: \.region) { group in
                Section {
                    ForEach(group.muscles, id: \.self) { muscle in
                        row(muscle)
                    }
                } header: {
                    SectionLabel(group.region.displayName)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(AppColor.background)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func row(_ muscle: Muscle) -> some View {
        let isDisabled = disabled.contains(muscle)
        return Button {
            onToggle(muscle)
        } label: {
            HStack {
                Text(muscle.displayName)
                    .font(AppFont.body)
                    .foregroundStyle(isDisabled ? AppColor.textTertiary : AppColor.textPrimary)
                Spacer()
                if selected.contains(muscle) {
                    Image(systemName: "checkmark")
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.accent)
                }
            }
            .contentShape(.rect)
        }
        .disabled(isDisabled)
        .listRowBackground(AppColor.surface)
    }
}

#Preview {
    NavigationStack {
        MusclePickerView(title: "Secondary muscles", selected: [.triceps], disabled: [.chest], onToggle: { _ in })
    }
}
