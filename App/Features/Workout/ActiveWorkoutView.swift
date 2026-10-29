import SwiftUI
import WorkoutCore

/// The screen for the workout being logged: a card per exercise, the timer, Finish, and the number pad.
struct ActiveWorkoutView: View {
    let model: ActiveWorkoutModel

    /// The add-exercise sheet's model while the sheet is open.
    @State private var picker: ExercisePickerModel?
    @State private var isRenaming = false
    @State private var renameText = ""

    var body: some View {
        NavigationStack {
            content
                .background(AppColor.background)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { toolbar }
                .safeAreaInset(edge: .bottom, spacing: 0) { pad }
                // The pad takes the tab bar's place so it never covers the rows being edited.
                .toolbarVisibility(model.editing == nil ? .automatic : .hidden, for: .tabBar)
        }
        .task { await model.observe() }
        .sheet(item: $picker) { pickerModel in
            ExercisePickerView(model: pickerModel) { model.addExercises($0) }
        }
        .confirmationDialog(
            model.confirmation?.title ?? "",
            isPresented: Binding(
                get: { model.confirmation != nil },
                set: { if !$0 { model.confirmation = nil } }
            ),
            titleVisibility: .visible,
            presenting: model.confirmation
        ) { confirmation in
            Button(confirmation.confirmLabel, role: confirmation.isDestructive ? .destructive : nil) {
                model.confirm(confirmation)
            }
        } message: { confirmation in
            Text(confirmation.message)
        }
        .alert("Rename workout", isPresented: $isRenaming) {
            TextField("Name", text: $renameText)
            Button("Save") { model.rename(to: renameText) }
            Button("Cancel", role: .cancel) {}
        }
    }

    // MARK: Content

    @ViewBuilder
    private var content: some View {
        if let message = model.loadError {
            EmptyStateView(title: "Couldn't load the workout", message: message)
        } else if let snapshot = model.snapshot {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: Spacing.m) {
                        if let message = model.queue.errorMessage, model.editing == nil {
                            ErrorBanner(message: message, onDismiss: model.queue.dismissError)
                        }
                        ForEach(Array(snapshot.entries.enumerated()), id: \.element.id) { index, entry in
                            ExerciseLogCard(model: model, entry: entry, index: index, count: snapshot.entries.count)
                        }
                        addExerciseButton
                    }
                    .padding(Spacing.l)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: model.editing) { _, cell in
                    guard let cell else { return }
                    withAnimation(Motion.standard) { proxy.scrollTo(cell.setID, anchor: .center) }
                }
            }
        } else {
            ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var addExerciseButton: some View {
        Button {
            model.commitEdit()
            picker = model.makePickerModel()
        } label: {
            Label("Add exercise", systemImage: "plus")
                .font(AppFont.headline)
                .foregroundStyle(AppColor.textPrimary)
                .frame(maxWidth: .infinity, minHeight: PrimaryButtonStyle.height)
                .background(AppColor.surface, in: .rect(cornerRadius: Radius.medium))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.medium).strokeBorder(AppColor.border, lineWidth: 0.5)
                }
                .contentShape(.rect(cornerRadius: Radius.medium))
        }
        .buttonStyle(.plain)
    }

    // MARK: Number pad

    @ViewBuilder
    private var pad: some View {
        if model.editing != nil {
            NumberPad(
                title: model.padTitle ?? "",
                allowsDecimal: model.padAllowsDecimal,
                errorMessage: model.queue.errorMessage,
                onDismissError: model.queue.dismissError,
                onKey: { key in
                    switch key {
                    case .digit(let digit): model.type(digit: digit)
                    case .decimalPoint: model.typeDecimalPoint()
                    case .backspace: model.deleteBackward()
                    }
                },
                onStep: model.step(direction:),
                onNext: model.next,
                onDone: model.commitEdit
            )
        }
    }

    // MARK: Top bar

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Menu {
                Button("Discard workout", systemImage: "trash", role: .destructive) {
                    model.confirmation = .discardWorkout
                }
            } label: {
                Image(systemName: "ellipsis").foregroundStyle(AppColor.textSecondary)
            }
            .accessibilityLabel("Workout options")
        }
        ToolbarItem(placement: .principal) {
            VStack(spacing: 0) {
                Button {
                    renameText = model.snapshot?.workout.name ?? ""
                    isRenaming = true
                } label: {
                    Text(model.snapshot?.workout.name ?? "")
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.textPrimary)
                        .lineLimit(1)
                }
                .accessibilityHint("Rename workout")
                elapsedTime
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button("Finish") { model.requestFinish() }
                .font(AppFont.headline)
                .foregroundStyle(AppColor.accent)
        }
    }

    @ViewBuilder
    private var elapsedTime: some View {
        if let startedAt = model.snapshot?.workout.startedAt {
            TimelineView(.periodic(from: startedAt, by: 1)) { context in
                Text(context.date.timeIntervalSince(startedAt).clockText)
                    .font(AppFont.callout.monospacedDigit())
                    .foregroundStyle(AppColor.textSecondary)
            }
        }
    }
}

#if DEBUG
#Preview("Active workout") {
    ActiveWorkoutView(model: WorkoutPreviewData.activeWorkoutModel())
}

#Preview("Number pad open") {
    let model = WorkoutPreviewData.activeWorkoutModel()
    ActiveWorkoutView(model: model)
        .task {
            // Wait for the first read of the preview database, then open the pad on the first weight.
            while model.snapshot == nil { try? await Task.sleep(for: .milliseconds(50)) }
            if let setID = model.snapshot?.entries.first?.sets.first?.id {
                model.beginEditing(setID: setID, field: .weight)
            }
        }
}
#endif
