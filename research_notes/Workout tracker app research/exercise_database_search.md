# Open exercise databases and exercise search for a personal iOS workout tracker

Method note: license facts were checked against primary sources: LICENSE files, the GitHub repo API `license` field, and the wger REST API's own `license` objects. Counts and coverage were measured by downloading each dataset on 2026-10-29 and running scripts over it, not taken from README claims. "Modern variation coverage" means a case-insensitive name search for these terms: Bayesian, Jefferson, Belt Squat, Pendulum, JM, Kelso, Meadows, Safety/SSB, Spoto, Larsen, Seal, Pec Deck, Y-Raise.

## Q1. Candidate datasets: size, fields, license, offline-bundling rights, quality, modern coverage

### Takeaway
Two datasets are open, can be bundled offline and are useful: **yuhonas/free-exercise-db** and **wger**.
- free-exercise-db has 876 exercises and is public domain under the Unlicense, but it has old-school names, no aliases, and almost no modern variations.
- wger has 939 exercises under CC-BY-SA 3/4 and CC0. It has the best modern coverage (Bayesian curl, belt squat, pendulum squat, JM press, Kelso shrug, Meadows row, Larsen press, pec deck, cable Y-raise) and has aliases, but it requires attribution and share-alike, and its tagging is incomplete.

ExerciseDB-family data (1,300–11,000 exercises, GIFs) is either AGPL, "All rights reserved", or has media under separate copyright. Use it at most as a reference, not as a bundled source.

### Cited Findings

