# Smart / Program-Driven Workout Apps: Non-AI Algorithms, UX, and Sentiment (state as of Oct 2026)

Scope: Alpha Progression, RP Hypertrophy, Liftosaur, Boostcamp, Fitbod, JuggernautAI, MacroFactor Workouts, Dr. Muscle, Caliber, Gravitus, and 2025–2026 entrants. Research ran to about 16 tool calls. RP's help center returned HTTP 403, so RP mechanics come from search snippets of that help center plus third-party reviews. Most of the algorithm descriptions come from the vendors themselves. Gravitus returned no results at all.

## 1. How each app suggests the next weight, reps, and sets (progression and autoregulation logic)

### Takeaway
Only Liftosaur publishes its progression logic fully: it is an open, scriptable DSL with built-in linear, double, and rep-sum progressions. RP has the best-known feedback loop: weekly pump, soreness, and workload ratings change the number of sets, while load rises by a small percentage each week, or a rep is added when the next available weight would be too big a jump. Alpha Progression and MacroFactor Workouts adjust targets set by set from logged performance and RIR, but neither publishes its formulas.

### Cited Findings
**RP Hypertrophy (Renaissance Periodization)**
- Set counts respond to how pumped, sore, and beaten up by volume you feel. Low pump, barely sore, and rating the workout easy lead to more sets. A good pump with soreness healing on time and a workload pushing your limits means no change. A very strong pump, soreness that prevents recovery, or too much volume leads to fewer sets. — [RP Help Center: Hypertrophy App Progressions (via search snippet; page returned 403)](https://help.rpstrength.com/hc/en-us/articles/32600173777815-Hypertrophy-App-Progressions)
- Load rises by "a few percentage points each week." If the next weight increment falls outside that range, the app adds a rep to each set instead. — [RP Help Center (snippet)](https://help.rpstrength.com/hc/en-us/articles/32600173777815-Hypertrophy-App-Progressions); related article: [How Does the App Determine When to Add Weight, Reps, and Sets?](https://hypertrophy.zendesk.com/hc/en-us/articles/14605661323671-How-Does-the-App-Determine-When-to-Add-Weight-Reps-and-Sets)
- A competitor's review describes the workflow: after the session you rate pump, soreness, and joint fatigue; sets are added when recovery is good and held or cut when fatigued; a block runs from an easy first week toward maximum adaptive volume (MAV) and then deloads. — [Mesostrength review (competitor blog, Sept 2026)](https://mesostrength.com/blog/rp-hypertrophy-app-review)
- The joint-pain rating is opaque. "What does the app do with the joint pain rating?" is a recurring r/RPHypertrophy flair with 23 posts. A Trustpilot reviewer claims to have reverse-engineered the logic and found that joint pain does not affect the calculation; this is unverified. — [GummySearch r/RPHypertrophy](https://gummysearch.com/r/RPHypertrophy/); [Trustpilot (via search snippet)](https://es.trustpilot.com/review/renaissanceperiodization.com)

**Alpha Progression**
- Each working set can get a recommended weight, a rep target, and an optional RIR target. Recommendations draw on past sessions, earlier sets in the current workout, and the planned set, so they can change from set to set. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- It only recommends weights your gym actually has (equipment-aware). If the next available jump is large, it suggests more reps at the current weight first, and recommended reps can fall above or below the planned target. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- After a weaker set or session, the next recommendation can be lower. RIR is optional; recommendations work without it. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- Recommendations start from the second time you perform an exercise, because the app needs a prior result. — [respectmyregion review 2026](https://respectmyregion.com/alpha-progression-review-2026/) (third-party snippet)
- Periodization (Pro) varies sets, reps, RIR, and optionally drop sets from week to week within a mesocycle. It needs a plan of at least 2 weeks. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)

**Liftosaur (open, user-scriptable "Liftoscript")**
- Prescription syntax looks like `Bench Press / 3x8-12 / 90s`, with load given as RPE (`@8`, converted from RPE tables), percent of 1RM (`80%`), or an absolute weight (`60kg`). Suffix flags: `1x5+` marks an AMRAP set, `@8+` logs RPE, `100lb+` asks for the actual weight used. — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)
- Built-in progressions:
  - `lp(increase, increaseAttempts, currentAttempt, decrease, decreaseAttempts, currentDecreaseAttempt)` is linear progression with optional deload-on-failure, e.g. `lp(5lb, 2, 1, 10lb, 3)`.
  - `dp(increase, minReps, maxReps)` is double progression: reps climb to the max, then weight rises and reps reset to the min, e.g. `dp(5lb, 8, 12)`.
  - `sum(threshold, increase)` adds weight when total reps across sets exceed the threshold.
  - `progress: none` turns progression off, e.g. for a deload week.
  - — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)
- Custom scripts run after the workout with readable values such as `completedReps`, `reps`, `weights`, `RPE`, `rm1`, `week`, `day`, and helpers such as `calculate1RM` and `rpeMultiplier`. Persistent state variables (e.g. `custom(attempt: 0)`) can be user-prompted with `attempt+`. Tags let one exercise's progress change another's state. — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)
- An `update:` script runs during the workout on each set tap and can add or remove sets on the fly. The docs' example adds back-off sets when set 1 hits its target. Set variations (`Squat / 5x3 / 6x2 / 10x1`) and exercise variations (`Split Squat | Bulgarian Split Squat`) can be rotated from scripts. — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)
- Liftosaur also has a REST API and an MCP server integration. — [Liftosaur docs index](https://www.liftosaur.com/docs)

**MacroFactor Workouts (Stronger By Science / MacroFactor team)**
- Released in January 2026. An October 2025 post said it was scheduled for January, and the 2026 annual report says it shipped then. — [MacroFactor Oct 2025 update](https://macrofactor.com/mm-oct-2025/); [MacroFactor 2026 Annual Report](https://macrofactor.com/annual-report-2026/) (both via search summary)
- The vendor says smart progression is "driven by rule-based logic, not generative AI." Weight and rep targets adjust from set to set and from workout to workout. — [MacroFactor Workouts page](https://macrofactor.com/workouts/)
- It is RIR-driven: an easy set (several reps in reserve) raises reps and/or load for the next set; a hard set (0–1 RIR) lowers them. Adjustments show live as you log, and progression also applies to user-built programs. — [Feastgood review (2026)](https://feastgood.com/marofactor-workouts-review/)
- Rep progression schemes (Static, Linear, Reverse Linear, Undulating) were added after launch. — [MacroFactor (via search summary)](https://macrofactor.com/annual-report-2026/)
- One reviewer saw large week-over-week jumps: squat 195→236 lb (+21%) and bench 105→125.5 lb (+19.5%). Pull-ups were programmed at 11+ reps when she reported 5. — [Feastgood review](https://feastgood.com/marofactor-workouts-review/)

**JuggernautAI (Juggernaut Training Systems)**
- Adjustment happens at several levels:
  - During the session, real-time adjustment from top-set and back-off-set RPEs.
  - After the session, a readiness score kept as a "running, weighted average."
  - At the end of each week, a check-in that adapts the next week.
  - At the end of each block (hypertrophy, strength, or peaking), larger changes.
  - RPE/RIR plus readiness ratings drive changes in volume, intensity, and frequency.
  - — [JTS Help: How JuggernautAI is individualized](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); [JTS Help: RPE and RIR](https://help.jtsstrength.com/en/articles/2-all-about-rpe-and-rir)
- A third-party comparison says readiness has been a 0–100 score since v3.0. — [Sensai comparison 2026](https://www.sensai.fit/blog/juggernaut-ai-vs-rp-hypertrophy-vs-alpha-progression-2026) (unofficial)

**Fitbod**
- Fitbod generates workouts from a per-muscle recovery percentage (0–100%) estimated from sets, reps, and load. It favors muscles not trained hard in the last 48–72 hours and can factor in Apple Health, Strava, or Fitbit activity. — [Fitbod blog: algorithm](https://fitbod.me/blog/fitbod-algorithm); [Fitbod Help: How Fitbod Creates Your Workout](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout)

**Dr. Muscle**
- Sessions use daily undulating periodization in the 5–12 rep range, with rest-pause sets and RIR. The vendor says the app "cuts sets 50% and weights 10%" automatically when a plateau is detected, defined as estimated 1RM going down. — [Dr. Muscle: Deload](https://dr-muscle.com/deload/); [Dr. Muscle: Building Muscle](https://dr-muscle.com/building-muscle/); [App Store](https://apps.apple.com/us/app/-/id1073943857)

**Boostcamp**
- Boostcamp is mainly a program library with more than 11,000 programs. Progression follows each program's prescription (percentages, RPE, and so on) rather than a single global algorithm. Pro adds "personalized programs." — [Boostcamp Pro](https://www.boostcamp.app/pro)

### Inferences
- The most transparent, borrowable rules are:
  - Liftosaur's `lp`, `dp`, and `sum` primitives.
  - RP's percentage-or-rep fallback: if the smallest available jump is more than about X% of the current weight, add a rep instead.
  - Alpha Progression's equipment-aware rounding.
  - Dr. Muscle's plateau deload (e1RM falls → −50% sets, −10% load).
  - A tracker could put all of these into a small, user-visible rule set.
- A three-way rule like "RIR above target → increase; on target → hold or add a rep; below target → reduce" appears in some form in MacroFactor, Alpha Progression, and JuggernautAI. Apps differ mainly in step sizes and in whether the adjustment applies within the session or only to the next session.
- MacroFactor's reported jumps of about 20% suggest that adjusting within a session from a single easy set can overshoot. Capping weekly load changes (e.g. at 2.5–5%) would avoid this.

### Gaps
- RP's exact percentage band, its per-week RIR schedule (commonly said to fall from about 3 RIR to 0 over a mesocycle), how much each feedback answer adds or removes in sets, and how joint pain is used are not confirmed. The help center blocked fetching (403).
- Exact formulas are not published for Alpha Progression, MacroFactor Workouts, JuggernautAI, Fitbod, or Dr. Muscle.
- No information was found for Caliber's or Gravitus's progression logic.

## 2. Volume per muscle, muscle heatmaps, and weekly set targets (MEV/MAV/MRV)

### Takeaway
Most apps chart sets or volume per muscle, but none of the sources found explain whether that count is fractional or direct-only. RP (and new clones such as Mesos) build programs around MEV/MAV/MRV volume landmarks. Boostcamp (Pro) and Fitbod offer heatmaps. A key research caveat: conclusions about volume shift depending on whether sets are counted as total, fractional, or direct.

### Cited Findings
- Alpha Progression has a "Sets per muscle" chart, a "Volume" chart, and a "most-trained muscle" report, but publishes no counting method. Custom exercises take target and auxiliary muscles plus a bodyweight-involvement setting (0–100%). — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- MacroFactor Workouts charts volume and progress for each muscle and lets you prioritize or deprioritize muscles. In Push/Pull/Legs splits it currently gives about twice as much upper-body as lower-body volume; a setting to adjust that balance is promised. — [MacroFactor Workouts](https://macrofactor.com/workouts/); [MacroFactor (via search summary)](https://macrofactor.com/mm-oct-2025/); [Feastgood](https://feastgood.com/marofactor-workouts-review/)
- Boostcamp Pro includes a per-muscle volume heatmap. — [Boostcamp Pro](https://www.boostcamp.app/pro)
- Fitbod's Recovery tab shows a heat map of muscle fatigue (recovery %). — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm)
- RP's block starts easy, ramps toward maximum adaptive volume (MAV), then deloads. Users frequently ask "Why is the app giving me so many sets?", which has its own help-center FAQ. — [Mesostrength](https://mesostrength.com/blog/rp-hypertrophy-app-review); [RP Help Center section](https://help.rpstrength.com/hc/en-us/sections/30801323964183-Navigating-the-App) (via search summary)
- Mesos: Hypertrophy Programmer (new iOS app) is built around MEV/MRV volume landmarks and RIR-based weekly volume autoregulation. — [App Store: Mesos](https://apps.apple.com/app/id6783384522)
- Fractional-set convention: an indirect exercise counts as 0.5 set, e.g. a pull-up counts as half a set for biceps. Stronger By Science suggests about 20–30 weekly fractional sets for intermediate and advanced lifters. A preprint found that volume–hypertrophy conclusions change depending on whether sets are counted as total, fractional, or direct. — [Stronger By Science (via search summary)](https://www.strongerbyscience.com/?p=60350); [Systematic review on total sets as a volume metric](https://ekoizpen-zientifikoa.ehu.eus/documentos/60cd2a75ad242a605acfaaec)

### Inferences
- For a transparent tracker, store primary and secondary muscles per exercise. Show both direct sets and fractional sets (secondary = 0.5) side by side, and let the user set per-muscle weekly target ranges instead of hard-coding MEV/MRV.
- RP's "too many sets" complaint suggests that a feedback-driven set ramp needs a cap and a clear explanation of why a set was added.

### Gaps
- None of the sources state whether Alpha Progression, MacroFactor, Boostcamp, or Fitbod count fractional sets.
- RP's default MEV/MRV values per muscle were not retrieved.

## 3. e1RM method and strength trend charts

### Takeaway
Most apps show e1RM, but few name the formula. Fitbod reportedly uses a modified Brzycki formula. Liftosaur exposes `calculate1RM` and an RPE multiplier to scripts. Dr. Muscle uses a falling e1RM as its plateau trigger. Boostcamp and Caliber add composite "Strength Scores."

### Cited Findings
- Alpha Progression shows e1RM, estimated 10RM, or volume for each set (user setting), tracks e1RM and 10RM as PRs, and shows the current PR on each exercise page. The formula is not disclosed. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- Fitbod estimates 1RM from logged sets; one source says it uses a modified Brzycki formula. Per-muscle "mStrength" scores are averaged into an Overall Strength Score. — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm); [Fitbod Insights](https://fitbod.me/blog/fitbod-insights-feature/)
- Liftoscript exposes `rm1`, `calculate1RM`, and `rpeMultiplier`, and supports RPE-based prescriptions computed from RPE tables. — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)
- Dr. Muscle treats a decline in 1RM as the plateau signal that triggers its deload. — [Dr. Muscle: Deload](https://dr-muscle.com/deload/)
- Boostcamp Pro's Strength Score is a 0–100 score across squat, bench, deadlift, overhead press, and rows. Caliber Plus also includes a Strength Score. — [Boostcamp Pro](https://www.boostcamp.app/pro); [Boostcamp: best beginner apps](https://www.boostcamp.app/best/beginners)

### Inferences
- An RPE- or RIR-aware e1RM (reps + RIR fed into Epley or Brzycki, or an RPE table like Liftosaur's) is the most useful, transparent choice for an advanced lifter. Showing the formula in the UI addresses the "opaque" complaint.

### Gaps
- No formula disclosure was found for Alpha Progression, MacroFactor, RP, JuggernautAI, or Boostcamp.

## 4. Exercise library, search, custom exercises, and muscle mapping

### Takeaway
Library sizes range from about 250 videos (RP, which reviewers call small with limited swaps) to 795 (Alpha Progression) and 900–1,000 (MacroFactor). Alpha Progression's custom-exercise model is the most detailed found: target and auxiliary muscles plus bodyweight involvement.

### Cited Findings
- Alpha Progression has 795 built-in exercises with videos. You can filter by muscle, equipment, and type, and sort by most used, most recent, most popular, or A–Z. Custom exercises can be built from scratch or copied, with name, equipment, target and auxiliary muscles, metrics, and bodyweight 0–100%. Custom exercises are excluded from the plan generators, and custom-exercise images are Pro-only. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- MacroFactor Workouts has 900+ exercises and 600+ three-angle demo videos. It supports custom exercises, smart swaps, a "Do Not Recommend" flag, and gym profiles with exact plate and dumbbell inventories. You cannot switch gym profiles mid-workout, and niche exercises often lack videos. — [MacroFactor Workouts](https://macrofactor.com/workouts/); [Feastgood](https://feastgood.com/marofactor-workouts-review/)
- RP Hypertrophy has 250+ technique videos. A reviewer calls the library small with limited swaps; when equipment is missing, you add a substitute manually. — [Mesostrength (competitor)](https://mesostrength.com/blog/rp-hypertrophy-app-review)
- MacroFactor tracks supersets, partials, myoreps, RIR, failure sets, drop sets, and left/right reps. — [MacroFactor Workouts](https://macrofactor.com/workouts/)
- Liftosaur supports labels to treat the same exercise as separate for progression (`main: Squat`), equipment variants (`Bench Press, Dumbbell`), and supersets. — [Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)

### Inferences
- An equipment-inventory model (exact plates and dumbbells) is a strong, non-AI feature: it powers realistic increments and rounding, as Alpha Progression and MacroFactor do.

### Gaps
- No data was found on library size for Liftosaur, Boostcamp, JuggernautAI, Caliber, or Gravitus.

## 5. Pricing in 2026 and paywalls

### Takeaway
Prices run from about $5/month (annual Boostcamp) to $35/month (RP) and $49/month (Dr. Muscle). The core "smart" features (recommendations, periodization, deloads, heatmaps) sit behind paywalls in most apps.

### Cited Findings
- RP Hypertrophy: $34.99/month or $299.99/year, with no free tier or trial according to a competitor's review. — [Mesostrength](https://mesostrength.com/blog/rp-hypertrophy-app-review)
- Alpha Progression Pro: $12.99/month (no trial) or $79.99/year (14-day trial). Recommendations, periodization, and deloads are Pro-only; if Pro lapses, deloads and other Pro settings are dropped. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- MacroFactor Workouts: $11.99/month, $47.99 per 6 months, or $71.99/year, with a 7-day trial and a bundle for existing MacroFactor users. No ads; data is never sold. — [MacroFactor Workouts](https://macrofactor.com/workouts/)
- Boostcamp: the tracker and program library are free. Pro is $14.99/month or $59.99/year, with a 7-day trial on annual. — [Boostcamp vs StrongLifts](https://www.boostcamp.app/vs/stronglifts); [Boostcamp Pro](https://www.boostcamp.app/pro)
- Dr. Muscle: $49/month or $389/year, with a 14-day trial and a free plan (vendor page; prices vary by region). — [Dr. Muscle vs Shred](https://dr-muscle.com/shred-app-vs-dr-muscle/)
- Caliber: free tracker; Caliber Plus about $6–12/month or $36–72/year (from a Boostcamp-published page). — [Boostcamp best/beginners](https://www.boostcamp.app/best/beginners)
- Mesos: Hypertrophy Programmer Pro: $9.99/month or $69.99/year. — [App Store](https://apps.apple.com/app/id6783384522)
- Strong (reference point): PRO $4.99/month, $29.99/year, or $99.99 lifetime. — [Boostcamp best/budget](https://www.boostcamp.app/best/budget)

### Gaps
- 2026 pricing was not verified for JuggernautAI, Fitbod, Liftosaur Premium, or Gravitus.
- The Caliber and Strong figures come from a competitor's page.

## 6. Recent features (2025–2026) and roadmap

### Cited Findings
- MacroFactor Workouts launched in January 2026. Rep progression schemes (Static, Linear, Reverse Linear, Undulating) and new split options came after launch. An upper/lower volume-balance setting is promised. It can import select Jeff Nippard programs (you must own them) and import programs from a strictly formatted spreadsheet. — [MacroFactor 2026 Annual Report](https://macrofactor.com/annual-report-2026/); [MacroFactor Workouts](https://macrofactor.com/workouts/)
- Dr. Muscle X (2026) improved in-workout summaries and rest screens. A redesigned home screen and weekly-to-annual progress reviews are described as still in development. — [Dr. Muscle 2026 update](https://dr-muscle.com/new-dr-muscle-x-2026/)
- Liftosaur now offers a REST API and an MCP server. — [Liftosaur docs](https://www.liftosaur.com/docs)
- New entrants:
  - **hex-forge** (released Dec 18, 2025; v2026.2.0): 4–6 week mesocycles, RIR logged on every set, next-session weight prediction. — [App Store: hex-forge](https://apps.apple.com/il/app/hex-forge/id6756227996)
  - **Mesos** (MEV/MRV landmarks plus RIR-based weekly volume autoregulation). — [App Store: Mesos](https://apps.apple.com/app/id6783384522)
  - **Hypertrophy OS** (mesocycle and fatigue tracking, RIR progression). — [mwm.ai listing](https://mwm.ai/apps/hypertrophy-os/6760429230)
  - **Mesostrength** (publishes reviews of competitors). — [Mesostrength](https://mesostrength.com/blog/rp-hypertrophy-app-review)

### Gaps
- No 2025–2026 changelog was found for RP, Alpha Progression, JuggernautAI, Fitbod, Boostcamp, Caliber, or Gravitus.
- Release dates for Mesos and Hypertrophy OS were not confirmed.

## 7. User sentiment: praise and complaints

### Takeaway
Praise goes to transparent, auto-adjusting structure: RP's weekly set and load adjustment, MacroFactor's fast logging and equipment awareness, and Liftosaur's control. Complaints cluster around four themes:
- **Opacity:** what does RP's joint-pain rating do?
- **Over-aggressive jumps:** MacroFactor +20% loads, unrealistic rep targets.
- **Too much volume:** RP's "so many sets."
- **Rigidity and price:** RP's Monday-only mesocycle start, no trial, small library.

### Cited Findings
- RP praise: science-based mesocycles, and weekly adjustment of sets and load that "works as described." — [Mesostrength](https://mesostrength.com/blog/rp-hypertrophy-app-review)
- RP complaints:
  - Mesocycles must start on Monday.
  - Small library and limited swaps.
  - No calendar of past workouts.
  - No cardio logging.
  - Rigid structure.
  - Premium price with no trial.
  - — [Mesostrength (competitor; unsourced claims)](https://mesostrength.com/blog/rp-hypertrophy-app-review)
- On r/RPHypertrophy, "App Crashing" is a top pain-and-anger theme and "Alternatives to the RP App?" a frequent request. Joint-pain rating confusion is a recurring flair. — [GummySearch r/RPHypertrophy](https://gummysearch.com/r/RPHypertrophy/)
- RP's help center has FAQs on "Why is the app giving me so many sets?" and on what to do when you stop getting sore or pumped. These show that the feedback-driven model confuses users. — [RP Help Center](https://help.rpstrength.com/hc/en-us/sections/30801323964183-Navigating-the-App) (via search summary)
- MacroFactor Workouts praise: fast, intuitive logging; realistic session lengths; equipment customization; loads that auto-adjust when equipment changes. — [Feastgood](https://feastgood.com/marofactor-workouts-review/)
- MacroFactor Workouts complaints:
  - Aggressive load jumps and unrealistic rep targets.
  - No warm-ups in week 1.
  - Confusing loading for band-assisted exercises.
  - No tempo prescriptions.
  - No audio timer cue.
  - Odd superset rest timing.
  - One session length for every day of the week.
  - — [Feastgood](https://feastgood.com/marofactor-workouts-review/)
- Alpha Progression: if Pro lapses, deloads and other Pro settings are dropped from plans, so paywalled features disappear from existing programs. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)

### Inferences
- UX lessons for the tracker:
  - Show why each suggestion was made (e.g. "+1 rep: the 2.5 kg jump would be +6%, above the 5% cap").
  - Cap per-session load changes.
  - Let the user override any suggestion.
  - Do not lock schedules (e.g. Monday-only starts).
  - Make volume ramps optional or capped.
  - Never silently remove features from existing plans.

### Gaps
- I did not retrieve Reddit threads directly from r/weightroom, r/powerlifting, or r/naturalbodybuilding, or recent App Store reviews.
- Sentiment for JuggernautAI, Fitbod, Boostcamp, Dr. Muscle, Caliber, and Gravitus is not well sourced here. Most review content found was vendor or competitor marketing.

## 8. Which apps import Strong data / import-export

### Takeaway
None of the sources found confirm a direct Strong import for these apps. Alpha Progression says outright that it has no import, and MacroFactor Workouts cannot import past workout history (only programs from a strictly formatted spreadsheet). Strong itself exports CSV.

### Cited Findings
- Alpha Progression: "no import feature"; past workouts must be added manually. — [Alpha Progression Guide](https://alphaprogression.com/en/blog/alpha-progression-guide)
- MacroFactor Workouts:
  - Cannot import past workout data from other apps.
  - Can import programs from a supported spreadsheet, but exercise names must match exactly.
  - Supports data export at any time.
  - — [MacroFactor Workouts](https://macrofactor.com/workouts/)
- Strong supports CSV export of workout history. — [Boostcamp vs Strong](https://www.boostcamp.app/vs/strong)
- Liftosaur has a REST API and an MCP server (a possible route for programmatic import). — [Liftosaur docs](https://www.liftosaur.com/docs)

### Inferences
- Missing history import is a common gap and pain point. A tracker that imports Strong/Hevy CSV and keeps an exercise-name mapping table would stand out.

### Gaps
- Strong-import support was not verified for Liftosaur, Boostcamp, Fitbod, JuggernautAI, RP, Dr. Muscle, Caliber, or Gravitus. My searches for Liftosaur import and pricing returned irrelevant results.
- I found nothing on Gravitus at all.
