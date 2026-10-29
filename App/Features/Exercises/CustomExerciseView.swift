import SwiftUI
import WorkoutCore

/// The sheet for creating or editing the owner's own exercise.
struct CustomExerciseView: View {
    @Bindable var model: CustomExerciseModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $model.draft.name)
                        .font(AppFont.body)
                        .textInputAutocapitalization(.words)
                        .listRowBackground(AppColor.surface)
                }
                Section {
                    equipmentPicker
                    patternPicker
                    mechanicPicker
                    trackingPicker
                }
                Section {
                    musclesRow(
                        "Primary muscles", muscles: model.draft.primaryMuscles,
                        destination: {
                            MusclePickerView(
                                title: "Primary muscles", selected: model.draft.primaryMuscles,
                                onToggle: model.togglePrimary
                            )
                        }
                    )
                    musclesRow(
                        "Secondary muscles", muscles: model.draft.secondaryMuscles,
                        destination: {
                            MusclePickerView(
                                title: "Secondary muscles", selected: model.draft.secondaryMuscles,
                                disabled: Set(model.draft.primaryMuscles), onToggle: model.toggleSecondary
                            )
                        }
                    )
                    Toggle("Long-length bias", isOn: $model.draft.isLengthenedBiased)
                        .font(AppFont.body)
                        .tint(AppColor.accent)
                        .listRowBackground(AppColor.surface)
                } footer: {
                    Text("Long-length bias: the exercise loads the target muscle hardest when it is stretched.")
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textTertiary)
                }
                if let message = model.errorMessage {
                    Section {
                        Text(message)
                            .font(AppFont.body)
                            .foregroundStyle(AppColor.Status.critical)
                            .listRowBackground(AppColor.surface)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(AppColor.background)
            .navigationTitle(model.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if model.save() { dismiss() }
                    }
                    .disabled(!model.canSave)
                }
            }
        }
    }

    private var equipmentPicker: some View {
        Picker("Equipment", selection: $model.draft.equipment) {
            Text("None").tag(Equipment?.none)
            ForEach(Equipment.allCases, id: \.self) { equipment in
                Text(equipment.displayName).tag(Equipment?.some(equipment))
            }
        }
        .font(AppFont.body)
        .listRowBackground(AppColor.surface)
    }

    private var patternPicker: some View {
        Picker("Pattern", selection: $model.draft.pattern) {
            Text("None").tag(MovementPattern?.none)
            ForEach(MovementPattern.allCases, id: \.self) { pattern in
                Text(pattern.displayName).tag(MovementPattern?.some(pattern))
            }
        }
        .font(AppFont.body)
        .listRowBackground(AppColor.surface)
    }

    private var mechanicPicker: some View {
        Picker("Type", selection: $model.draft.mechanic) {
            Text("Any").tag(Mechanic?.none)
            ForEach(Mechanic.allCases, id: \.self) { mechanic in
                Text(mechanic.displayName).tag(Mechanic?.some(mechanic))
            }
        }
        .pickerStyle(.segmented)
        .listRowBackground(AppColor.surface)
    }

    private var trackingPicker: some View {
        Picker("Tracking", selection: $model.draft.tracking) {
            ForEach(ExerciseTracking.allCases, id: \.self) { tracking in
                Text(tracking.displayName).tag(tracking)
            }
        }
        .font(AppFont.body)
        .listRowBackground(AppColor.surface)
    }

    private func musclesRow(_ title: String, muscles: [Muscle], destination: @escaping () -> MusclePickerView) -> some View {
        // The destination is built lazily so the picker re-reads the draft after every tap.
        NavigationLink {
            destination()
        } label: {
            HStack {
                Text(title).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                Spacer()
                Text(muscles.isEmpty ? "None" : muscles.map(\.displayName).joined(separator: ", "))
                    .font(AppFont.callout)
                    .foregroundStyle(AppColor.textTertiary)
                    .lineLimit(1)
            }
        }
        .listRowBackground(AppColor.surface)
    }
}

#Preview("New") {
    let environment = AppEnvironment.preview()
    CustomExerciseView(model: environment.exercises.makeNewExerciseModel(name: "Zottman Curl (Dumbbell)"))
}
