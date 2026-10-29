# Data: storage, backups, import

## Where data lives

| Copy | Location | Written when |
|---|---|---|
| **Live database** | App's Application Support folder on the iPhone: `WorkoutTracker/workouts.sqlite` (SQLite, WAL mode) | Every change |
| **Local safety snapshots** | Application Support: `WorkoutTracker/Snapshots/` | Automatically before any schema migration runs and before any restore |
| **Cloud backups** | A folder the owner picks once in iCloud Drive (via the Files picker) | Automatically when the app goes to the background (at most every 15 minutes), on "Back up now", and right after a folder is chosen |

### Why backups go to iCloud Drive this way

Apps that own a folder in iCloud Drive (the ones you see listed by app name) need Apple's iCloud capability, which requires the paid Developer Program. A free Personal Team can't use it. Any app *can* write to a folder the user chose in the Files picker. The app stores a **security-scoped bookmark** to that folder, so it keeps write access across launches without asking again. iCloud then syncs the folder off the phone.

The live database stays on the phone, not in iCloud Drive. SQLite files that sync while open can be corrupted (the separate WAL file may sync out of step). Backups are complete, closed, single-file snapshots, which are safe to sync.

### Backup files

- Name: `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite` (UTC, sortable).
- Each is a complete, single-file SQLite database (rollback-journal mode, no `-wal`/`-shm` side files) made with SQLite's online backup API, so it is consistent even while the app is writing.
- Retention in the cloud folder: keep the newest backup of each day for the last 14 days, plus the newest backup of each calendar month forever. Others are deleted. Files that don't match the naming pattern are never touched.
- **Restore:** pick a backup file. The app checks that it opens and has a known schema, takes a local snapshot of the current data, then copies the backup over the live database.

### Data loss scenarios

| Event | Outcome |
|---|---|
| The 7-day signature expires | App won't open; data intact. Re-run from Xcode. |
| App deleted / phone lost | Restore from the newest iCloud backup. |
| Bad migration or bug | Restore from the pre-migration snapshot or a cloud backup. |

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
