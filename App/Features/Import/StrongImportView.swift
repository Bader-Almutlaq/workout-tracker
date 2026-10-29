import SwiftUI
import UniformTypeIdentifiers
import WorkoutCore

/// The Strong import flow, shown as a sheet: pick files → review → import.
struct StrongImportView: View {
    @Bindable var model: StrongImportModel
    @Environment(\.dismiss) private var dismiss

    @State private var isPickingFiles = false
    @State private var editing: StrongImportModel.FindingGroup.Item?
    @State private var editedWeight = ""
    @State private var editedReps = ""

    var body: some View {
        NavigationStack {
            content
                .background(AppColor.background)
                .navigationTitle("Import from Strong")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(isFinished ? "Done" : "Cancel") { dismiss() }
                    }
                }
        }
        .fileImporter(
            isPresented: $isPickingFiles, allowedContentTypes: [.commaSeparatedText, .plainText],
            allowsMultipleSelection: true
        ) { result in
            if case .success(let urls) = result, !urls.isEmpty { model.load(urls) }
        }
        .alert("Correct this set", isPresented: Binding(get: { editing != nil }, set: { if !$0 { editing = nil } })) {
            TextField("Weight (\(editing?.set.entryUnit.symbol ?? "kg"))", text: $editedWeight)
                .keyboardType(.decimalPad)
            TextField("Reps", text: $editedReps)
                .keyboardType(.numberPad)
            Button("Save") { saveEdit() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Leave a field as is to keep the logged value.")
        }
    }

    private var isFinished: Bool {
        if case .finished = model.phase { true } else { false }
    }

    @ViewBuilder
    private var content: some View {
        switch model.phase {
        case .pickingFiles:
            pickFilesPrompt
        case .working(let message):
            VStack(spacing: Spacing.m) {
                ProgressView()
                Text(message).font(AppFont.body).foregroundStyle(AppColor.textSecondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let message):
            VStack(spacing: Spacing.l) {
                EmptyStateView(title: "Import didn't work", message: message)
                    .frame(maxHeight: 240)
                Button("Choose files again") { isPickingFiles = true }
                    .buttonStyle(.borderedProminent)
            }
        case .reviewing:
            if let plan = model.plan { review(plan) }
        case .finished(let result):
            finished(result)
        }
    }

    // MARK: - Steps

    private var pickFilesPrompt: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("In Strong: Settings → Export Data. Save the files to Files, then select all of them here: the workouts file and any measurement files.")
                .font(AppFont.body)
                .foregroundStyle(AppColor.textSecondary)
            Text("Nothing is saved until you've reviewed the import.")
                .font(AppFont.callout)
                .foregroundStyle(AppColor.textTertiary)
            Button("Choose files…") { isPickingFiles = true }
                .buttonStyle(.borderedProminent)
            Spacer()
        }
        .padding(Spacing.l)
    }

    private func review(_ plan: StrongImportPlan) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                summary(plan)
                if !model.poundExercises.isEmpty { units }
                findings
            }
            .padding(Spacing.l)
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: Spacing.xs) {
                Button {
                    model.importNow()
                } label: {
                    Text("Import \(plan.totals.workouts) workouts").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                if !plan.findings.isEmpty {
                    Text("Sets you haven't reviewed import as logged.")
                        .font(AppFont.callout)
                        .foregroundStyle(AppColor.textTertiary)
                }
            }
            .padding(Spacing.l)
            .background(AppColor.background)
        }
    }

    private func summary(_ plan: StrongImportPlan) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("What will be imported")
            Card {
                summaryRow("Workouts", plan.totals.workouts.formatted())
                HairlineDivider()
                summaryRow("Sets", "\(plan.totals.sets.formatted()) (\(plan.totals.workSets.formatted()) excluding warm-ups)")
                HairlineDivider()
                summaryRow("Exercises", plan.exercises.count.formatted())
                HairlineDivider()
                summaryRow("Dates", dateRange(plan))
                if !plan.measurements.isEmpty {
                    HairlineDivider()
                    summaryRow("Body measurements", plan.measurements.count.formatted())
                }
            }
        }
    }

    private var units: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            SectionLabel("Exercises Strong exported in pounds")
            Text("Strong exports each exercise in the unit it's set to now. These were detected as pounds and will be converted to kg. Switch one back if it's wrong.")
                .font(AppFont.callout)
                .foregroundStyle(AppColor.textTertiary)
            Card {
                ForEach(Array(model.poundExercises.enumerated()), id: \.element.id) { index, exercise in
                    if index > 0 { HairlineDivider() }
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(exercise.name).font(AppFont.body).foregroundStyle(AppColor.textPrimary)
                            Text("\(exercise.setCount) sets")
                                .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                        }
                        Spacer()
                        Picker("Unit", selection: Binding(
                            get: { exercise.columnUnit },
                            set: { model.setColumnUnit($0, for: exercise.name) }
                        )) {
                            ForEach(WeightUnit.allCases, id: \.self) { Text($0.symbol).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 100)
                    }
                    .padding(Spacing.m)
                }
            }
        }
    }

    private var findings: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            HStack {
                SectionLabel("Check these sets (\(model.plan?.findings.count ?? 0))")
                Spacer()
                if model.reviewedCount > 0 {
                    Button("Reset \(model.reviewedCount) decisions") { model.resetDecisions() }
                        .font(AppFont.callout)
                }
            }
            if model.findingGroups.isEmpty {
                Text("Nothing looks like a typo.")
                    .font(AppFont.body).foregroundStyle(AppColor.textSecondary)
            } else {
                Text("These differ a lot from the same exercise in nearby sessions: maybe a missed digit, an extra zero or the wrong unit.")
                    .font(AppFont.callout).foregroundStyle(AppColor.textTertiary)
                ForEach(model.findingGroups) { group in
                    FindingGroupCard(group: group, model: model) { item in
                        editedWeight = item.set.weight.number(in: item.set.entryUnit)
                        editedReps = String(item.set.reps)
                        editing = item
                    }
                }
            }
        }
    }

    private func finished(_ result: StrongImporter.Result) -> some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Label("Import complete", systemImage: "checkmark.circle")
                .font(AppFont.title)
                .foregroundStyle(AppColor.Status.good)
            Card {
                summaryRow("Workouts added", result.workoutsAdded.formatted())
                HairlineDivider()
                summaryRow("Sets added", result.setsAdded.formatted())
                HairlineDivider()
                summaryRow("New exercises", result.exercisesCreated.formatted())
                HairlineDivider()
                summaryRow("Measurements added", result.measurementsAdded.formatted())
                if result.workoutsSkipped > 0 {
                    HairlineDivider()
                    summaryRow("Already imported (skipped)", result.workoutsSkipped.formatted())
                }
            }
            Spacer()
        }
        .padding(Spacing.l)
    }

    // MARK: - Helpers

    private func summaryRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(AppFont.body).foregroundStyle(AppColor.textSecondary)
            Spacer()
            Text(value).font(AppFont.body.monospacedDigit()).foregroundStyle(AppColor.textPrimary)
        }
        .padding(Spacing.m)
    }

    private func dateRange(_ plan: StrongImportPlan) -> String {
        guard let first = plan.totals.firstDate, let last = plan.totals.lastDate else { return "–" }
        return "\(first.formatted(.dateTime.month(.abbreviated).year())) – \(last.formatted(.dateTime.month(.abbreviated).year()))"
    }

    private func saveEdit() {
        guard let item = editing else { return }
        let weight = Double(editedWeight.replacingOccurrences(of: ",", with: "."))
        let reps = Int(editedReps)
        let weightChanged = weight.map { $0 != item.set.weight.displayValue(in: item.set.entryUnit) } ?? false
        model.correct(item, weight: weightChanged ? weight : nil, unit: item.set.entryUnit, reps: reps == item.set.reps ? nil : reps)
        editing = nil
    }
}
