# Logging-first workout tracker apps (Strong, Hevy, Setgraph, FitNotes, JEFIT, StrongLifts, RepCount, Lyfta, Liftin' and others): state in 2025-2026

Research date: 2026-10-29. Caveats on method:
- reddit.com cannot be reached by the search/fetch tools here (the search API rejects the domain), so **no first-hand Reddit quotes were collected**. User sentiment below comes from App Store review themes, store ratings, and third-party review and comparison sites.
- Many 2026 "comparison" pages are run by competing apps (Hevy, Setgraph, SensAI, PRPath, Kinoku, Arvo and others). These are flagged where cited. Treat their verdicts as marketing, but their concrete feature and price facts usually match each other.
- Gymverse, Progression and Workout Notes were **not researched** because of the tool budget (see Gaps).

---

## Q1. Core logging UX (taps per set, previous performance, rest timer, supersets, warm-ups, set types, RPE/RIR, notes, plate calculator)

### Takeaway
Strong, Hevy and Setgraph all reach a set-logging flow of about 2–3 taps with an automatic rest timer, supersets and RPE. The real differences are in what is paywalled: Strong locks the plate and warm-up calculators behind PRO, while Hevy gives the plate calculator free. There are also smaller touches: Strong supports per-set rest times, Hevy has three levels of pinned notes, and Setgraph has swipe-to-copy sets and a "Next Set Due" alert. None of the apps checked clearly offers RIR as a first-class field separate from RPE.

