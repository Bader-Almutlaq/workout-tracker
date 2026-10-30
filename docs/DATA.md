# Data: storage, backups, import

## Where data lives

| Copy | Location | Written when |
|---|---|---|
| **Live database** | On the phone, in the Home Screen app's private file system (OPFS), file `/workouts.sqlite` in SQLite's storage pool named `workout-tracker` | Every change |
| **Local safety snapshots** | Same pool, `/snapshot-<UTC time>.sqlite`; the newest 3 are kept | Automatically before any schema migration runs and before any restore |
| **Manual backups** | Wherever the owner saves them, normally a folder in iCloud Drive | When the owner taps **Back up** |
| **Dropbox backups (optional)** | The owner's Dropbox, in this app's folder only | After connecting, every finished workout, and pending retries |

- The app asks the browser for **persistent storage** at launch, so iOS never clears it to save space. Home Screen web apps are exempt from Safari's 7-day storage limit for websites.
- The Home Screen app has its own storage, separate from Safari's. Opening the same address in a Safari tab shows an empty app; that's expected.
- **Deleting the Home Screen icon deletes the data.** Restore from a backup afterwards.
- The host only serves the app's code. The only data sent off the phone is a full backup to the owner's Dropbox after they explicitly connect it.

### Exercise loading settings (schema v5)

`v5-exercise-load-settings` appends three nullable columns to `exercise` without rewriting rows:

- `loadStepKilograms REAL`: positive total-load increment, in exact kilograms (plate pairs are already included).
- `barWeightKilograms REAL`: nonnegative empty bar/carriage load, in exact kilograms.
- `warmupSetCount INTEGER CHECK (warmupSetCount BETWEEN 0 AND 4)`: null uses the equipment/mechanic default; zero disables generation.

Null loading values use the equipment defaults in `LoadableWeight.ts`. The editor converts values from the exercise's entry unit once; stored overrides stay exact when the entry unit changes. Built-in exercises permit loading-only edits while their library metadata stays read-only. Older in-memory model callers may omit the fields; database rows always include nulls or values.

Generated warm-ups are ordinary uncompleted `workoutSet` rows before the work sets. Completed rows retain their values and timestamps. Manual warm-up edits and delete-all suppression are tracked in the logger's memory, never new schema columns. After a worker reload, existing warm-ups are treated as protected and missing warm-ups on an already-loaded entry stay missing; an entry whose first work load was still zero can generate when filled in. Backups contain the planned rows and the loading settings, without transient edit provenance. The existing worker snapshot-before-migration path handles v5.

### Backups

Manual backups to Files / iCloud Drive take one tap and remain available alongside optional automatic Dropbox backups:

- **Back up** exports the whole database as one file, `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite` (UTC, sortable), and opens the iOS share sheet. Choose **Save to Files** and the same iCloud Drive folder each time. If sharing isn't available, the file downloads instead.
- Each backup is a complete, self-contained SQLite file that any SQLite tool can open.
- Settings always shows the date of the last backup. Every finish-workout summary offers **Back up now** and shows the last backup age; the caption is a quiet reminder when it is more than 7 days old. The owner must tap the button and save the file in the share sheet.
- **Restore:** pick a backup file. The app checks it is SQLite, has a known schema and wasn't made by a newer version, takes a local safety snapshot of the current data, then replaces the live database and reopens it.
- Manual backups are the owner's files; the app never deletes them.

#### Connect Dropbox (once on this phone)

The built-in public app key is ready to use. To use your own Dropbox app instead, expand **Use your own Dropbox app key**, create an app at dropbox.com/developers/apps with **Scoped access** and **App folder**, enable `files.metadata.read`, `files.content.write` and `files.content.read`, then enter and save its App key. Changing the key revokes the old connection first; connect again afterwards. Leave the field blank and save to return to the built-in key. No client secret or redirect URI is needed.

1. Open **Settings → Backup → Dropbox → Connect Dropbox**. Allow a new tab if Safari asks.
2. Approve access in Dropbox. Copy the authorization code Dropbox displays, then return to the Home Screen app.
3. Paste the code and tap **Finish connecting**. Keep the app open while it uploads the first backup.
4. Confirm **Connected · last backup just now**. **Back up to Dropbox now** retries or uploads manually; **Disconnect** revokes access and clears this phone's connection, without deleting any Dropbox files. Disconnect needs a connection; if it fails, retry it when online.

