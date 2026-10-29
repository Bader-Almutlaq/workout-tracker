# T-004: Build the Exercises tab (browse, search, detail, custom exercises)

- **Milestone:** M2
- **Depends on:** T-001, T-002, T-003 (all done)
- **Model tier:** mid

## Goal

The Exercises tab lets the owner find any exercise in about two keystrokes, see which muscles it trains and how often they've done it, and create their own exercises. It replaces the placeholder tab in `App/RootView.swift`.

## Read first

- `AGENTS.md`, `docs/DESIGN.md` (tokens, typography, layout principles), `docs/ARCHITECTURE.md` (layers).
- Existing UI to match in style: `App/Features/History/HistoryView.swift`, `HistoryModel.swift`, `WorkoutDetailView.swift`, and `App/DesignSystem/` (AppColor, AppFont, Spacing, Radius, Card, SectionLabel, HairlineDivider, EmptyStateView, `Weight.formatted(in:)` in WeightFormatting.swift).
- Core API (in `Packages/WorkoutCore/Sources/WorkoutCore/`):
  - `Queries/ExerciseCatalog.swift`: `observeEntries(in:library:)`, `observeDetail(exerciseID:in:library:)`, `Detail`.
  - `Library/ExerciseSearch.swift`: `ExerciseSearch(entries:)`, `results(for:filter:now:)`, `Filter`, `Entry`.
  - `Library/ExerciseEditor.swift`: `create(_:)`, `update(_:with:)`, `setArchived(_:exerciseID:)`; `CustomExerciseDraft`, `ExerciseEditError`.
  - `Library/Muscle.swift`, `Equipment.swift`, `MovementPattern.swift`, `Mechanic.swift`, `ExerciseTracking.swift` (all have `displayName` where shown).
- `App/AppEnvironment.swift` exposes `database`, `library` and `exerciseEditor`.

## Scope

- **Create:** `App/Features/Exercises/` with `ExercisesModel.swift`, `ExercisesView.swift`, `ExerciseDetailModel.swift`, `ExerciseDetailView.swift`, `CustomExerciseModel.swift`, `CustomExerciseView.swift`, `MusclePickerView.swift`. A shared `App/DesignSystem/Components/FilterChip.swift` is allowed.
- **Edit:** `App/RootView.swift` (Exercises tab only) and `App/AppEnvironment.swift` (add a factory or a stored `ExercisesModel` like `history`).
- **Do not touch:** WorkoutCore (if the core API is missing something, describe it in the handoff), Settings, Import, History.

## Specification

**ExercisesModel** (`@MainActor @Observable`): it observes `ExerciseCatalog.observeEntries`, rebuilds `ExerciseSearch` when the entries change, and holds `query: String` and `filter: ExerciseSearch.Filter`. `results` is computed from the search, never re-implemented.

**ExercisesView** (NavigationStack, title "Exercises"):
- `.searchable` with the prompt "Search 420 exercises". Use the real count, rounded down to the nearest 10.
- Below the search field, one horizontally scrolling row of filter chips:
  - **Muscle:** a Menu listing muscles grouped by region with "Any muscle".
  - **Equipment:** a Menu with "Any equipment".
  - **Mine:** a toggle for custom-only.
  - An active chip uses `accentSubtle` fill and a `borderStrong` border, and shows the chosen value ("Side delts").
- With an empty query and no filter, show two sections:
  - **RECENT:** the 8 most recently used exercises, by `lastUsedAt`.
  - **ALL:** everything, alphabetical, grouped by first letter with a section index if feasible. A plain list is fine otherwise.
- With a query or a filter, show one flat list of results in search order.
- Row:
  - Name in `AppFont.body` / `textPrimary`.
  - Second line in `AppFont.callout` / `textTertiary`: the primary muscles' display names joined with " · ", then "· 236×" when `usageCount > 0`.
  - A trailing "Custom" text badge for `isCustom` entries, in `textTertiary`.
- Toolbar "+" opens the CustomExerciseView sheet with an empty draft.
- Empty results: `EmptyStateView(title: "No match", message: "Try another name, or create “<query>”.")` plus a button that opens the custom sheet pre-filled with the query as its name.

**ExerciseDetailView** (pushed, observing `observeDetail`):
- Title: the exercise name, inline.
- **Muscles card:**
  - Primary muscles as chips in `accent`; secondary muscles as chips in `textSecondary`, labelled "Primary" and "Secondary".
  - Below them, one line: equipment · pattern display name · Compound/Isolation, plus "· Long-length bias" when `isLengthenedBiased`.
- **Usage card:** "236 sessions · 1,402 sets", "First: 3 Jan 2022", "Last: 2 Oct 2026". Hide the card when there's no usage.
- **Recent card** (up to 10):
  - Each row shows the date on the left and the top set on the right, as "135 lb × 8", using `topSet.weight.formatted(in: topSet.entryUnit)` and reps.
  - Then the work set count in `textTertiary`.
  - Rows are not tappable in this task.