**yuhonas/free-exercise-db**
- The GitHub API reports the license as "The Unlicense" (SPDX `Unlicense`). LICENSE.md begins "This is free and unencumbered software released into the public domain… Anyone is free to copy, modify, publish, use, compile, sell, or distribute…". Repo stats: about 2,061 stars, last push 2026-09-27. — [GitHub API](https://api.github.com/repos/yuhonas/free-exercise-db); [LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md)
- The README describes it as an "Open Public Domain Exercise Dataset in JSON format, 800+ exercises". It was restructured from wrkout/exercises.json, which is also Unlicense per the GitHub API. — [README](https://github.com/yuhonas/free-exercise-db); [wrkout/exercises.json API](https://api.github.com/repos/wrkout/exercises.json)
- Measured `dist/exercises.json`: **876 exercises**. Fields:
  - `name`, `id`
  - `force`: push/pull/static
  - `level`: beginner/intermediate/expert
  - `mechanic`: compound/isolation
  - `equipment`
  - `primaryMuscles[]`, `secondaryMuscles[]`
  - `instructions[]`
  - `category`
  - `images[]` (JPGs in the repo)

  It has **no aliases field**. — [dist/exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)
- Taxonomy (measured):
  - **17 muscles:** abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps. Delts are not split.
  - **Categories:** strength 584, stretching 123, plyometrics 61, powerlifting 38, olympic weightlifting 35, strongman 21, cardio 14.
  - **Equipment:** barbell 170, dumbbell 123, other 122, body only 111, cable 81, *null 77*, machine 67, kettlebells 56, bands 20, medicine ball 17, exercise ball 12, foam roll 11, e-z curl bar 9. — [dist/exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)
- Modern-variation coverage (measured):
  - Present: "JM Press", "Jefferson Squats" (not the Jefferson curl), "Romanian Deadlift", "Barbell Hip Thrust", "Landmine 180's".
  - Missing: Bayesian, belt squat, pendulum, Kelso, Meadows, SSB/safety bar, Spoto, Larsen, seal row, pec deck, Y-raise, Nordic. — [dist/exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)

**wger**
- The wger *code* is AGPL-3.0 (GitHub API; about 7,203 stars, last push 2026-10-28). — [GitHub API](https://api.github.com/repos/wger-project/wger)
- The exercise *data* is licensed per exercise. Each exercise carries a `license` object and a `license_author` (example: "CC-BY-SA 4", author "deusinvictus"). Licenses offered: CC-BY-SA 3, CC-BY-SA 4, CC-BY 4, CC0, ODbL. — [wger API exerciseinfo](https://wger.de/api/v2/exerciseinfo/?limit=1); [wger API license](https://wger.de/api/v2/license/)
- Measured from the public API (no key needed for reads) on 2026-10-29:
  - **939 exercises**, all with an English translation.
  - Licenses: **781 CC-BY-SA 4, 132 CC-BY-SA 3, 26 CC0**.
  - 772 have primary muscles, only 391 have secondary muscles, 715 have equipment.
  - 74 English entries have aliases. — [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)
- Examples of wger aliases:
  - Romanian Deadlift → "RDL"
  - Shoulder Press, Barbell → "OHP Barbell", "Overhead press Barbell", "Military Press with Barbell"
  - Arnold Shoulder Press → "Schwarzenegger Press"…
  - Bench Press Narrow Grip → "Close-Grip Bench Press"
  - Bent Over Dumbbell Rows (Single Arm) → "One Arm DB Rows"
  - Wide-grip Pulldown → "Lat Pulldown (Wide Grip)"

  — [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)
- wger taxonomy is coarse:
  - **15 muscles** (Latin names with an English label): Anterior deltoid ("Shoulders"), Biceps brachii, Biceps femoris ("Hamstrings"), Brachialis, Gastrocnemius ("Calves"), Gluteus maximus, Latissimus dorsi, Obliquus externus abdominis, Pectoralis major, Quadriceps femoris, Rectus abdominis, Serratus anterior, Soleus, Trapezius, Triceps brachii. There is no side or rear delt muscle.
  - **12 equipment types:** Barbell, Bench, Cable machine, Dumbbell, Gym mat, Incline bench, Kettlebell, Pull-up bar, Resistance band, SZ-Bar, Swiss Ball, none (bodyweight).
  - **8 categories:** Abs, Arms, Back, Calves, Cardio, Chest, Legs, Shoulders. — [muscle](https://wger.de/api/v2/muscle/?limit=50); [equipment](https://wger.de/api/v2/equipment/); [category](https://wger.de/api/v2/exercisecategory/)
- wger modern-variation coverage (measured English names):
  - Present: "Bayesian Curl", "Belt Squat", "Pendulum Squat", "JM Press", "kelso shrugs", "Meadows Row", "Larsen Press", "Pec Deck", "Pec deck rear delt fly", "Cross-Body Cable Y-Raise", "Incline DB Y-Raise", "Nordic Curl", "Reverse Nordic Curl", "Landmine press", "Hack Squats", "Pause Hack Squats", "Barbell Romanian Deadlift (RDL)".
  - Missing: Jefferson curl, SSB/safety-bar squat, Spoto press, seal row.
  - Data-quality issues visible: inconsistent casing ("kelso shrugs") and comma-style names ("Shoulder Press, Barbell"). — [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)

**exercemus/exercises**
- MIT per the GitHub API (51 stars, last push 2025-07-31). The README says it was "curated from exercemus, wger.de, and exercises.json".
- Its schema adds `aliases`, `variation_on`, `tips`, `tempo`, `video`, and a `muscle_groups` map. — [README](https://github.com/exercemus/exercises); [GitHub API](https://api.github.com/repos/exercemus/exercises)
- Measured minified JSON:
  - **872 exercises**, only 4 with aliases; license field null on 871.
  - Muscles: 21, adding serratus anterior, brachialis, obliques, soleus.
  - No coverage of the modern variations except "JM Press" and "Jefferson Squats". — [minified-exercises.json](https://raw.githubusercontent.com/exercemus/exercises/minified/minified-exercises.json)
- Caveat: MIT on a dataset partly derived from CC-BY-SA wger data is a potential license conflict. — [README](https://github.com/exercemus/exercises)

**ExerciseDB / AscendAPI**
- The exercisedb/exercisedb-api repo is **AGPL-3.0** (GitHub API) and claims "11,000+ structured exercises" and "5,000+ GIF animations". It links to a separate "Terms of use" (Notion). — [GitHub API](https://api.github.com/repos/exercisedb/exercisedb-api); [README](https://github.com/exercisedb/exercisedb-api)
- exercisedb.dev now brands itself AscendAPI. It offers an "ExerciseDB V1 API (Free Version) 1,500 exercises with GIFs", with no sign-up or key. The footer reads "© 2026 AscendAPI. All rights reserved." The page does not state offline or redistribution terms. — [exercisedb.dev](https://exercisedb.dev/)
- A separate Gumroad "Ultimate Exercises Dataset – 1300+ Exercises with High-Quality GIFs" sells for $300. — [Gumroad](https://exercisedb.gumroad.com)

**hasaneyldrm/exercises-dataset**
- **1,324 exercises** (measured). Fields:
  - `name`, `category`, `body_part`, `equipment`, `target`, `muscle_group`, `secondary_muscles[]`
  - multilingual `instructions`
  - `image`, `gif_url`, `attribution`
- Its LICENSE is MIT for "code, tooling, dataset structure, and instruction text/translations" only. A MEDIA EXCEPTION says the images and GIFs are "© Gym visual… Cloning this repository does not grant you any license to the media; obtain your own from Gym visual." — [LICENSE](https://github.com/hasaneyldrm/exercises-dataset/blob/main/LICENSE); [README](https://github.com/hasaneyldrm/exercises-dataset)
- Measured taxonomy:
  - **target:** abs, pectorals, biceps, glutes, delts, triceps, upper back, lats, calves, quads, forearms, cardiovascular system, hamstrings, spine, traps, adductors, serratus anterior, abductors, levator scapulae.
  - **equipment:** 28 values, including smith machine, leverage machine, sled machine, trap bar, ez barbell.
  - Names are all lowercase, e.g. "barbell jm bench press", "barbell jefferson squat", "band y-raise", "dumbbell incline y-raise".
  - Missing: Bayesian, belt squat, pendulum, Kelso, Meadows, SSB, Spoto, Larsen, seal row, pec deck, Nordic. — [data/exercises.json](https://github.com/hasaneyldrm/exercises-dataset/blob/main/data/exercises.json)

**openGym (DuarteSantos8/openGym)**
- AGPL-3.0. Its catalogue has **6,554 per-exercise JSON files** with fields `bodyPart`, `equipment`, `target`, `secondaryMuscles`, `category`, `instructions`. Sample entries carry `"textSource": "exercisedb"`.
- It imports from Strong/Hevy/FitNotes and has an exercise-aliases module. — [GitHub API](https://api.github.com/repos/DuarteSantos8/openGym); [catalogue/exercises/0001.json](https://github.com/DuarteSantos8/openGym/blob/main/catalogue/exercises/0001.json)

**Built-in libraries of commercial apps (for comparison)**
- Hevy: "400+ exercises" (help-center article title). Free accounts can create up to 7 custom exercises; Pro allows unlimited. — [Hevy help](https://help.hevyapp.com/hc/en-us/articles/35688251991575-Hevy-Exercise-Library-400-Exercises-and-Custom-Exercises) (via search snippet; the page returned 403 on direct fetch)
- Strong: about "200 exercises with video illustrations" per an undated third-party review. No official current count was found. — [Garage Gym Reviews](https://www.garagegymreviews.com/equipment/strong)
- Jefit: a database of about 1,400 exercises. — [Jefit](https://www.jefit.com/exercise-tips/most-popular-jefit-exercise-for-major-muscle-groups) (via search snippet)

### Inferences
- **Practical licensing picture for a personal, offline, bundled app:**
  - free-exercise-db: no obligations at all.
  - wger: CC-BY-SA requires attribution (wger plus `license_author` per exercise) and that any redistributed *derived dataset* stay CC-BY-SA. For a personal app not distributed to others this is trivially satisfied. If the app is ever published, ship an attribution screen and keep the wger-derived JSON under CC-BY-SA. The 26 CC0 entries carry no conditions.
  - ExerciseDB derivatives: avoid bundling them, especially the GIFs (separate copyright). AGPL code is irrelevant if only the data were used, but the data provenance and terms are unclear.
- hasaneyldrm's 1,324 count and its `bodyPart`/`target`/`equipment` field shape match the well-known ExerciseDB v1 dataset. Its provenance is probably ExerciseDB, which makes its MIT claim on the data less trustworthy. This is unverified.
- **No open dataset covers all the requested modern variations.** wger covers roughly 9 of the 13 tested, free-exercise-db about 1. A curated, hand-authored supplement of about 50–150 modern movements will be needed regardless. Exercise names and muscle/equipment facts are generally treated as non-copyrightable facts, but this is not legal advice.
- Union size: free-exercise-db (876) + wger (939) + curated additions, after de-duplication, would plausibly give about 1,200–1,500 unique entries. That is 3–7× Hevy (400+) and Strong (~200). This estimate has not been measured.

### Gaps
- I could not retrieve the ExerciseDB/AscendAPI "Terms of use" text (it is a Notion link). Offline-storage and redistribution rights for its free tier are therefore unknown.
- The **everkinetic** dataset repo (`everkinetic/everkinetic-data`) returned 404 on the GitHub API. Its current location and license were not verified.
- OpenTrainer and Kaggle gym-exercise datasets were not checked because of the tool-call budget. Kaggle datasets are commonly scrapes of ExerciseDB or bodybuilding.com with unclear licenses (unverified).
- The provenance of the free-exercise-db/exercises.json text and images (original authorship) is not documented in the README.

## Q2. Strong's naming convention and default exercise list

### Takeaway
Strong names exercises as **"Movement (Equipment)"**, e.g. "Bench Press (Barbell)", "Squat (Barbell)", "Bent Over Row (Barbell)", "Lateral Raise (Dumbbell)". Its CSV export has an `Exercise Name` column. No public, complete list of Strong's default names was found. Import should therefore parse the parenthetical equipment and fuzzy-match the movement, then let the user confirm unmatched names.

### Cited Findings
- openGym's Strong-import tests use Strong-format names "Bench Press (Barbell)", "Squat (Barbell)", "Bent Over Row (Barbell)", "Lateral Raise (Dumbbell)". — [openGym import-csv.strong.test.js](https://github.com/DuarteSantos8/openGym/blob/main/frontend/src/lib/import-csv.strong.test.js)
- Strong CSV header columns parsed by strong2hevy include "Date", "Workout Name", "Duration", "Exercise Name", "Set Order", "Weight", among others. — [criccomini/strong2hevy strong.go](https://github.com/criccomini/strong2hevy/blob/main/strong.go)
- Hevy only accepts CSV imports from Strong, and "The file must be in English in order to be accepted as an import". — [Hevy help](https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy) (search snippet)
- Hevy uses the same parenthetical style. A MacroFactor→Hevy mapping example maps "Dumbbell Bench Press" → "Bench Press (Dumbbell)", and unmatched names offer the 4 closest Hevy equivalents. — [matanabudy/workout-data-sync](https://github.com/matanabudy/workout-data-sync) (search snippet)
- Boostcamp also uses this style ("Romanian Deadlift (Barbell)", "Deadlift (Barbell)"). — [Boostcamp exercises](https://www.boostcamp.app/exercises) (search snippet)

### Inferences
- Store a `displayName` in Strong style, "Base Movement (Equipment)". Keep `baseMovement` and `equipment` as separate fields so a Strong row maps by exact match first, then by parsing the parentheses into movement and equipment, then by fuzzy match on the movement.
- Persist user-confirmed mappings (`importAlias` → `exerciseId`) so re-imports are deterministic, as openGym does with its alias overrides.

### Gaps
- No complete list of Strong's built-in names was found. The best route is to export the user's own Strong CSV and extract the distinct `Exercise Name` values; this is the definitive mapping set for that user.

## Q3. Muscle taxonomy granularity

### Takeaway
Hevy's official API enum has 20 values. The best option is a slightly finer two-level taxonomy (about 20 trainable groups) that splits delts into front, side and rear. It should store primary and secondary muscles separately so fractional set counting (secondary = 0.5) is possible.

### Cited Findings
- **Hevy's official API** `primary_muscle_group` enum: abdominals, shoulders, biceps, triceps, forearms, quadriceps, hamstrings, calves, glutes, abductors, adductors, lats, upper_back, traps, lower_back, chest, cardio, neck, full_body, other. Delts are not split.
  - Equipment enum: none, barbell, dumbbell, kettlebell, machine, plate, resistance_band, suspension, other.
  - Exercise types: weight_reps, reps_only, bodyweight_reps, bodyweight_assisted_reps, duration, weight_duration, distance_duration, short_distance_weight. — [Hevy API docs (swagger-ui-init.js)](https://api.hevyapp.com/docs/)
- free-exercise-db uses 17 groups and splits "middle back" from "lats", "traps" and "lower back", but has a single "shoulders" group. — [dist/exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)
- wger has 15 anatomical muscles and only "Anterior deltoid" for shoulders. — [wger muscle API](https://wger.de/api/v2/muscle/?limit=50)
- exercemus has 21 muscles plus a `muscle_groups` map from groups to muscles, for filtering. — [exercemus README](https://github.com/exercemus/exercises)
- MacroFactor Workouts shows per-muscle Sets and Volume views. Volume accounts for load and separates resistance-based from bodyweight volume. Its help article does not list the muscles. — [MacroFactor help](https://help.macrofactorapp.com/en/articles/280-muscle-groups)
- Fractional-set convention elsewhere: Boostcamp counts a bench press set as 1 chest set and 0.5 triceps sets. — [Boostcamp muscle tracker](https://www.boostcamp.app/features/muscle-tracker) (search snippet)
- RP Hypertrophy lets users "focus on upper body, lower body or specific muscle groups" with "over 45 premade training plans or the custom meso builder". Its muscle list was not publicly documented in the sources found. — [App Store](https://apps.apple.com/ch/app/id1555614554)
- Coaching literature treats the three delt heads separately: pressing trains the front, raises the side, and rows/reverse flyes the rear. — [Outlift](https://outlift.com/best-deltoid-exercises-front-side-rear-delts/)

### Inferences
- **Recommended taxonomy.** Use a fine level for tagging and a coarse level for filters and charts:
  - Chest
  - Shoulders: front delts, side delts, rear delts
  - Back: lats, upper back (rhomboids/mid traps), traps (upper), lower back (erectors)
  - Arms: biceps, triceps, forearms (optionally brachialis)
  - Legs: quads, hamstrings, glutes, adductors, abductors, calves
  - Core: abs, obliques
  - Other: neck, full body, cardio

  This is a superset of Hevy's enum, so Hevy and Strong data map down cleanly. free-exercise-db "shoulders" and wger "Anterior deltoid" need a curation pass to assign the delt head.
- Store `primaryMuscles[]` and `secondaryMuscles[]`, and optionally a per-muscle weight (1.0 / 0.5), to enable RP-style weekly set counts.

### Gaps
- I could not find authoritative published muscle lists for RP Hypertrophy, Alpha Progression or MacroFactor (in-app only).

## Q4. Search UX techniques and iOS libraries

### Takeaway
Use SQLite FTS5 via GRDB: a `unicode61` table with prefix indexes over name plus aliases, weighted bm25, and optionally a trigram table for substring and typo tolerance. Add a hand-curated abbreviation and synonym expansion table (RDL, OHP, DB, BB…), and blend the text score with the user's recency and frequency. For about 1–2k rows, an in-memory fuzzy matcher (Fuse-Swift/Ifrit) is also fast enough.

### Cited Findings
- **FTS5 trigram tokenizer:**
  - It "treats each contiguous sequence of three characters as a token, allowing FTS5 to support more general substring matching". Options are `case_sensitive` and `remove_diacritics`.
  - "Substrings consisting of fewer than 3 unicode characters do not match any rows".
  - Trigram tables also support indexed LIKE/GLOB. — [SQLite FTS5 docs](https://www.sqlite.org/fts5.html)
- The trigram tokenizer "shipped as a feature in December 2020 in SQLite 3.34.0". — [simonw/sqlite-fts5-trigram](https://github.com/simonw/sqlite-fts5-trigram)
- **FTS5 prefix queries and ranking:**
  - Prefix queries (`"abc*"`) can be sped up with `prefix='2 3'` indexes.
  - `bm25()` takes per-column weights, e.g. `bm25(t, 10.0, 5.0)`, and better matches get numerically lower scores.
  - The `porter` tokenizer adds English stemming. — [SQLite FTS5 docs](https://www.sqlite.org/fts5.html)
- **GRDB.swift** (MIT, about 8.7k stars, active Sept 2026) is the standard Swift SQLite toolkit with FTS5 support. Its PR #1655, "Add support for the FTS5 trigram tokenizer", is still **open**. It works around an SQLite trigram bug with non-nul-terminated strings that was fixed in Nov 2024, so trigram tables may need raw SQL. — [GRDB PR #1655](https://github.com/groue/GRDB.swift/pull/1655); [GRDB GitHub API](https://api.github.com/repos/groue/GRDB.swift)
- **In-memory fuzzy libraries:**
  - **Fuse-Swift** (krisk/fuse-swift): Apache-2.0, about 950 stars, last push 2026-05-22, "A lightweight fuzzy-search library, with zero dependencies".
  - **Ifrit** (ukushu/Ifrit): MIT, 99 stars, last push 2026-03-20, "Swift library for fuzzy search". — [fuse-swift API](https://api.github.com/repos/krisk/fuse-swift); [Ifrit API](https://api.github.com/repos/ukushu/Ifrit)
- **Filter dimensions:** Hevy's library offers search plus two primary filters, equipment and muscles. — [HotelGyms Hevy guide](https://HotelGyms.com/blog/how-to-use-the-hevy-app) (search snippet)
- **Alias data available to seed synonyms:** wger has 74 English entries with aliases, e.g. RDL, OHP, close-grip bench press, one arm DB rows. — [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)

### Inferences
- **Suggested pipeline:**
  1. Normalize the query: lowercase, strip punctuation and diacritics, singularize (curls → curl).
  2. Expand tokens via a synonym table. Examples:
     - DB → dumbbell, BB → barbell, KB → kettlebell, SM → smith machine
     - RDL → romanian deadlift, SLDL → stiff-leg deadlift
     - OHP → overhead press/shoulder press, CGBP → close-grip bench press
     - SSB → safety squat bar, EZ → ez bar/sz-bar
     - BSS → bulgarian split squat, GHR → glute-ham raise
     - pulldown ↔ pull-down, pushup ↔ push-up
  3. Run an FTS5 MATCH with prefix on every token, weighted on name over aliases over muscles.
  4. If there are fewer than N hits, fall back to the trigram table or Fuse for typos.
  5. Final score = text relevance + w1·log(1+useCount) + w2·recencyDecay + boost when the equipment matches an active filter chip.
  6. When the query is empty, show "Recent" and "Frequent" sections, then show results filtered by chips.
- **Filter chips:** muscle group (coarse), equipment, movement pattern, mechanic, and "my custom".
- Plain `LIKE '%x%'` over about 1.5k rows is also instant on device. FTS and trigram add value mainly for ranking and typo tolerance, not speed.

### Gaps
- No benchmark data for FTS5 against Fuse-Swift on about 1.5k rows on iOS. No published ranking formulas from Strong or Hevy.

## Q5. Recommendation: datasets to use and merge, and an exercise schema

### Takeaway
Build a bundled `exercises.sqlite` (or JSON) in four steps:
- **Base:** wger (CC-BY-SA/CC0; best modern coverage and aliases).
- **Merge:** free-exercise-db (public domain; adds mechanic, force, level and secondary muscles), de-duplicated by normalized movement + equipment.
- **Add:** a hand-curated "modern variations" file for the gaps (Jefferson curl, SSB squat, Spoto press, seal row, chest-supported row variants, cable variations, etc.).
- **Re-tag:** everything with a unified muscle taxonomy and Strong-style display names.

Keep source and license per row, and include an attribution screen.

### Cited Findings
- License status supporting this choice: free-exercise-db is Unlicense/public domain. wger exercises are CC-BY-SA 4 (781), CC-BY-SA 3 (132) and CC0 (26), with per-exercise `license_author`. — [free-exercise-db LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md); [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)
- Modern coverage measured: wger has Bayesian Curl, Belt Squat, Pendulum Squat, JM Press, Kelso shrugs, Meadows Row, Larsen Press, Pec Deck, Cross-Body Cable Y-Raise and Nordic Curl. free-exercise-db has only JM Press. — [wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000); [free-exercise-db](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)
- exercemus's `variation_on` field is a useful precedent for parent/variation links (e.g. Close-Grip Incline Bench Press is a variation of both close-grip bench and incline bench). — [exercemus README](https://github.com/exercemus/exercises)
- Hevy's exercise-type enum is a good precedent for set-logging modes. — [Hevy API docs](https://api.hevyapp.com/docs/)

### Inferences
- **Suggested schema**, as a SQLite table plus an FTS5 shadow table:
  ```
  Exercise {
    id: String (stable slug, e.g. "bench-press-barbell")
    displayName: String              // "Bench Press (Barbell)"  (Strong-style)
    baseMovement: String             // "Bench Press"
    equipment: Enum                  // barbell, dumbbell, cable, machine, smith_machine, kettlebell, ez_bar, trap_bar, safety_squat_bar, landmine, band, bodyweight, plate, suspension, sled, other
    attachment/grip/stance: String?  // "rope", "close grip", "neutral", "single-arm"
    aliases: [String]                // "RDL", "OHP", "Bayesian Curl" ...
    primaryMuscles: [Muscle]         // fine taxonomy (front_delts, side_delts, rear_delts, lats, upper_back, ...)
    secondaryMuscles: [Muscle]       // counted as 0.5 sets by default
    movementPattern: Enum            // horizontal_push, vertical_push, horizontal_pull, vertical_pull, squat, hinge, lunge, knee_flexion, knee_extension, hip_extension, elbow_flexion, elbow_extension, shoulder_abduction, shoulder_flexion, carry, core_anti_extension, rotation, calf_raise, other
    mechanic: compound | isolation
    laterality: bilateral | unilateral | alternating
    logType: weight_reps | reps_only | bodyweight_weighted | assisted | duration | weight_duration | distance_duration
    category: strength | olympic | powerlifting | strongman | cardio | stretching | plyometric
    variationOf: [exerciseId]?
    instructions: [String]?
    source: "wger" | "free-exercise-db" | "curated" | "user"
    sourceId: String?, license: String?, licenseAuthor: String?
    isCustom: Bool, isHidden: Bool
  }
  ExerciseUsage { exerciseId, useCount, lastUsedAt }  // for ranking
  ImportAlias { externalName ("Bench Press (Barbell)"), app ("strong"), exerciseId }
  ```
- Effort estimate: merging and de-duplicating about 1,800 raw rows into about 1,200–1,500 entries, then hand-assigning delt heads, movement pattern and logType, is a one-time curation job. It is scriptable with heuristics on name and equipment, plus manual review. This is an inference, not measured.

### Gaps
- Exact overlap and de-duplication counts between wger and free-exercise-db were not computed.
- Whether wger's images carry the same per-exercise licenses was not checked; images are separate API objects.