After each saved workout the app uploads the same validated `.sqlite` export used by the share sheet, under `/WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite` (UTC). Uploads never hold up finishing the workout. The summary shows progress, success, or a readable failure with **Try again**; **Back up now** still opens the share sheet.

A failed upload remains pending and retries when the app next opens or receives an `online` event. Keep the app open long enough to finish: iOS can suspend background web apps. If Dropbox revokes access, the app forgets the rejected credentials and offers **Reconnect Dropbox**. Backups require a connection; logging always works offline.

The refresh token and optional public app key are persisted in this phone's `localStorage`, under `workout-tracker.dropbox.refresh-token` and `workout-tracker.dropbox.app-key`; access tokens and the PKCE verifier stay in memory. Tokens never enter SQLite, logs, or backup files. The non-secret `appSetting` rows are `cloudBackupProvider`, `lastCloudBackupAt`, and `cloudBackupPending`. Restoring a backup on another phone does not connect its Dropbox; connect again there. Clearing website data or deleting the Home Screen app requires connecting again too.

After a successful upload the app lists the complete Dropbox app-folder root, keeping the newest **14** app backups plus the **earliest backup of each calendar month in the phone's local time**, ordered by Dropbox's server timestamp. It deletes only exact app backup filenames; unrelated files, subfolders, manual backups elsewhere, and local safety snapshots are untouched. A failed upload never runs retention. A retention failure still records the successful upload and leaves a pending retry. Changes saved during an upload retain a pending retry so a stale export cannot mark newer data as backed up.

To restore a Dropbox backup, download its `.sqlite` file from Dropbox to Files, then use **Restore from a backup file…** in Settings.

### Data loss scenarios

| Event | Outcome |
|---|---|
| No connection at the gym | Nothing happens: the app and data are on the phone. |
| A new version fails to download | The installed version keeps working. |
| Home Screen icon deleted / phone lost | Re-add the app, then restore the newest backup. |
| Bad migration or bug | The worker snapshotted before migrating; restore that snapshot or a backup. |

## Hosting

- Address: **https://bader-almutlaq.github.io/workout-tracker/** (GitHub Pages, public repository `Bader-Almutlaq/workout-tracker`). It only serves the app's code; workout data is never uploaded to the host.
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
- **Import review:** sets whose weight or reps are far outside that exercise's typical range near that date (likely a missed digit or extra zero) are listed for confirm / fix / ignore before the import commits. **Leave out all flagged sets** excludes them in one tap; Undo restores the previous exclusions. Individual controls remain available.
- **Live logging:** the same check asks "Is this right?" before saving a suspicious set.
A set left out of an imported workout can be brought back only by deleting that workout and importing the export again. If every set was left out, the workout was not imported and can be imported later. The original export remains unchanged.


## Body measurements (T-043)

- `measurementSite` owns stable site keys, length/mass kind, left/right grouping, flexed support, display order and the editable how-to guide. Migration `v4-measurement-sites` freezes 16 defaults (15 Strong circumference sites plus bodyweight). Unknown legacy/imported slugs become custom length sites; original values are never guessed or changed.
- `bodyMeasurement` stores unrounded cm for lengths and kg for masses, a UTC timestamp, provenance, and `relaxed`/`flexed` state. Uniqueness is `(takenAt, site, state)`. New app entries retain their typed `entryUnit`; legacy/imported entries have null because their original typing unit is unknown. Editing preserves provenance. Duplicate entries are refused rather than overwritten.
- v4 rebuilds the table in one migration transaction, preserving ids, timestamps, values, source and the autoincrement high-water mark. Existing rows become relaxed. The worker takes its existing safety snapshot before migration; older backups validate and migrate through the existing restore flow.
- `lengthUnit` (`cm`/`in`, default `cm`) and `weightUnit` (`kg`/`lb`, default `kg`) are app settings for Body display. The existing app had per-exercise entry units and kg training analytics, but no global weight setting; Body provides the weight display picker. All units remain in backups. An inch is exactly 2.54 cm; lb conversion uses the existing weight owner.
- Changes are computed independently per state, relative to that state's latest observation. A 4-/12-week change subtracts the newest entry on or before latest minus 28/84 elapsed days; it is null if none exists. Since-first needs two entries. The monthly rate is a descriptive least-squares slope using observations in the inclusive last 84 days, scaled by a mean Gregorian month (365.2425 / 12 days); fewer than two distinct timestamps gives null. No interpolation or training recommendation is made.