- **"Also known as"** line in `textTertiary` when there are aliases.
- **Toolbar menu:**
  - "Duplicate as my own": for library exercises. Opens the custom sheet with a `CustomExerciseDraft` copied from the detail's fields, named "<name> (Copy)".
  - "Edit": for non-library exercises.
  - "Archive" / "Unarchive".
  - An archived exercise disappears from the list; that is fine.

**CustomExerciseView** (sheet, Form):
- Fields: Name; Equipment (Picker with "None"); Pattern (Picker with "None"); Compound/Isolation (segmented, optional); Tracking (Picker).
- **Primary muscles** and **Secondary muscles** rows each open MusclePickerView: a multi-select list grouped by region, where a muscle chosen as primary is disabled in the secondary list.
- "Long-length bias" toggle.
- Save calls `ExerciseEditor.create` or `update`. An `ExerciseEditError` shows its `errorDescription` inline under the form or in an alert, and the sheet stays open.
- Save is disabled while the name is empty or there's no primary muscle.

**General:**
- Design tokens only.
- Dark and light must both look right.
- No business logic in views.
- Log failures with `Log.ui`.
- Every type gets a `///` doc comment.

## Acceptance criteria

- [ ] `make verify` passes with no new warnings.
- [ ] Previews exist for ExercisesView, ExerciseDetailView and CustomExerciseView (use `AppEnvironment.preview()`, which seeds the library).
- [ ] In the simulator (`make sim`, if a runtime is installed):
  - Typing "rdl" lists Romanian deadlifts first.
  - The Side delts filter shows lateral raises.
  - Creating "Zottman Curl (Dumbbell)" with biceps primary makes it appear under Mine.
  - Detail screens open.
  - Screenshots are taken in dark and light.
  - If no simulator runtime is installed, say so in the handoff; the lead will check.
- [ ] Handoff filled in, including the API gaps found.

## Handoff

- **Status:** review (code complete; simulator checks not done, see below).
- **What was done:** Exercises tab built to the spec: search + muscle/equipment/Mine chips, Recent and alphabetical All lists, flat ranked results, no-match state with a "Create" button, detail screen (muscles, usage, recent sessions, aliases, Duplicate/Edit/Archive menu), create/edit sheet with muscle pickers. `AppEnvironment.exercises` holds the `ExercisesModel` so query and filters survive tab switches.
- **Files touched:**
  - Created `App/Features/Exercises/` (ExercisesModel, ExercisesView, ExerciseDetailModel, ExerciseDetailView, CustomExerciseModel, CustomExerciseView, MusclePickerView) and `App/DesignSystem/Components/FilterChip.swift`.
  - Edited `App/RootView.swift` and `App/AppEnvironment.swift`.
- **Decisions taken:**
  - Choosing a primary muscle removes it from the secondary list; in the secondary picker, primary muscles are dimmed and disabled.
  - `ExerciseDetailView` owns its model in `@State` so the list rebuilding its navigation destination can't orphan the observation.
  - A private `FlowLayout` in ExerciseDetailView wraps the muscle chips.
  - Archived exercises stay openable from detail (with an "Archived" note) so they can be unarchived.
  - No section index on the ALL list (plain letter sections).
  - No-match with only a filter active (empty query) shows "No exercise fits these filters." and no Create button.
  - Bodyweight top sets read "Bodyweight × 8", mirroring the workout detail screen; warm-up-only sessions read "Warm-ups only".
- **API / design-system gaps (for the lead):**
  - `Mechanic` and `ExerciseTracking` have no `displayName`; the brief says all do. App-side extensions are in `CustomExerciseModel.swift`; move them into WorkoutCore.
  - `AppColor` has no `accentSubtle` token (DESIGN.md defines it); `FilterChip` derives it from the accent. Add the token and simplify FilterChip.
  - The "Bodyweight" label logic for top sets is duplicated from `WorkoutDetailView` (view-level); worth a single shared formatter.
  - `ExerciseCatalog.Detail.Session.topSet` is only a weight × reps set; duration/carry exercises show reps 0.
- **Open questions / left over:** Simulator acceptance checks ("rdl", Side delts, Zottman Curl under Mine, dark/light screenshots) not run.
- **How it was verified:** `make verify` passes (112 core tests; app builds for the iOS Simulator with no warnings after a clean rebuild of the app target). No iOS simulator runtime is installed on this machine (`xcrun simctl list runtimes` is empty), so the UI was not run; the lead should check on `make sim`. Previews exist for ExercisesView, ExerciseDetailView (exercise id 1), CustomExerciseView, MusclePickerView and FilterChip.