### Cited Findings
**Strong**
- Set tags: Warm Up, Failure and Drop Set. Supersets and grouped exercises are supported. — [SensAI Strong review 2026](https://www.sensai.fit/blog/strong-app-review-2026)
- RPE is optional on a 6–10 scale, and the review maps it to RIR (RPE 8 ≈ 2 RIR). There is no separate RIR field. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Hevy's comparison credits Strong with per-set rest times, but says RPE entry costs an extra tap. Both apps get "auto rest timers and 2-3 tap logging". — [Hevy vs Strong (Hevy marketing, Oct 2026)](https://www.hevyapp.com/compare/strong/)
- The plate calculator and warm-up calculator are PRO-only. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026); [Hevy compare](https://www.hevyapp.com/compare/strong/)
- 6.5.0 (12 Aug 2026) added Live Activity and Dynamic Island rest timers. 6.4.2 (25 Jun 2026) fixed the RPE keyboard on iOS 27. — [SensAI version list](https://www.sensai.fit/blog/strong-app-review-2026)
- Routines can store pre-logged RPE. — [Hevy compare](https://www.hevyapp.com/compare/strong/)

**Hevy**
- Set types, RPE, supersets, notes and a rest timer are available. — [Setgraph Hevy vs Strong article](https://setgraph.app/articles/hevy-vs-strong-app-comparison-2026)
- RPE is switched on in settings and takes values from 6 to 10 per set. I found no mention of a dedicated RIR field. — [PRPath Hevy review 2026 (snippet)](https://prpath.app/blog/hevy-app-review-2026.html)
- Supersets are free and include "smart scrolling". The plate calculator is free. There is one default rest time, versus Strong's per-set rest. Routines can store rep ranges. — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- The October 2026 update added three levels of notes: pinned exercise notes (shown every time you do the exercise), pinned routine notes (only for that exercise in that routine), and workout notes (shown the next time you train that exercise). It also added a **custom workout keyboard** to speed up set entry, rolling out over several weeks. "Single vs. double weights logging" was postponed to 2027. — [Hevy Oct 2026 Community Update](https://www.hevyapp.com/community-updates/october-26/)
- One third-party review lists warm-up sets as a Pro feature. This is unverified against Hevy's own docs. — [SensAI Hevy review (search snippet)](https://www.sensai.fit/blog/hevy-review-2026)

**Setgraph (iOS 27.0.0, 8 Oct 2026)**
- Logs sets with minimal taps and swipe actions that copy previous sets. Supports grouped supersets, circuits and multisets (multisets with presets arrived in 26.6.0, Jun 2026). Rest timers start automatically and appear on the Lock Screen and Dynamic Island. A "Next Set Due" notification is included, along with "Smart Plates" (plate math). — [Setgraph App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)
- Exercise metrics are customizable (calories, incline and others), and duration tracking for timed holds arrived in 26.4.3. — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)
- Review complaints: the add-set button is small and badly placed, leading to accidental edits of earlier sets. Search autocomplete sometimes closes the exercise when a suggestion is tapped. A 2025 review said set order became reversed by default. — [App Store reviews](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)

**StrongLifts 5x5**
- The warm-up calculator builds light sets up to the day's work weight. The plate calculator works for any bar or plate type and opens by tapping the weight; on Apple Watch you scroll. Auto progression and auto deload use a user-set failure count and percentage. — [StrongLifts app page](https://stronglifts.com/app/)

**RepCount**
- Supersets and drop sets are **Premium**. Logging and the rest timer are free. — [RepCount site / search summary](https://www.repcountapp.com/); [Boostcamp budget list](https://www.boostcamp.app/best/budget)

**Liftin'**
- Rules can adjust weights based on results. The Apple Watch app has Quick Edit and long-press to adjust a set (as of 2020). — [App Store](https://apps.apple.com/app/id1445041669); [iMore 2020 (old)](https://imore.com/liftin-workout-tracker-has-ios-14-widgets-new-watch-app-and-tons-more)

### Inferences
- Ideas worth copying: per-set rest times (Strong); swipe-to-copy the previous set (Setgraph); a "Next Set Due" notification plus a Live Activity rest timer (Setgraph and Strong 6.5); three tiers of pinned notes (Hevy); a custom numeric keyboard (Hevy); warm-up and plate calculators as free core tools (Strong charges for them, which reviewers repeatedly flag).
- RPE is common, but none of the apps checked clearly models RIR natively. Offering RPE or RIR as a user preference would be a differentiator for advanced lifters.

### Gaps
- Exact tap counts per app were not measured. The "2–3 taps" figure comes from Hevy's own comparison.
- Exactly how each app shows previous performance (inline "previous" column vs. ghost text) was not confirmed from primary docs in this session. Strong's well-known "Previous" column is not sourced here.
- FitNotes, JEFIT and Lyfta logging details were not verified.

---

## Q2. Exercise library (size, search, filters, custom exercises, muscle mapping)

### Takeaway
Library sizes run from about 250 (Strong) to about 450 (Hevy) to 1,400+ (Lyfta), with JEFIT marketed as the deepest. Search quality is a known weak spot: Strong had to ship "improved exercise search ranking" in April 2026, and Setgraph reviews complain about autocomplete. Limits on custom exercises differ sharply between apps.

### Cited Findings
- Strong: about 250 exercises, "many with animations". Unlimited free custom exercises with minimal fields, and no duplication of library exercises. — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- Strong 6.3.2 (16 Apr 2026): "improved exercise search ranking". 6.3.0 (19 Mar 2026): Template Search. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Hevy: about 450 exercises with demo animations and muscle info. Custom exercises are limited to **7 on free** (unlimited with Pro), carry richer detail, and can be duplicated from library exercises. — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- Lyfta: a 1,400+ exercise library. — [search summary of Lyfta review sites](https://justuseapp.com/en/app/6443740936/lyfta-gym-workout-tracker/reviews)
- JEFIT is described as having "the deepest exercise library" among Strong alternatives. — [Strong-alternatives roundups (search summary)](https://www.gymnoteplus.com/blog/strong-app-alternatives)
- Setgraph added exercise illustrations (start, middle and end positions) in 26.9.2 (Sep 2026) and muscle group summaries in 26.4.0 (Mar 2026). Exercises can be grouped by workout, muscle group, program or day, with colors and multi-list assignment. — [Setgraph App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)

### Inferences
- An advanced lifter migrating 4 years of Strong data will have many custom exercises. Hevy's free cap of 7 custom exercises is a friction point. An app that keeps unlimited custom exercises and lets you clone a library exercise (as Hevy Pro does) is the better pattern.
- Strong's search needing a ranking fix in 2026 supports the user's complaint about search. Fuzzy matching and aliases are an opening.

### Gaps
- No source confirmed fuzzy search or alias support in any app.
- Primary/secondary muscle mapping per app was not confirmed from primary docs. Hevy has "muscle info" and Setgraph has muscle summaries, but granularity is unknown.
- Equipment filters were not verified.

---

## Q3. Templates, routines, folders, programs

### Takeaway
Strong caps free users at 3 templates. Hevy caps free users at 4 routines but ships 26 free program splits. Setgraph is strongest on organization (colored folders and programs, sharing a folder by link). Lyfta reportedly gives unlimited free routines.

### Cited Findings
- Strong free tier: 3 templates. PRO: unlimited. Strong has no program library. — [Hevy compare](https://www.hevyapp.com/compare/strong/); [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Strong 6.3.0 (Mar 2026) added Template Search. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Hevy free tier: 4 routines, plus 26 free splits and routine categories. Hevy Trainer (Pro) generates programs; the July and October 2026 updates added per-session or permanent exercise swaps, injury management and more splits. — [Hevy compare](https://www.hevyapp.com/compare/strong/); [Hevy Oct 2026](https://www.hevyapp.com/community-updates/october-26/); [Hevy community updates index](https://www.hevyapp.com/community-updates/)
- Hevy's Strong import does **not** bring over routines. Imported workouts keep their names and can be saved as routines manually. — [Hevy Strong import page](https://www.hevyapp.com/import/strong/)
- Setgraph: folder sharing by link (26.3.0, Feb 2026) and custom colors for folders and programs (26.6.0). — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)
- Lyfta: unlimited routines on the free tier (third-party claim). — [search summary](https://www.sensai.fit/blog/liftoff-vs-lyfta-vs-hevy-2026)

### Inferences
- Folders, colors and share links, together with unlimited free templates, are table stakes the user would expect. Rebuilding routines from imported workout names (Hevy's approach) is a useful migration pattern.

### Gaps
- Duplicating and reordering templates was not verified for each app.

---

## Q4. Analytics (e1RM, PRs, volume per muscle, weekly sets, calendar, exercise pages, body measurements)

### Takeaway
Analytics is Strong's weakest area. Charts are mostly PRO, the free tier shows only a monthly calendar, e1RM uses Brzycki, and body measurements are PRO-only. Setgraph is the most analytics-oriented of the logging-first apps: it lets you choose the 1RM formula, filter set history by weight or rep range, see %1RM tables, and has PR tabs and a muscle recovery view.

### Cited Findings
- Strong e1RM uses the **Brzycki** formula, and the reviewer notes estimates get unreliable above about 12 reps. Volume and 1RM progression graphs exist, but the free tier gets only "some" charts. Body part measurements are PRO. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Strong free: "monthly calendar only". Exercise charts need PRO. Hevy free: most charts, limited to 3 months of history. — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- Strong 6.2.9 (Mar 2026) added a shortcut to add measurements from Profile widgets. 6.4.0 (May 2026) added Calendar and Activity home-screen widgets. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Setgraph: a choice of 1RM formula. Its calculator advertises Epley and Brzycki. Set history can be filtered by rep or weight range, and there are %1RM tables, session metrics and a calendar. Per-exercise detail shows history, analytics, records and 1RM on one screen. Setgraph also added a muscle recovery view and muscle group summaries (26.4.0) and Personal Records tabs with celebrations and share cards (26.8.0). Users have asked for total volume in Set Details. — [Setgraph App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676); [Setgraph search summary](https://setgraph.app/articles/all-articles)
- Hevy reportedly offers muscle group breakdown charts, workout frequency and volume reports. This is third-party information. "Annual PRs" and a "Strength Level expansion" are listed as upcoming as of Oct 2026. — [PRPath (snippet)](https://prpath.app/blog/strong-vs-hevy-2026.html); [Hevy Oct 2026](https://www.hevyapp.com/community-updates/october-26/)
- FitNotes (Android): an analysis view with muscle group breakdown, personal-best tracking, and a body-weight tracker trended alongside workouts. — [WhistleOut/Android Authority FitNotes review](https://cellphoneplans.androidauthority.com/CellPhones/Guides/fitnotes-app-review)
- RepCount: charts and records are Premium. — [RepCount](https://www.repcountapp.com/)
- Liftin': short- and long-term progress graphs. — [App Store](https://apps.apple.com/app/id1445041669)
- Strong-alternative roundups repeatedly cite "basic progress charts locked behind a subscription" as a Strong complaint. — [search summary of alternatives roundups](https://alphaprogression.com/en/blog/best-strong-alternatives)

### Inferences
- Gaps an analytics-focused Strong replacement can fill: a selectable e1RM formula (Epley/Brzycki/others), with a warning or exclusion above about 10–12 reps; history filtered by rep range (Setgraph); free, unlimited-history charts; weekly sets per muscle (only partly available elsewhere); and free measurements.

### Gaps
- Hevy's e1RM formula was not found.
- I found no confirmed "weekly hard sets per muscle" chart in any app with primary-source evidence.
- No year-heatmap view was confirmed in any app. Calendars exist in Strong, Setgraph and Hevy.

---

## Q5. Data portability (Strong CSV import, export formats, Apple Health, iCloud, Apple Watch)

### Takeaway
Hevy is the only major app with an official Strong CSV importer, and it is free. It carries over workouts, exercises, sets, reps, weights and dates, but not routines or supersets, and apparently not RPE, notes, set types or measurements. Strong cannot import anything, including its own exports. Setgraph added CSV export only in Feb 2026 and has no documented Strong import. Many indie and open-source projects parse Strong CSVs, which is a strong signal that the data is worth migrating.

### Cited Findings
- Hevy imports from Strong: workout history, exercises, sets, reps, weights and dates. Routines and supersets are **not** imported. The export must be in English, and units are converted automatically to the Hevy account unit. Custom exercises are matched to the library where possible and otherwise created. Imported data merges with existing workouts by date. Path: Profile > Settings > Export & Import Data > Import Data. — [Hevy Strong import](https://www.hevyapp.com/import/strong/)
- Hevy support says it accepts only Strong exports and "doesn't have the manpower" to help reformat converted files. One import at a time, and it can be undone. Help docs disagree on whether weights must be in kg. — [Hevy help (search snippet)](https://help.hevyapp.com/hc/en-us/articles/35687878672663); [search summary](https://www.hevyapp.com/compare/strong/)
- Strong: CSV export on iOS (Settings > Export Strong Data) and Android (Export Data). Exports **cannot be re-imported**. Individual workouts and templates can be shared via link. — [Strong help center](https://help.strongapp.io/article/235-export-workout-data)
- Strong sync: Strong Cloud backup. Apple Health sync covers workouts, bodyweight, body fat %, nutrition and Activity Rings. Strong 6.5.0 made Apple Health imports faster. Health Connect on Android is in public beta. The direct MyFitnessPal integration was discontinued. The Apple Watch app requires watchOS 10+, offers HR, calories and Live Sync, and per Strong's help center, "Not all features of Strong are available on Apple Watch." — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Hevy platforms: iOS, Android, Apple Watch, Wear OS and web. Integrations: Apple Health, Health Connect, Strava (full-detail sync since July 2026), plus ChatGPT, API and MCP. Hevy exports both workouts and measurements. — [Hevy compare](https://www.hevyapp.com/compare/strong/); [Setgraph article](https://setgraph.app/articles/hevy-vs-strong-app-comparison-2026); [Hevy Oct 2026](https://www.hevyapp.com/community-updates/october-26/)
- Setgraph: CSV export (26.3.0, Feb 2026), Apple Health sync, and Apple Watch Sessions with live HR plus a complication (27.0.0, Oct 2026). No Strong import was documented. — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676); [Setgraph article](https://setgraph.app/articles/hevy-vs-strong-app-comparison-2026)
- Lyfta is described as having "the widest import support" and Garmin and Fitbit links. — [SensAI Liftoff/Lyfta/Hevy (search snippet)](https://www.sensai.fit/blog/liftoff-vs-lyfta-vs-hevy-2026)
- FitNotes (Android): CSV export, and backup to device, Google Drive or Dropbox, but no cloud sync. — [Android Authority/WhistleOut](https://cellphoneplans.androidauthority.com/CellPhones/Guides/fitnotes-app-review)
- StrongLifts: Apple Health sync of workouts and calories, and an Apple Watch app with set logging, rest notifications, warm-up and plate calculators and HR. Export was not described on the app page. — [StrongLifts app](https://stronglifts.com/app/); [StrongLifts export help](https://support.stronglifts.com/article/131-export)
- Indie apps and tools that parse Strong CSV include LiftShift, Arvo, Kinoku, openGym, swift-workout-importer, and several app PRs. — [LiftShift](https://liftshift.app/supported-apps/strong/); [gossamr/swift-workout-importer](https://github.com/gossamr/swift-workout-importer); [openGym DATA_IMPORTS](https://github.com/DuarteSantos8/openGym/blob/main/docs/DATA_IMPORTS.md)

### Inferences
- A complete Strong importer (keeping RPE, notes, workout notes, W/D/F set types and timed and distance sets, and inferring templates from recurring workout names) would beat Hevy's lossy import.
- Since Strong cannot re-import, the original CSV should be kept as the source of truth.

### Gaps
- iCloud backup was not verified for Setgraph, Hevy or others. Strong uses its own "Strong Cloud".
- Whether Hevy keeps RPE, notes or set types on import is not explicitly stated. "Assume not" is an inference from the omission.

---

## Q6. Strong CSV export format (exact columns, measurements, delimiter, units)

### Takeaway
Current Strong 6.x exports (2026) are **semicolon-delimited, fully quoted**, with unit-suffixed headers: `"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"`. Older and iOS exports are comma-delimited, with `Duration` as text such as "1h 5m" and unitless weight, and no `Workout #` column. At least four layouts exist. Weight is written in kg whatever the display unit. Set Order holds markers (W, D, F) plus special "Rest Timer" and "Note" rows. Body measurements are not part of the workout CSV, as far as any source shows.

### Cited Findings
- 2026 Strong 6.x header, quoted from a real 20,407-row export (655 workouts, 2018–2026): `"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"`. It is semicolon-delimited. Duration is in seconds ("not the older '1h 5m' text format"), distance in metres, weight in kg, and `Seconds` holds timed sets. Importers that split only on commas fail with this file. — [openGym issue #394 (opened 5 Oct 2026)](https://github.com/DuarteSantos8/openGym/issues/394)
- Older column list (2021): Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE (comma layout). — [intervals.icu forum](https://forum.intervals.icu/t/import-strong-data-weightlifting-app/5531)
- Four Strong layouts in the wild:
  1. iOS comma-delimited
  2. Android semicolon with separate `Weight Unit` and `Distance Unit` columns
  3. All-quoted semicolon with `Duration (sec)`, `Weight (kg)` and `Distance (meters)`
  4. An older semicolon layout

  Comma decimals appear in semicolon files. Dates come in 24h and 12h forms, the latter with a narrow no-break space before am/pm. Set markers are W, D and F, plus "Rest Timer" and "Note" rows; Note text attaches to the exercise's first set. Stray unescaped quotes occur. — [fdsimms/todo PR #3869](https://github.com/fdsimms/todo/pull/3869)
- Strong writes weight in kg regardless of the app's display unit. A competitor's importer dropped weights and turned Rest Timer rows into empty sets. — [Kinoku vs Strong (competitor)](https://kinoku.app/compare/kinoku-vs-strong)
- Another importer treats the semicolon layout as kg and the comma layout as unitless, and skips Note and Rest Timer rows. — [dougray/dugcanlift-lift-ios PR #63](https://github.com/dougray/dugcanlift-lift-ios/pull/63)
- An Arvo blog claims older Strong CSVs had no RPE column. This conflicts with the 2021 forum list, so the RPE column may have been added in some versions only. — [Arvo blog (search snippet)](https://arvo.guru/blog/hevy-to-arvo-csv-import)
- Hevy's own CSV uses `weight_kg`/`weight_lbs` and `distance_km`/`distance_miles` headers, with dates such as "26 Feb 2024, 08:00" or "Oct 1, 2026, 8:28 PM". — [fdsimms PR #3869](https://github.com/fdsimms/todo/pull/3869)
- Strong's help center does not document columns, units, delimiter or measurements. — [Strong help](https://help.strongapp.io/article/235-export-workout-data)

### Inferences
- A robust importer should: sniff the delimiter from the header line; handle quoted fields and stray quotes; accept both `Weight` and `Weight (kg)` (plus a `Weight Unit` column); parse `Duration` both as seconds and as "1h 5m" text; parse 12h and 24h dates, including U+202F before AM/PM; accept comma decimals; interpret Set Order values W, D and F as warm-up, drop and failure; drop or convert "Rest Timer" and "Note" rows; and group rows into workouts by `Workout #` or by (Date + Workout Name).
- Body measurements and bodyweight probably need a separate path, such as Apple Health, which Strong writes bodyweight and body fat % to, or manual entry. This is unconfirmed.

### Gaps
- No source confirms whether body measurements appear in any Strong export. Ask the user to check their own export.
- The exact date format string in the current export was not quoted.
- The meaning of W, D and F as warm-up, drop and failure is inferred from Strong's set tags; the PR does not define them.

---

## Q7. Pricing in 2026 and paywalls

### Takeaway
Most apps cost about $3–5 a month. Lifetime plans: Hevy $74.99, Strong $99.99, Setgraph $199.99. JEFIT has no lifetime plan at $69.99/yr. Liftin' is $24.99/yr with a free cap of 5 workouts a month. FitNotes (Android) is fully free.

### Cited Findings
- **Strong PRO:** $4.99/mo, $19.99 for 6 months, $29.99/yr, $99.99 lifetime. Lower $3.99, $23.99 and $79.99 prices are also listed in some regions or at some times. Free: unlimited logging, no ads, 3 templates. PRO: unlimited templates, all charts, measurements, plate and warm-up calculators, themes. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026); [Hevy compare](https://www.hevyapp.com/compare/strong/)
- **Hevy Pro:** $2.99/mo, $23.99/yr, $74.99 lifetime. Free: 4 routines, 7 custom exercises, 3 months of charts, plate calculator, social features. — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- **Setgraph:** $4.99/mo, $29.99/yr, $199.99 lifetime, with a free trial. — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)
- **JEFIT Elite:** $12.99/mo or $69.99/yr ($52.49 first year), with no lifetime plan. The free tier has ads, and the watch app is Elite-only. — [SensAI Jefit vs Hevy (search summary)](https://www.sensai.fit/blog/jefit-vs-hevy-2026)
- **RepCount Premium:** $4.99/mo or $29.99/yr. Charts, records, supersets, drop sets and export are Premium. Logging, the rest timer, sync and backup are free and ad-free. — [RepCount](https://www.repcountapp.com/)
- **Lyfta:** prices conflict. One source says about $3/mo or $30/yr; the in-app range is $5.99–$79.99. — [Bryant Wimmer review](https://bryantwimmer.com/articles/lyfta-app-review-promo-code); [SensAI](https://www.sensai.fit/blog/liftoff-vs-lyfta-vs-hevy-2026)
- **Liftin':** free for 5 workouts a month, Unlimited $24.99/yr, and the developer collects no data. — [App Store](https://apps.apple.com/app/id1445041669)
- **StrongLifts Pro:** $9.99/mo, $59.99/yr or $89.99 lifetime, from a **low-reliability aggregator only** and not verified with StrongLifts. — [subger](https://subger.com/en/nz/service/stronglifts-pro)
- **FitNotes (Android):** free, no ads, no IAP. FitNotes 2 on iOS is a separate app whose free version saves up to 12 workouts. — [Android Authority](https://cellphoneplans.androidauthority.com/CellPhones/Guides/fitnotes-app-review); [FitNotes 2 listing](https://apps.appfollow.io/ios/fitnotes-2-gym-workout-log/1538896016?country=us)

### Inferences
- The user's dislike of paywalls lines up with the most-cited Strong complaint: basic charts and calculators sit behind PRO.

### Gaps
- StrongLifts pricing was not confirmed from an official source.

---

## Q8. Recent features and roadmap (2025-2026)

### Takeaway
Strong ships small monthly polish updates (widgets, search ranking, Live Activities) but no major analytics work. Hevy ships roughly weekly and is putting heavy investment into AI and integrations (Trainer, ChatGPT/MCP), which this user explicitly does not want. Setgraph has the fastest cadence of logging and analytics features among the pure loggers, but it is also adding an AI Planner, streaks and illustrations, which reviewers call feature creep.

### Cited Findings
- **Strong 2026:**
  - 6.2.9 (Mar): measurement shortcut
  - 6.3.0 (Mar 19): Template Search
  - 6.3.2 (Apr 16): search ranking
  - 6.3.3 (Apr 30): Watch Button Repeat toggle, and a fix for freezes on large histories
  - 6.4.0 (May 28): widgets
  - 6.4.2 (Jun 25): iOS 27 fixes
  - 6.5.0 (Aug 12): Live Activity rest timers

  — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- One review claims the March 2026 v6.2 update rebuilt the Apple Watch app. SensAI's version list does not mention a rebuild. — [search summary of 2026 Strong reviews](https://www.boostcamp.app/best/workout-apps); compare [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Update frequency: Hevy roughly weekly, Strong roughly monthly (Hevy's claim). — [Hevy compare](https://www.hevyapp.com/compare/strong/)
- **Hevy:**
  - July 2026: Trainer upgrades, a native redesign (Liquid Glass and Material 3), a faster app, and full-detail Strava sync.
  - Sep 2026 (v3.1.13): export a workout to ChatGPT or Claude.
  - Oct 2026: three-level notes, Trainer upgrades, Hevy in ChatGPT with API and MCP, and a custom keyboard.
  - Upcoming: Claude and Gemini connectors, Gym Profiles, wearable updates, Annual PRs, Strength Level expansion. Single/double weight logging is pushed to 2027.

  — [Hevy updates index](https://www.hevyapp.com/community-updates/); [Hevy Oct 2026](https://www.hevyapp.com/community-updates/october-26/); [PRPath (snippet)](https://prpath.app/blog/hevy-app-review-2026.html)
- **Setgraph 2026:**
  - 26.3.0 (Feb 16): CSV export and folder sharing
  - 26.4.0 (Mar 29): muscle recovery view and summaries
  - 26.4.3 (May 2): custom metrics and duration
  - 26.5.0 (May 20): streaks, rest days and a streak calendar
  - 26.6.0 (Jun 23): multisets with presets, and colors
  - 26.8.0 (Aug 18): PR tabs, celebrations and share cards
  - 26.9.2 (Sep 18): illustrations
  - 27.0.0 (Oct 8): Watch Sessions with HR, a complication, iPhone Duo layouts, a redesigned **AI Planner**, and tab-bar timers

  — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)

### Inferences
- Strong's 2026 work confirms the "stagnation" complaint: the changes are widgets, Live Activities and search fixes, with no analytics overhaul. A fix for freezes on large histories (6.3.3) is relevant for a user with 4 years of data.

### Gaps
- No public roadmap was found for Strong.

---

## Q9. User sentiment (praise and complaints), especially Strong's weaknesses

### Takeaway
Strong is praised for fast, clean, ad-free logging and its lifetime option. It is criticized for paywalled charts and calculators, slow development, weak analytics, no programs, and a Watch app that does less than the phone. Hevy is praised for its generous free tier and rapid updates, but its social and AI direction makes it a poor fit for a minimal, no-AI user. Setgraph is praised for speed and organization but criticized for UI bugs and feature creep.

### Cited Findings
- Strong ratings: 4.9 on the App Store (about 109K ratings per SensAI; Hevy cites 220K+) and 4.3 on Google Play (about 40–43K). — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026); [Hevy compare](https://www.hevyapp.com/compare/strong/)
- Strong praise: logging experience, no ads, and lifetime pricing as its "strongest selling point". Strong complaints: feature velocity historically slower than Hevy's, which makes lifetime purchases a risk; no programming; weak Android support; feels stagnant; charts locked behind PRO; "rigid input method and stalled development". — [2026 Strong review roundups (search summary)](https://www.boostcamp.app/best/workout-apps); [RepReturn](https://repreturn.com/strong-app-review/); [alternatives roundups](https://www.gymnoteplus.com/blog/strong-app-alternatives)
- Strong's own help center says its Watch app lacks some phone features. — [SensAI](https://www.sensai.fit/blog/strong-app-review-2026)
- Hevy is the most commonly recommended like-for-like Strong replacement in 2026 roundups, but the social feed is its main differentiator. 4.9 on the App Store (345K+) and 4.9 on Play (265K+), claiming 17M+ users. — [roundups (search summary)](https://www.beaugymjournal.com/blog/best-strong-app-alternatives/); [Hevy compare](https://www.hevyapp.com/compare/strong/)
- Setgraph praise: quick logging, folder organization, shows what to do next session, good value. Complaints: autocomplete bug, add-set button placement, notifications, UI regressions and feature creep, price. 4.7 from 6.2K ratings. — [App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)
- FitNotes is praised as "no account, no ads, no subscription, just a fast log and clean charts", and is the go-to recommendation for Android. — [alternatives roundup (search summary)](https://www.ellim.app/blog/fitness/best-strong-app-alternatives); [Android Authority](https://cellphoneplans.androidauthority.com/CellPhones/Guides/fitnotes-app-review)
- RepCount: 4.9 from about 13K ratings, with praise for stats and clean design. — [search summary](https://www.boostcamp.app/best/budget)
- Lyfta: 4.8. Users praise its free features, but complain about an unclear subscription model, bugs, and weak Garmin and Apple Watch support. — [JustUseApp](https://justuseapp.com/en/app/6443740936/lyfta-gym-workout-tracker/reviews)
- Liftin': one App Store reviewer says it suits lifters who only track the big lifts (bench, deadlift, squat). — [App Store](https://apps.apple.com/app/id1445041669)
- Plates is an iPhone-only, one-time-purchase logging and analytics app positioned as an alternative to Strong, Hevy and Setgraph. — [AlternativeTo](https://alternativeto.net/software/strong/)

### Inferences
- For a no-AI, minimal-clutter advanced lifter, the market gap is Strong-level logging speed with Setgraph-level analytics depth, free core tools, a lossless Strong import, and no social or AI features.

### Gaps
- **No Reddit quotes** (r/weightroom, r/powerlifting, r/naturalbodybuilding, r/StrongApp, r/Hevy) could be collected because reddit.com is blocked for these tools. Sentiment here comes from secondhand sources.
- JEFIT sentiment (ads and clutter are commonly assumed) was not verified.
- Gymverse, Progression and Workout Notes were not researched.
- No YouTube or Garage Gym Reviews coverage was retrieved.
