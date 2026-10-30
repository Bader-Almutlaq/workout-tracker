# Data: storage, backups, import

## Where data lives

| Copy | Location | Written when |
|---|---|---|
| **Live database** | On the phone, in the Home Screen app's private file system (OPFS), file `/workouts.sqlite` in SQLite's storage pool named `workout-tracker` | Every change |
| **Local safety snapshots** | Same pool, `/snapshot-<UTC time>.sqlite`; the newest 3 are kept | Automatically before any schema migration runs and before any restore |
| **Backups** | Wherever the owner saves them, normally a folder in iCloud Drive | When the owner taps **Back up** (W1) |

- The app asks the browser for **persistent storage** at launch, so iOS never clears it to save space. Home Screen web apps are exempt from Safari's 7-day storage limit for websites.
- The Home Screen app has its own storage, separate from Safari's. Opening the same address in a Safari tab shows an empty app; that's expected.
- **Deleting the Home Screen icon deletes the data.** Restore from a backup afterwards.
- No data is ever sent anywhere. The host only serves the app's code.

### Backups (W1)

A web app can't write to iCloud Drive by itself, so backups take one tap:

- **Back up** exports the whole database as one file, `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite` (UTC, sortable), and opens the iOS share sheet. Choose **Save to Files** and the same iCloud Drive folder each time. If sharing isn't available, the file downloads instead.
- Each backup is a complete, self-contained SQLite file that any SQLite tool can open.
- Settings always shows the date of the last backup. When it's more than 7 days old, the finish-workout summary shows one quiet line with a Back up button (information, not a nag).
- **Restore:** pick a backup file. The app checks it is SQLite, has a known schema and wasn't made by a newer version, takes a local safety snapshot of the current data, then replaces the live database and reopens it.
- Old backups are the owner's files; the app never deletes them.

### Data loss scenarios

| Event | Outcome |
|---|---|
| No connection at the gym | Nothing happens: the app and data are on the phone. |
| A new version fails to download | The installed version keeps working. |
| Home Screen icon deleted / phone lost | Re-add the app, then restore the newest backup. |
| Bad migration or bug | The worker snapshotted before migrating; restore that snapshot or a backup. |

## Hosting

- Address: **https://bader-almutlaq.github.io/workout-tracker/** (GitHub Pages, public repository `Bader-Almutlaq/workout-tracker`). It only serves the app's code; no data is ever uploaded.
- Publish with `make deploy` (pushes `main`, then runs the *Deploy* workflow, which runs `make verify` before publishing, so a failing build never ships). Pushes alone have not been triggering the workflow, so always use `make deploy`.
- The installed app picks up a new version in the background and shows "Update ready"; nothing reloads until the owner taps Update.
- Roll back: `git revert` the bad commit on `main`, then `make deploy`.
- The owner's personal GitHub site had an expired custom domain (bader-almutlaq.me) that redirected every project; it was removed on 2026-10-30.

## Logging state

- At most one workout has `isInProgress = 1`: the one being logged. History and analytics ignore it until it is finished.
- While logging, sets exist as **planned** (`isCompleted = 0`), pre-filled from the last session, or **completed** (`isCompleted = 1`, with `completedAt` and `restBeforeSeconds`, the time since the previous completed set in the workout).
- Finishing deletes planned sets that were never completed, and exercises left with no sets. So **every set of a finished workout was performed**, and imported sets count as completed. A workout finished with nothing completed is deleted.
- Every tap is its own transaction, so a crash loses nothing already shown on screen.

## Units

All weights are stored in **kilograms, exactly as entered** (`Double`). Each set also records the unit it was entered in (`kg` or `lb`), so it can be displayed the way it was typed. Conversion uses 1 lb = 0.45359237 kg (exact, by definition).

## Strong export (owner's file, profiled 2026-10-29)

`export_data/strong_workouts.csv`: 23,198 sets, 983 workouts, 85 exercise names, 2021-11-20 → 2026-10-02.

- **Format:** comma-delimited, RFC 4180 quoting, header `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE`. This is the older layout: no `Workout #`, and durations are text such as `1h 7m` or `59m`. A workout is identified by its `Date` (start timestamp, local time, `yyyy-MM-dd HH:mm:ss`).
- **Weight** column is nominally kg, with three classes of value:
  - **Round kg** (multiple of 0.25 kg): 19,599 sets.
  - **Typed in lb** (value ÷ 0.45359237 is a round lb number, e.g. 61.23 = 135 lb, 49.9 = 110 lb, 47.17 = 104 lb): about 1,900 sets, mostly Bench Press (Barbell), Upper Seated Row, Shrug (Machine), Under Grip Row, Lat Pulldown (Machine). The importer keeps the kg value and sets entry unit = lb.
  - **Exercises whose column is actually in pounds**: 1,676 sets whose value × 0.45359237 is a round kg number (99.21 = 45 kg, 63.93 = 29 kg, 35.27 = 16 kg). Strong stores a unit **per exercise** and converts the history when the owner switches it (the owner confirmed this habit, 2026-10-29). The export writes each exercise in its *current* unit, despite the header. The evidence is consistent: Seated Leg Curl (Machine) has kg-typed sets 2021-11 → 2026-06 (45 kg shown as 99.21) and then round-lb sets 2026-06 → 2026-09 (140–200 lb). Reverse Fly (Machine), Standing Calf Raise (Machine), Chest Fly and Lateral Raise (Machine) show the same pattern.
  - **Importer rule (`ExportUnitResolver`):** each non-round value votes for the reading under which it is a round typed number (strict 0.006 tolerance); round values don't vote; the majority wins, ties go to kg. On the owner's export this picks exactly the five exercises above, unanimously (e.g. Seated Leg Curl 804–0), and no kg exercise gets a single lb vote. The whole column is then converted to kg and each set's entry unit inferred. The import review lists the lb exercises and the owner can override any.

**Verified 2026-10-29 with `make import-report`:** 983 workouts, 23,199 sets (22,848 non-warm-up), 89 measurements across 15 sites, tonnage 9,568,149.54 kg. That matches an independent Python recomputation to the cent. 54 sets (0.2%) are flagged for review, including clear typos such as 35 kg × 454 reps and a 7 kg set in a 70 kg squat session.
- **Set Order:** `1…6` for working sets; `W` warm-up (351), `D` drop set (417), `F` failure (1,999). Lettered sets take the next position within the exercise.
- **RPE:** integers 6–10 on 92% of sets; empty = unknown.
- **Distance and Seconds** are all zero. **Notes** (per set) are empty; **Workout Notes** appear on 160 rows.
- 633 sets have weight 0 (bodyweight movements such as pull-ups and dips). 1 set has 0 reps.
- Some durations are implausible (`8h 13m`) because workouts were left running. They're kept as-is, and analytics ignore duration outliers.
- About 30 of the 85 names are custom (e.g. "Bayesian Cable Curl", "Lateral raise Panata"); these need a mapping.

**Body measurements** come as one file per site (`strong_waist.csv`, `strong_left_bicep.csv`, …), header `Date,Measurement Type,Value,Unit,Source`, unit `cm`. There are 15 sites and few rows each. No bodyweight file exists.

## Typo and outlier checks

Implemented once in WorkoutCore and used in two places:
- **Import review:** sets whose weight or reps are far outside that exercise's typical range near that date (likely a missed digit or extra zero) are listed for confirm / fix / ignore before the import commits.
- **Live logging:** the same check asks "Is this right?" before saving a suspicious set.
