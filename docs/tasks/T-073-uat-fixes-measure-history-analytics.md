# T-073: Test-pass fixes: measurements, history and analytics

- **Milestone:** fix iteration · **Depends on:** T-064–T-071 · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-072** (workouts, plans, live workout fixes). Don't edit `src/app/features/templates/`, `src/app/features/workout/` or `src/app/design/components/` dialog components.

## Goal

The lead tested every feature on a fresh copy of the app (2026-11-01). Everything core works. Fix these bugs and rough edges, each with a regression test where it's testable.

## Fixes

1. **"@ RPE unknown"** appears in exercise history lines ("12 kg × 10 reps @ RPE unknown"). Leave the RPE part out when it isn't logged, everywhere set lines are formatted (search the formatter; fix it once).
2. **Analytics Overview "Time / week"** shows "0:00" for small values (one 1-minute session over 12 weeks). Use "45m", "1h 20m", and "<1m" for anything above zero but under a minute.
3. **Neglected muscles** lists every muscle with "Never trained directly", which floods the list for new or narrow training. Show trained-but-under-4-sets muscles as rows (as now). Collapse muscles never trained in the window into one muted line: "Not trained in the last 4 weeks: Side delts, Lats, …".
4. **Measurement form:**
   - The date field shows seconds and milliseconds ("00:23:27.823"). Use minute precision (`step="60"`, value formatted to minutes); stored time keeps whatever precision the core already uses.
   - "Value" and "Date and time" sit at a different inset from the fields above. Align every field in the sheet.
5. **Measurement delete:**
   - The edit sheet has no Delete; deleting only works by swiping left, which is hard to discover. Add a **Delete measurement** button (destructive, with the existing confirmation) to the edit sheet. Keep the swipe.
   - When swiped, the row's date text is pushed off the left edge. Keep the row content inside the card while the delete action shows.
6. **Measurement empty states:** after deleting the only entry, History shows nothing: add "No measurements yet." The Chart tab's "Changes" lists "4 weeks · first entry …" with no values when there's only one entry: hide Changes until there are two entries, with a one-line note instead ("Changes appear after two entries.").
7. **Session editor (History → session → Edit):**
   - Duration shows "0.84955" minutes. Show whole minutes (round; under 1 minute shows 1). Only write a new duration when the owner changes the field.
   - Every set has an "+ Add set N notes" link, which clutters the editor. Show a set's note only when it has one (tap to edit). Adding a set note moves to the set's existing menu (or a long-press/kind menu item "Add note"). If that link is rendered by a shared component in `src/app/features/workout/`, change it there with the smallest possible edit (a prop), since T-072 also touches that folder.
8. **Add to plan dialog** (History → session → Add to plan…) defaults to "New plan…" even when plans exist. Default to the active plan, else the first plan.
9. **Session page back link:** opened from the Workout page's History tab or a plan's History, "Back" should return there, not to the full History list. T-072 makes those links pass `state.from`; read it (a path starting with `/`) for the Back target and label ("Back"), falling back to History.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests for 1, 2, 3, 5 (Delete in the sheet), 6, 7 (duration display and unchanged duration preserved) and 8.
- [ ] Checked at 430 × 932, dark and light. Docs where behaviour changed. Don't commit. No attribution or mention of tools/agents anywhere.

## Handoff

Implemented the nine fixes. Set effort suffixes are shared; the trailing-four-week fractional total identifies untrained muscles even when the selected analytics period differs. A measurement's untouched timestamp and a workout's untouched duration retain their original precision. The edit sheet delegates deletion to the existing confirmation; set notes are added through the set menu. Add to plan selects the active plan if present, otherwise the first.

Changed analytics, body, exercise and history screens and tests; shared set formatting, the trailing-window coverage query, and the minimal set-menu and text-field controls used by the past-workout editor. Public additions: `loggedRpeSuffix`, `weeklyDurationText`, `changedDurationSeconds`, and `MuscleCoverageItem.recentSetsPerWeek`.

Verification: `make format` and `make verify` (see final run). Phone-sized dark/light inspection was blocked: the sandbox denied the dev server's port bind and the browser access host was unavailable. No real data was used. Changes are uncommitted. The visual swipe layout and sheet alignment need review on a phone.
