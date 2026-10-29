# Build a Strong replacement that stays installed

No free route keeps a home-built app on an iPhone permanently. **Every free install expires after 7 days** and has to be re-signed, and **TestFlight isn't free either**: it needs the $99/year Apple Developer Program, and even then each build lasts only 90 days ([Apple](https://developer.apple.com/help/account/basics/about-your-developer-account/), [Apple TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)). The workable free setup is a weekly re-sign, either from Xcode on a Mac (the most reliable) or automatically on the phone with SideStore (no Mac needed after setup, but Apple broke it repeatedly in September and October 2026). On top of that you need an in-app backup, because the 4 years of data will live only on the phone. That trade is worth making. Strong's 112 SAR/year buys a fast logger with a basic Brzycki 1RM, paywalled charts and a library of roughly 200–250 exercises, while the science points to a better, fully transparent tracker that a personal app can implement without any AI:

- **1RM:** estimate it from reps plus reps-in-reserve.
- **Strength trend:** smooth those estimates into a trend line.
- **Volume:** count it per muscle as "fractional hard sets", where an indirect set counts as half.
- **Analytics:** answer four questions (stronger? where is the work going? how hard versus how much? body changes?) at the session, week, block and all-time level. See "What the app should monitor".
- **Progression:** your call. The app doesn't prescribe a training style. It gives you a load calculator built on your own trend, plus optional progression rules you define yourself.

A merged open exercise database (wger plus free-exercise-db) already includes the Bayesian curl, belt squat, pendulum squat, JM press, Meadows row and Larsen press. With a small hand-curated top-up, it gives a library of roughly 1,200–1,500 exercises, about 5–6 times Strong's. The paid apps are spending their 2026 development money on AI coaches, social features and streaks, which leaves room for a clean, analytics-first personal tracker. User sentiment draws on 2026 Reddit threads (read in a second pass, see "What lifters say on Reddit") as well as App Store reviews and review sites. Keep in mind that many review sites, and many Reddit commenters, are developers promoting their own apps.

## Free installs last seven days, so plan around a weekly re-sign

A free Apple ID gives you a "Personal Team" in Xcode, Apple's app-building tool. Apple's own 2026 help page spells out the limits: **apps "expire 7 days from issuance," you can install up to 3 apps per device, and you can register 10 app identifiers per rolling 7 days** ([Apple Developer Help](https://developer.apple.com/help/account/basics/about-your-developer-account/)). An expired app "will simply stop working" until you re-sign it ([mybyways](https://mybyways.com/blog/new-limitations-imposed-on-free-apple-developer-account)). The free tier also has no iCloud sync and no push notifications ([Apple Dev Forums](https://developer.apple.com/forums/thread/718388?page=1)), so your data stays on the phone. Whether Apple Health and home-screen widgets work on a free account could not be confirmed. Each widget or watch extension also uses up one of the 10 weekly identifiers ([AltStore FAQ](https://faq.altstore.io/altstore-classic/app-ids)). You have to switch on Developer Mode on the iPhone, then restart it ([GIGAZINE](https://gigazine.net/gsc_news/en/20260628-sidestore-sideloading-ios/)).

**TestFlight is not a loophole.** It runs through App Store Connect, which only paid Developer Program members can use, and every TestFlight build stops working after 90 days ([Apple](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)). **TrollStore**, the old route to truly permanent installs, only works on iOS 14 through 16.6.1, 16.7 RC and 17.0, and its author says later versions "will NEVER be supported" without a new security bug ([TrollStore](https://github.com/opa334/TrollStore)). That makes it useless on iOS 26. Paid "signing services" that rely on shared enterprise certificates break Apple's terms and can be revoked without warning. They are a poor home for irreplaceable data.

That leaves three realistic free routes. The table compares them.

| Route | What you do weekly | Computer needed | Reliability in late 2026 |
|---|---|---|---|
| **Xcode on your Mac** | Plug in (or same Wi-Fi) and press Run once every ≤7 days | Yes, a Mac, every week | Best. Uses Apple's own tools; no reports of Apple's Oct 2026 changes affecting it |
| **SideStore** | Nothing in theory: it re-signs on the phone over Wi-Fi with a local VPN app (LocalDevVPN) | Only once, for setup (Mac, Windows or Linux) | Fragile. v0.6.4 is marked "DO NOT USE"; v0.7.0-alpha (15 Sep 2026) patched sign-in errors ([SideStore releases](https://github.com/SideStore/SideStore/releases)) |
| **AltStore Classic + AltServer** | Phone and computer on the same Wi-Fi; v2.3 added "Remote AltServer" | Yes, usually | Fair. v2.3.1 (21 Oct 2026) fixed refresh and sign-in errors ([AltStore notes](https://faq.altstore.io/release-notes/altstore)) |

The timing matters. Apple changed its sign-in checks **"several times since 2026-10-12"**, and between them those changes broke AltStore, SideStore, Sideloadly and other tools ([iPASide notes](https://newreleases.io/project/github/pwnapplehat/iPASide/release/v1.2.9)). SideStore needs Wi-Fi, because "mobile networks are not suitable", and the VPN has to be on for every refresh ([SideStore docs](https://docs.sidestore.io/docs/installation/prerequisites)). It also counts itself against the 3-app limit ([SideStore FAQ](https://docs.sidestore.io/docs/faq)). The recommendation is simple. **If you own a Mac, re-run the app from Xcode every weekend; it is the official path and the least likely to break.** Without a Mac, SideStore is the only option that avoids a weekly computer visit, but expect the occasional week when it fails. Open it manually every few days rather than trusting the background refresh.

The data-safety rules follow from how iOS handles expiry. An expired app keeps its data; it just won't open until it is re-signed and reinstalled over the top. **Deleting the app deletes the data**, and switching signing methods or Apple IDs can force exactly that deletion through an "identifier mismatch" error ([Apple Dev Forums](https://developer.apple.com/forums/thread/126589)). Three habits protect you:

- **Sign the same way every time.** Pick one method and one Apple ID and never change them.
- **Don't delete the app to fix a signing error.** Export your data first.
- **Build an "export everything" button.** It should save a backup file to the Files app, and the app should run it automatically every week.

One price comparison is telling. The paid Developer Program costs $99, or about **371 SAR a year, 3.3 times what Strong costs**. Paying only makes sense if you later want iCloud sync or year-long installs. A home-screen web app is the only option with no weekly upkeep at all, and Safari does protect its storage when you use it as a home-screen app ([WebKit](https://webkit.org/?p=14403)). You ruled it out, though, and it would give up native rest-timer and lock-screen features anyway.

## Rival apps split into fast loggers and opaque coaches

The market sorts into two camps. **Logging-first apps** (Strong, Hevy, Setgraph, JEFIT, FitNotes) record what you did and chart it. **Program-driven apps** (RP Hypertrophy, Alpha Progression, MacroFactor Workouts, JuggernautAI, Fitbod, Liftosaur, Boostcamp) tell you what to do next. Your app is neither. It's a fast logger with deep analytics that calculates but never prescribes.

| App | 2026 price | What it does best | Main complaints |
|---|---|---|---|
| **Strong** | $29.99/yr, $99.99 lifetime | Fast, ad-free logging; per-set rest times | Charts, plate and warm-up calculators, and measurements all behind PRO; 3 free templates; Brzycki 1RM; slow development ([SensAI](https://www.sensai.fit/blog/strong-app-review-2026), [Hevy compare](https://www.hevyapp.com/compare/strong/)) |
| **Hevy** | $23.99/yr, $74.99 lifetime | Generous free tier; only official Strong importer; weekly updates | Free tier caps you at 7 custom exercises and 4 routines; social feed; heavy push into AI ([Hevy compare](https://www.hevyapp.com/compare/strong/)) |
| **Setgraph** | $29.99/yr, $199.99 lifetime | Best analytics among loggers: choice of 1RM formula, history filtered by rep range, %1RM tables | Small add-set button, autocomplete bug, "feature creep" (streaks, AI Planner) ([App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)) |
| **JEFIT** | $69.99/yr, no lifetime | Deepest library (~1,400) | Ads on free tier; watch app costs extra ([SensAI](https://www.sensai.fit/blog/jefit-vs-hevy-2026)) |
| **Alpha Progression** | $79.99/yr | Per-set weight/rep/RIR suggestions rounded to weights your gym actually has; 795 exercises | No data import; Pro features vanish from existing plans if you stop paying ([guide](https://alphaprogression.com/en/blog/alpha-progression-guide)) |
| **RP Hypertrophy** | $299.99/yr | Load rises "a few percentage points each week"; when the next dumbbell jump is too big it adds a rep per set instead; sets change with pump/soreness/workload ratings ([RP help](https://help.rpstrength.com/hc/en-us/articles/43864744488599-Hypertrophy-App-Progressions)) | Opaque, "so many sets", Monday-only starts, no trial, slow updates, no long-term exercise stats ([Mesostrength](https://mesostrength.com/blog/rp-hypertrophy-app-review), [r/RPStrength](https://www.reddit.com/r/RPStrength/comments/1vkasxr/rp_hypertrophy_app_roadmaprelease_notes/)) |
| **MacroFactor Workouts** | $71.99/yr | Rule-based (explicitly "not generative AI") RIR-driven adjustments; exact gym equipment profiles | Load jumps of ~20% in a week; can't import history ([MacroFactor](https://macrofactor.com/workouts/), [Feastgood](https://feastgood.com/marofactor-workouts-review/)) |
| **Liftosaur** | — | Fully published, scriptable progression rules | Programming-language feel ([Liftoscript docs](https://www.liftosaur.com/doc/liftoscript)) |
| **JuggernautAI** | — | RPE adjustments within the session, weekly and per block | Formulas undisclosed ([JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you)) |
| **Fitbod** | — | Picks muscles by an estimated "recovery %" | Generated workouts; black box ([Fitbod](https://fitbod.me/blog/fitbod-algorithm)) |
| **Boostcamp** | $59.99/yr Pro | 11,000+ programs; muscle heatmap | A program library, not an algorithm ([Boostcamp](https://www.boostcamp.app/pro)) |

Strong's 2026 roadmap confirms why users call it "stagnant". Its updates added template search, an exercise-search ranking fix, home-screen widgets, lock-screen rest timers, and **a fix for freezes on large histories**, which matters to anyone with four years of data ([SensAI](https://www.sensai.fit/blog/strong-app-review-2026)). Analytics got nothing. Hevy shipped roughly weekly, but its October 2026 headline features were ChatGPT and Claude connectors and an AI "Trainer". The useful pieces for you were three tiers of pinned notes and a custom number keyboard for faster set entry ([Hevy Oct 2026](https://www.hevyapp.com/community-updates/october-26/)). Setgraph added muscle summaries, PR tabs and Apple Watch sessions, along with streaks, celebrations and a redesigned AI Planner ([App Store](https://apps.apple.com/us/app/setgraph-gym-workout-tracker/id1209781676)). In short, **the industry is investing in exactly what you want to exclude.**

The program-driven apps converge on one idea: compare the RIR you logged with the RIR you were targeting, then nudge the load or reps. They differ only in step sizes and in whether the change happens mid-session or next time ([Alpha Progression](https://alphaprogression.com/en/blog/alpha-progression-guide), [Feastgood](https://feastgood.com/marofactor-workouts-review/)). Their complaints are just as consistent:

- **Opacity:** you can't see why the app made a change.
- **Overshooting:** MacroFactor's single-week jumps of +21% on squat and +19.5% on bench.
- **Too much volume:** RP's ramp toward "maximum adaptive volume".

The lesson for your build: these apps bake one training philosophy into the software. Yours shouldn't. **Any progression logic stays optional, visible and defined by you.**

Data import is a gap almost everywhere. Hevy is the only major app with a Strong importer, and it drops routines and supersets. Its documentation also says nothing about RPE, notes or set types, so assume those are lost too ([Hevy import](https://www.hevyapp.com/import/strong/)). Alpha Progression and MacroFactor can't import history at all. Strong can export its data but can't import anything, not even its own exports ([Strong help](https://help.strongapp.io/article/235-export-workout-data)). A recent real-world export (20,407 rows, 2018–2026) shows the current format:

- **Separators:** values are separated by semicolons, not commas.
- **Columns:** `Workout #; Date; Workout Name; Duration (sec); Exercise Name; Set Order; Weight (kg); Reps; RPE; Distance (meters); Seconds; Notes; Workout Notes` ([openGym #394](https://github.com/DuarteSantos8/openGym/issues/394)).
- **Weight:** always stored in kilograms, whatever unit you display.
- **Set types:** marked in `Set Order` as W, D and F, which most likely stand for warm-up, drop and failure. That reading comes from Strong's set tags, not from documentation.
- **Extra rows:** the file also contains "Rest Timer" and "Note" rows that an importer must skip or convert.
- **Older layouts:** older exports use commas and text durations such as "1h 5m" ([fdsimms PR #3869](https://github.com/fdsimms/todo/pull/3869), [Kinoku](https://kinoku.app/compare/kinoku-vs-strong)).

A careful importer that keeps all of this would beat every commercial option. Keep the original Strong file forever as your master copy.

## What lifters say on Reddit

A second pass read 2026 threads on r/strongapp, r/Hevy, r/MacroFactor, r/alphaprogression, r/RPStrength, r/naturalbodybuilding and r/workout. Many commenters were developers plugging their own trackers, so the points below are the ones that came from ordinary users or from the apps' own staff.

**Strong users love the logging and miss the analytics.** A two-year Strong user tried Hevy for a week and went back, because Strong "feels so much smoother", but was frustrated by the lack of analytics. Others in the thread export the CSV every few weeks into Google Sheets or ChatGPT to get charts, or built their own dashboards, and complained that "something simple as graphs are a paid feature." Asked what they wanted, one listed overall volume, monthly reports, muscle-group reports and trends on compound lifts ([r/strongapp](https://www.reddit.com/r/strongapp/comments/1whkzwr/tried_hevy_staying_with_strong_but_frustrated/)). Opinions on whether Strong is abandoned are split. Some say it has been stagnant for years, while one user reports new features arriving in Strong's TestFlight beta ([r/strongapp](https://www.reddit.com/r/strongapp/comments/1w5d0u7/has_this_app_been_abandoned/)). Strong's per-set rest timers, its simpler interface and its lack of social features are what its fans cite over Hevy ([r/strongapp](https://www.reddit.com/r/strongapp/comments/1t6o7yy/what_are_the_features_that_strong_has_over_hevy/)).

**Hevy is the default recommendation, with noise.** Users praise its free tier and polish, but call the social feed "noise". Its staff say the team is small and has to prioritise. Users also point out missing left/right logging for one-sided sets ([r/Hevy](https://www.reddit.com/r/Hevy/comments/1wndg5u/hevy_does_everything_except_this/)) and that it doesn't split the three delt heads in its muscle stats ([r/MacroFactor](https://www.reddit.com/r/MacroFactor/comments/1q2qgjy/macrofactor_workouts_vs_alpha_progression/)).

**Smart apps frustrate lifters whose training doesn't match the app's built-in assumptions.** A long-time Alpha Progression user described doing 100 kg × 14, then × 9, then × 6, all at 1 RIR with short rests. Instead of learning that steep drop-off, the app lowered the first-set target to 11 reps the next session, which for them is 3–4 RIR, making "the targets useless." The same user found MacroFactor expecting 100 kg × 5 at 0 RIR for three sets on 2-minute rests, which they called physically impossible. Another five-year Alpha Progression user called it "absolutely brilliant" but said it prescribes far too much volume for advanced lifters ([r/MacroFactor](https://www.reddit.com/r/MacroFactor/comments/1q2qgjy/macrofactor_workouts_vs_alpha_progression/)). These are anecdotes about one person's training, not design inputs. The takeaway is structural: a fixed prescription model breaks for anyone outside its assumptions, which is why your app keeps prescription optional.

**MacroFactor's custom programs need manual setup.** An experienced lifter liked its "smart progression" and found it "impressively accurate" at predicting closeness to failure. But custom programs don't get automatic rep-range and RIR targets, so they had to set every set of every exercise by hand ([r/MacroFactor](https://www.reddit.com/r/MacroFactor/comments/1qdkr41/first_impressions_of_macrofactors_new_workout_app/)).

**Getting data out is a recurring pain.** Even a happy Alpha Progression Pro user ranted that exporting took six taps plus email and there is no API. The developer has since added copy-to-clipboard and direct download ([r/alphaprogression](https://www.reddit.com/r/alphaprogression/comments/1w2rggb/a_little_rant_about_poor_export_and_data_access/)).

**RP admits its stats gap.** An RP staff member said long-term progress stats per exercise were delayed on purpose, so as not to encourage chasing PRs at the expense of technique. They plan progress stats, per-muscle volume recommendations, primary/secondary muscle modelling and a rest timer, hopefully in early 2027 ([r/RPStrength](https://www.reddit.com/r/RPStrength/comments/1vkasxr/rp_hypertrophy_app_roadmaprelease_notes/)).

**Exercise order is a real, unsolved problem for lifters.** In a busy-gym thread, one lifter noted that bench pressed first is "significantly better" than bench pressed after incline dumbbells. Lifters' workarounds were:

- writing the order down next to each lift
- logging "fresh" and "after fatigue" versions as separate entries
- picking three or four "progression marker" lifts that always go first
- comparing only sessions done in the same order

One commenter warned that splitting the data this way leaves too few points per bucket to see a trend ([r/naturalbodybuilding](https://www.reddit.com/r/naturalbodybuilding/comments/1vuikza/how_to_track_progressive_overload_when_exercise/)). No app found does this automatically. Your app can do it with no extra input: it records each exercise's position and the hard sets already done for the same muscles, so any chart can be filtered to comparable sessions (for example "done first").

**The one non-negotiable.** In the long r/workout review thread, the comment that best sums up advanced lifters was "if an app makes it hard to see last session's numbers mid-workout, i'm out no matter how fancy the analytics are" ([r/workout](https://www.reddit.com/r/workout/comments/1snlsi3/honest_review_of_every_major_workout_tracker_app/)). The same reviewer, a 10-year lifter, preferred trackers with "no AI no social or accounts."

## Reps plus reserve matters more than which 1RM formula you pick

The classic equations predict 1RM almost equally badly. In a 2026 analysis of **303,494 near-failure sets from 14,966 app users**, the session-to-session wobble in estimated 1RM was 0.1028 for Brzycki, 0.1026 for Epley and 0.1021 for Wathen. Those are effectively identical. The author's conclusion was that the equations "share a common structural limitation rather than differing in calibration" ([Marzagao 2026](https://arxiv.org/pdf/2603.17495)). What actually moves accuracy is three things: **rep count, exercise type, and closeness to failure.**

Rep count is the clearest. In Reynolds et al.'s study of 70 adults, a 5RM predicted 1RM best (R² = 0.993 on bench), and the authors advised against using more than 10 reps ([Reynolds 2006](https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf)). Mayhew's study of 103 women found the same: fewer than 10 reps to failure gave better estimates ([PubMed](https://pubmed.ncbi.nlm.nih.gov/18714230/)).

Exercise type is the biggest hidden factor. A meta-regression of 952 tests from 7,289 people found about **8.8 reps at 80% on bench press versus 13.1 on leg press**, while sex, age and training status barely mattered ([Nuzzo 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212)). The same paper shows why one fixed table never fits everyone: between people, reps at 80% vary by about ±2.5. For light isolation work, the 2026 app study found classic formulas badly underestimate. A 13 kg curl for 10 reps comes out at about 17 kg with Brzycki but about 22 kg with a formula that adjusts for how heavy the weight is ([Marzagao 2026](https://arxiv.org/pdf/2603.17495)). That study is a preprint by a Fitbod employee, and it was never checked against measured maxes, so treat it as a strong hint rather than settled science.

RIR plugs in naturally. In the RIR-based RPE scale validated by Zourdos and colleagues, **RPE 10 = 0 RIR, RPE 9 = 1 RIR, and so on**. Bar speed tracked those ratings closely (r = −0.88 in experienced squatters) ([Zourdos 2016](https://openrepository.aut.ac.nz/items/efef3b25-6701-4fb5-bb82-55fcd2a26027/full)). Mike Tuchscherer's widely used RTS chart turns out to be exactly "reps + RIR" read off a single max-effort curve: 3 reps at RPE 8 sits on the same percentage as 5 reps at RPE 10, namely 86.3% ([FitnessVolt](https://fitnessvolt.com/rpe-calculator/)). So the rule is to **add your RIR to your reps and treat the total as a rep max.**

How accurate is self-reported RIR? A meta-analysis of 12 studies found lifters **underestimate their remaining reps by about 1 on average**. The error is consistent from person to person, shrinks closer to failure, and gets much worse above 12 reps ([Halperin 2022](https://sportrxiv.org/index.php/server/preprint/view/67)). Training experience made little difference there, though an older study found novices off by 4–5 reps ([arXiv review](https://arxiv.org/pdf/2603.17495)). Because the bias is steady, your trend line stays honest even if the absolute number reads a little low. Occasionally taking a last set to failure lets the app measure your personal bias for each lift ([Stronger By Science](https://www.strongerbyscience.com/reps-in-reserve)).

Even good per-set estimates are noisy. Within one person and one exercise over two weeks they wobble by about **±8.5–10%**, while a real tested 1RM varies only about 4% day to day ([Marzagao 2026](https://arxiv.org/pdf/2603.17495), [Grgic 2020](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7367986/)). So the headline number should be a **smoothed trend**, not today's best set. One gap remains: no published study compares smoothing methods for 1RM. The recommended filter (in the formulas section below) is sound engineering, not proven science. Your imported Strong history will also chart slightly differently from what Strong showed, because Strong uses Brzycki ([SensAI](https://www.sensai.fit/blog/strong-app-review-2026)), and most old sets probably have no RPE logged. Treat those sets as "RIR unknown": still fine for trends, weighted less.

## Progression stays your call; the science only powers the calculator

No single progression model is "correct". RPE-based and percentage-based loading both work. In Helms et al.'s 8-week study of trained men, the RPE group gained 17.05 kg on squat versus 13.91 kg for the percentage group, and **10.70 versus 9.64 kg on bench**, and the authors judged both effective ([Helms 2018](https://public-pages-files-2025.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/text)). A meta-analysis of 8 studies slightly favored self-adjusting training (effect size 0.64), but on a small evidence base of 166 participants, mostly men ([Zhang 2021](https://www.frontiersin.org/articles/10.3389/fphys.2021.651112/full)). High-volume, lower-load blocks and low-volume, heavier blocks are both legitimate choices. So the app doesn't decide for you. It does three things:

- **Shows** last time's numbers inline while you log.
- **Calculates** on request: "for 6 reps at RIR 2, what weight matches my current trend?" It uses only your own e1RM.
- **Runs your own rules** if you switch them on per exercise (double progression, RIR target, % of e1RM, top set plus back-offs). All are off by default.

The findings below set the maths behind the calculator and the optional rules. They also explain patterns you'll see in your own charts.

**Reps and load trade at about 3% per rep.** Neighbouring cells in the chart differ by about **3% of load per rep (or per RIR point) in the 3–8 rep zone**, and by about 4.5% near singles ([FitnessVolt](https://fitnessvolt.com/?p=300212)). That gives a simple in-session correction: if a set felt two reps easier than planned, the next set can go up about 6%.

**Coarse weight jumps need double progression.** A 2.5 kg jump on a 100 kg bench is +2.5%. A 2 kg jump on a 14 kg dumbbell is +14%, far beyond any per-rep step. In that case the reps have to carry the overload: climb to the top of the rep range, then jump the weight and drop back to the bottom. Alpha Progression's "only weights your gym actually has" approach ([guide](https://alphaprogression.com/en/blog/alpha-progression-guide)) and Liftosaur's published `dp(increase, minReps, maxReps)` rule ([Liftoscript](https://www.liftosaur.com/doc/liftoscript)) both build on this idea.

**Reps fall across sets, by an amount that is personal.** With a fixed load, reps fell nearly 75% from set 1 to set 5 with 1-minute rests, versus about 33% with 5-minute rests ([Senna 2011 via Cissik](https://www.cissik.com/blog/?p=1556)). With 2-minute rests, total reps over 3 sets × 6 exercises were 66.7 versus 80.9 with 5-minute rests ([Senna 2009](https://jssm.org/jssm-08-197.xml-Fulltext)). Those studies trained to failure. Stopping 1–3 reps short likely loses less, but nobody has measured how much, and drop-off varies between people. So the app measures **your** drop-off per exercise from your own logs and shows it as a chart; it never assumes a population value. The app should also time your rests automatically, so that a missed rep after a short rest is labelled "short rest" rather than "regression". Longer rests (3 minutes versus 1) produced more strength and size in trained men ([NASE summary of Schoenfeld 2016](https://www.naseinc.com/blog/how-long-should-you-rest-between-sets-for-size-and-strength/)).

**Exercise order matters, by an unknown amount.** An exercise done later in a session gets fewer reps at the same load ([Simão 2012](https://read.qxmd.com/read/22292516/exercise-order-in-resistance-training)), and over time it gains slightly less strength, though hypertrophy is unaffected ([Nunes 2021](https://lida.sport-iat.de/ta/Record/4059795?lng=en)). No source gives a reliable size for this effect. So the app doesn't apply a correction factor by default. It records position and prior same-muscle sets, and lets you compare like with like.

**Judge long-term progress on a smoothed trend, not a fitness-fatigue model.** The classic Banister fitness-fatigue model sounds elegant, but recent work finds it ill-conditioned, with parameters that can't be reliably pinned down ([Sci Rep 2025](https://hal.inrae.fr/hal-04999009v1), [arXiv 2025](https://arxiv.org/pdf/2505.20859)). A rolling trend of estimated 1RM per lift is simpler, explainable and good enough. Plateau and deload triggers (below) are sensible rules of thumb, but **no peer-reviewed threshold exists**. The app should log how far its predictions miss, so you can tune the numbers on your own data.

## Count fractional hard sets for size, and track load for strength

The best evidence now favors counting a set as **1.0 for the muscle doing the main work and 0.5 for a muscle that clearly helps**. In Pelland et al.'s 2025 analysis of 67 studies and 2,058 participants, this "fractional" count explained muscle growth better than counting every set fully (Bayes factor 9.48) or counting only direct sets ([sponet record](https://sponet.de/sponet/Record/4097139), [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)). The same team's model fits suggest an indirect set may be worth even less, about **32% of a direct set for hypertrophy**. That fits Mannarino's finding that curls grew the elbow flexors +11.06% versus +5.16% for rows at equal volume ([Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)). Boostcamp already counts this way: a bench set adds 1 chest set and 0.5 triceps sets ([Boostcamp](https://www.boostcamp.app/features/muscle-tracker)). Keep 0.5 as the default and offer 0.3 as a setting.

Returns diminish, and they do so differently for size and strength:

- **Size:** beyond about **31 fractional sets per muscle per week**, extra sets showed no detectable added benefit. The best-fitting curve was a square-root shape ([Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)). Per session, the ceiling was about **11 fractional sets per muscle**, but that figure comes from a preprint.
- **Strength:** the plateau arrives far earlier, at about **3 fractional sets per week, or about 2 direct sets per session, of the tested lift**. Training an extra day each week added about 3.27% strength but almost nothing for size ([Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)).

Older work points the same way. Each extra weekly set added about 0.37% growth ([Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/)), and 12–20 weekly sets looked best for trained young men, though the certainty is low ([Baz-Valle 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/)). Those studies counted sets differently, so their numbers don't line up exactly with fractional counts.

Proximity to failure is the other half of the "hard set" question. Growth improved as sets ended closer to failure, while strength depended more on load ([Robinson 2024](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)). Going all the way to true failure added only a trivial extra (effect size 0.19) ([Refalo 2023](https://dro.deakin.edu.au/articles/journal_contribution/Influence_of_Resistance_Training_Proximity-to-Failure_on_Skeletal_Muscle_Hypertrophy_A_Systematic_Review_with_Meta-analysis/22030796)). So **count working sets at RIR 4 or less as hard sets** (a practitioner convention; no study fixes the exact cutoff) and leave out warm-ups. Skip the "effective reps" metric: critics note it "doesn't align with the actual research findings" ([Henselmans](https://mennohenselmans.com/how-close-to-failure-should-you-train/)).

Four other common metrics deserve demotion:

- **Tonnage** (sets × reps × weight) did not moderate hypertrophy outcomes ([Refalo 2023](https://dro.deakin.edu.au/articles/journal_contribution/Influence_of_Resistance_Training_Proximity-to-Failure_on_Skeletal_Muscle_Hypertrophy_A_Systematic_Review_with_Meta-analysis/22030796)). Show it only as a secondary "work done" line.
- **Prilepin's chart** comes from observing Soviet Olympic lifters, not from controlled research ([Chivers](https://drmichaelchivers.substack.com/p/lessons-from-coach-prilepin-training)).
- **INOL** has no validation either.
- **RP's MEV/MAV/MRV landmarks** (chest MEV 4–6, MRV 16–24) are practitioner rules of thumb ([RP](https://rpstrength.com/chest-training-tips-hypertrophy/)). They work best as personal targets you set yourself, not as literature values.

For strength, the meaningful dials are your estimated-1RM trend, weekly sets of the specific lift, and the share of sets above roughly 80% of your estimated max.

## What the app should monitor

Training has two outcomes you care about, strength and size. Strength shows up directly in your logs. Size doesn't, so the app tracks two things: the **training inputs** the literature links to growth (hard sets per muscle, closeness to failure, load range, frequency) and the **outputs** you can measure (performance and body measurements). Everything below is computed from data you already log. Nothing needs a model of "how people train".

### 1. Am I getting stronger? (per exercise)

| Metric | Why | Seen in |
|---|---|---|
| Smoothed e1RM trend with rate of change (%/week, %/block) | The noise-resistant headline number (see the 1RM section) | Setgraph (unsmoothed) |
| Rep-max table: best weight at each rep count 1–20, and best reps at each weight | Captures progress whether you train heavy or light, with no formula involved | Strong, Setgraph |
| Reps at a fixed load over time | Shows progress on dumbbell and machine lifts where weight jumps are coarse | — |
| Like-for-like filters: position in session, rep range, rest time, RIR logged / not logged | Exercise order and rest change performance, so compare comparable sessions | Setgraph (rep range only) |
| "vs last comparable session" deltas on every exercise | The day-to-day answer | Strong (numbers only) |

### 2. Where is my training going? (distribution)

| Metric | Why | Seen in |
|---|---|---|
| Weekly fractional hard sets per muscle, **direct and indirect shown separately** and summed, with the evidence zones | The best-supported volume measure (Pelland 2025) | Boostcamp (partial) |
| About 20 muscles, with front, side and rear delts split | Neither open database nor Hevy splits the delts | — (gap) |
| Front/back body map shaded by weekly sets (sets, not a "recovery %") | One glance at what's covered | Hevy, Boostcamp |
| Training frequency per muscle (days per week with ≥1 hard set) | Extra days helped strength (~3.27% per added day) more than size ([Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)) | — |
| Per-session sets per muscle, flagged above 11 | Preprint soft ceiling per session | — |
| Neglected muscles: under 4 sets per week over the last 2–4 weeks, and days since last trained | Catches drift, e.g. rear delts or calves quietly dropping out | — |
| Balance ratios: horizontal push : pull, vertical push : pull, knee-dominant : hip-dominant, upper : lower | Shows where focus sits. No validated ideal ratio exists, so these are descriptive only | — |
| Which exercises produce each muscle's volume | Shows, say, that 80% of your chest sets come from one lift | — |

### 3. How hard versus how much? (intensity × volume)

This directly answers the high-volume / low-intensity versus low-volume / high-intensity question for your own blocks.

| Metric | Why |
|---|---|
| **Relative intensity of every set** = weight ÷ current e1RM trend | Puts every set on one scale across lifts and rep ranges |
| Rep-range mix per muscle per week (1–5, 6–10, 11–15, 16–30) | Growth is similar across a wide load range when sets are close to failure, while strength depends more on load ([Robinson 2024](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/), [Grgic 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7706639/)) |
| RIR distribution of working sets (histogram per muscle or lift) | Closeness to failure is the other half of a "hard set" (Robinson 2024, Refalo 2023) |
| **Intensity–volume map**: each week (or block) plotted as weekly hard sets against average relative intensity, coloured by e1RM change that followed | Shows which mix you actually ran and what came of it |
| Share of sets ≥80% e1RM for each main lift | The strength-specific dial |
| Tonnage | Secondary "work done" line only |

### 4. Is something holding me back? (fatigue and consistency)

| Metric | Why |
|---|---|
| Your rep drop-off across sets at the same load, per exercise | Your own fatigue pattern, measured rather than assumed |
| Actual rest times against planned rest | Rest changes reps per set (Senna 2009, 2011) |
| Sessions per week, session duration, template adherence | Consistency |
| Stall flag: e1RM trend flat for N weeks (you set N) | Descriptive label, not an instruction |
| RIR calibration: your estimated RIR against what a failure set showed | Self-reports run about 1 rep low (Halperin 2022) |

### 5. Body

| Metric | Why |
|---|---|
| Bodyweight with a smoothed trend and rate (%/week) | Daily scale weight is noisy; the trend is what matters |
| Circumference measurements (arm, chest, waist, thigh, calf), with left/right where relevant | The only size output a tracker can record |
| Strength relative to bodyweight; e1RM and bodyweight overlaid | Separates strength gained from weight gained |

### Time scales

The same metrics roll up four ways:

- **Session:** a summary card after each workout, comparing every exercise against your last comparable session.
- **Week:** sets per muscle, intensity mix, PRs and e1RM changes.
- **Block:** mark the start and end of a training block and give it a name and goal. Then compare blocks side by side: volume, intensity mix, RIR, e1RM change per lift, bodyweight and measurement change. This is your own n-of-1 test of approaches, such as a high-volume block against a heavy one.
- **All-time:** four years of e1RM curves, yearly summaries and lifetime PRs, starting from the Strong import.

**One tag worth adding: long-muscle-length emphasis.** Overhead triceps extensions grew the whole triceps about 1.4 times more than pushdowns in a 12-week study ([Maeo 2022 via SBS](https://www.strongerbyscience.com/?p=57800)). Partial reps at long muscle lengths showed a possible but imprecise growth edge over full range of motion ([Wolf 2023](https://doaj.org/article/99e86b317bec40f5abc2f0008358737e)). Tagging exercises as "lengthened-biased" (Bayesian curl, overhead extension, seated leg curl, deficit work) would let the app show what share of each muscle's sets train it at long lengths. The evidence is still emerging, so this belongs in "worth considering".

## Two open databases give you about 1,200–1,500 exercises

Strong's library has roughly 200–250 exercises ([Hevy compare](https://www.hevyapp.com/compare/strong/), [Garage Gym Reviews](https://www.garagegymreviews.com/equipment/strong)) and Hevy's about 400–450. Two free, offline-ready datasets beat both. **wger** has 939 exercises under Creative Commons licences and the best modern coverage found. Checked on 29 October 2026, it already includes the **Bayesian Curl, Belt Squat, Pendulum Squat, JM Press, Kelso shrugs, Meadows Row, Larsen Press, Pec Deck, Cross-Body Cable Y-Raise and Nordic Curl**, plus aliases such as "RDL" and "OHP Barbell" ([wger API](https://wger.de/api/v2/exerciseinfo/?limit=1000)). **free-exercise-db** has 876 public-domain exercises with primary and secondary muscles, equipment, and compound/isolation tags, but older naming and almost no modern variations ([free-exercise-db](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)).

Merged and de-duplicated, the two would plausibly give 1,200–1,500 entries, though that count is an estimate, not a measurement. Neither dataset has a Jefferson curl, safety-bar squat, Spoto press or seal row. A hand-written top-up file of 50–150 modern movements is therefore needed either way. Avoid the ExerciseDB-family datasets (1,300–11,000 exercises with GIFs). Their licences are either AGPL, a strong open-source licence aimed at code, or "All rights reserved", or their images are copyrighted separately ([exercisedb.dev](https://exercisedb.dev/), [hasaneyldrm LICENSE](https://github.com/hasaneyldrm/exercises-dataset/blob/main/LICENSE)). You don't want the videos anyway. For a personal app, wger's attribution and share-alike conditions are trivially met. Add a credits screen in case you ever share it.

Muscle tagging needs one fix. Neither dataset splits the shoulders properly: free-exercise-db has a single "shoulders" group, and wger lists only the front delt ([wger muscles](https://wger.de/api/v2/muscle/?limit=50)). Re-tag everything to about 20 muscles with **front, side and rear delts separated**. That gives you a finer list than Hevy's official 20-value list, so data from Hevy or Strong maps into it cleanly ([Hevy API](https://api.hevyapp.com/docs/)). Store primary and secondary muscles per exercise so fractional counting works. Name exercises the way Strong does, "Movement (Equipment)", for example "Bench Press (Barbell)" ([openGym tests](https://github.com/DuarteSantos8/openGym/blob/main/frontend/src/lib/import-csv.strong.test.js)). No public list of Strong's built-in names exists. **The definitive mapping list is the set of distinct exercise names in your own export.** Match each one once and save your choices so re-imports always land the same way.

Search is where Strong itself struggled: it shipped an "improved exercise search ranking" fix in April 2026 ([SensAI](https://www.sensai.fit/blog/strong-app-review-2026)). Great search for a lifter needs five pieces:

- **A gym-slang dictionary.** DB = dumbbell, RDL = Romanian deadlift, SSB = safety squat bar, BSS = Bulgarian split squat, and so on.
- **Fuzzy matching**, so typos still find the right lift.
- **Prefix matching**, so "bay" finds Bayesian curl.
- **Your own habits in the ranking.** Exercises you use often or used recently rise to the top.
- **One-tap filters** for muscle, equipment, movement pattern, compound/isolation, and "my custom" exercises.

The phone's built-in database search (SQLite FTS5, with a "trigram" mode for typos) handles this easily for a couple of thousand rows ([SQLite](https://www.sqlite.org/fts5.html)). Hevy's free tier caps custom exercises at 7 ([Hevy compare](https://www.hevyapp.com/compare/strong/)). Yours should be unlimited, and you should be able to clone any library exercise as a starting point.

## Feature menu: pick what to build

The three tiers below draw on what the apps above offer. AI coaching, exercise videos, social feeds and engagement extras are excluded by design.

### Recommended core

| Feature | Why it earns a place | Seen in |
|---|---|---|
| 2–3-tap set logging with last session's numbers shown inline and swipe-to-copy | The thing Strong is loved for; Setgraph's copy gesture speeds it up | Strong, Setgraph |
| Large custom number pad | Faster weight/rep entry | Hevy (Oct 2026) |
| Auto rest timer, adjustable per exercise and per set, with lock-screen alert | Rest affects performance; Strong's per-set rest is praised | Strong, Setgraph |
| Set types (warm-up, drop, failure) and supersets | Needed to exclude warm-ups from volume and 1RM | Strong, Hevy |
| RPE or RIR entry, your choice of scale | Drives every algorithm; no app clearly offers RIR as its own field | — (gap) |
| Free plate calculator and warm-up calculator | Strong charges for both | Strong PRO, StrongLifts |
| Equipment profile: your plates, dumbbell list, machine stack steps | Makes calculator results land on weights you actually have | Alpha Progression, MacroFactor |
| Notes pinned to an exercise, to a routine slot, and per workout | Cue reminders carry forward | Hevy |
| Unlimited templates in folders | Strong caps free users at 3 | Setgraph |
| Complete Strong CSV import (keeps RPE, notes, set types, timed sets) | Beats Hevy's lossy import | — (gap) |
| One-tap export and weekly automatic backup to Files | Your only protection on a free account | — |
| Estimated-1RM trend per lift, with the formula shown, a smoothed line and rep-range filters | The analytics Strong lacks | Setgraph |
| Personal records: e1RM, heaviest weight, and best reps at each weight | Familiar and motivating without clutter | Strong, Setgraph |
| Weekly fractional hard sets per muscle, direct and indirect split, delts split, with evidence zones and body map | Best-supported volume metric | Boostcamp, Hevy (partial) |
| Rep-max table and reps-at-fixed-load charts | Progress in any rep range, no formula needed | Strong, Setgraph |
| Intensity × volume view: relative intensity per set, rep-range mix, RIR histogram, weekly intensity–volume map | Your high-volume vs high-intensity question, answered from your own data | — (gap) |
| Muscle coverage: frequency, neglected muscles, balance ratios, exercise share per muscle | Shows where your training focus actually sits | — (gap) |
| Session summary, weekly report, block comparison, all-time view | Day, week, block and overall progress | — (gap; RP plans stats for 2027) |
| Load calculator: weight for any reps × RIR you plan, from your own trend | Uses the maths, prescribes nothing | Strong PRO (%1RM table only) |
| Bodyweight trend and measurements | You asked for it; Strong charges for it | Strong PRO |
| 1,200+ exercise library, unlimited custom exercises, clone-and-edit, aliases, fuzzy search, filters | Your stated priority | Alpha Progression, Hevy Pro (partial) |
| Fast template builder: folders, drag to reorder, supersets, per-exercise default sets/reps/rest, start a workout from a past session | Your "easy to make workouts" priority | Strong, Hevy |
| Calendar and full history | Basic, but RP lacks it | Strong, Setgraph |
| Automatic exercise-position tracking, with charts filterable to "done first" sessions | Like-for-like comparisons when order changes | — (gap) |

### Worth considering

| Feature | Trade-off |
|---|---|
| Your own progression rules per exercise (double progression, RIR target, % of e1RM, top set + back-offs), off by default | Liftosaur-style control without coding; you choose the method |
| Stall flag with a threshold you set | Descriptive only; no validated threshold exists |
| Per-lift personal 1RM curve (learned from your data) | Better accuracy on accessories; needs months of RIR-logged sets |
| RIR calibration from occasional failure sets | Corrects your ~1-rep underestimate; needs deliberate failure sets |
| "Lengthened-biased" exercise tag and share-of-sets chart | Emerging evidence (Maeo 2022, Wolf 2023); needs hand-tagging |
| Left/right logging for one-sided sets | Missing in Hevy; useful for imbalances, adds a tap |
| Home-screen widget, lock-screen timer, Apple Watch app | Each extension uses another of your 10 weekly app identifiers; free-tier support for widgets and Apple Health unverified |
| Apple Health workout sync | May not work on a free account |

### Skip

| Feature | Reason |
|---|---|
| AI coach, AI planner, chatbot connectors | Excluded by you; it is where Hevy and Setgraph are spending their effort |
| Exercise videos and animations | Excluded; also the source of licensing trouble |
| Social feed, share cards, PR celebrations, streaks | Excluded clutter |
| Pump/soreness/joint-pain questionnaires | RP users can't tell what the answers do |
| "Recovery %" muscle heatmaps and composite "strength scores" | Black-box numbers with no research behind them |
| Fitness-fatigue (Banister) readiness model | Unreliable parameters |
| "Effective reps", INOL or Prilepin as targets | Weak or no validation |
| Program marketplace, accounts, cloud sync | Not needed for one person; iCloud unavailable on the free tier anyway |
| Locked schedules (e.g., Monday-only blocks) | A top RP complaint |
| Automatic next-set or next-session prescriptions switched on by default | Bakes in one training philosophy; yours stays opt-in |

## The recommended algorithms, in one place

These formulas combine the sources above. The exercise-category constants and every threshold are reasoned defaults built from the cited data, not published values. Weights are in kg.

**1. Effective reps.** RIR = 10 − RPE when RPE is logged. A set marked failure or AMRAP has RIR 0. Then:

```
effective reps (E) = reps + RIR
```

A set counts toward the 1RM trend only if it is not a warm-up, E ≤ 12 (best ≤ 10), and RIR ≤ 4. Sets with no RIR are treated as RIR 2 and given less weight.

**2. Estimated 1RM.**

```
e1RM = weight × (1 + (E − 1) / k)
```

The formula returns exactly the weight for a true single. Starting k by exercise type:

| Exercise type | k |
|---|---|
| Barbell lower-body compounds | 38 |
| Barbell presses and pulls | 29 |
| Machine and cable compounds | 24 |
| Dumbbell compounds | 20 |
| Isolation lifts | 15 |

For comparison, the RTS chart behaves like k ≈ 25, Brzycki like k ≈ 36, and classic Epley is `weight × (1 + reps/30)`. If you want a single fixed formula instead, use Epley on effective reps, capped at 10. That is as good as any classic equation, but it underestimates light isolation lifts. An optional alternative for light lifts uses the weight-adjusted preprint formula:

```
1RM = weight × (1 + (E − 1)^0.85 / max(0.5, −2.55 + 4.58 × ln(weight_kg)))
```

*Example:* bench 100 kg × 5 at RPE 8 → E = 7 → 100 × (1 + 6/29) = **120.7 kg**.

**3. Personalising k (optional).** Once a lift has 10 or more qualifying sets at two or more different rep counts, find the k that makes your sets from the same two weeks agree best. Then blend it with the starting value:

```
k = (n × k_yours + 15 × k_start) / (n + 15)
```

Keep k between 8 and 50.

**4. Session value and trend.** The session value is your best qualifying e1RM of the day. Smooth it over time:

```
trend_new = trend_old + α × (session − trend_old),   α = 1 − e^(−days_since_last / τ),   τ ≈ 14–21 days
```

Ignore any session more than 15% off the trend until you confirm it (likely a typo or a unit mix-up). If you take a 3–4 week break, let the trend re-anchor faster. Mark sets with E above 10 as "low confidence".

**Items 5–9 are optional.** Item 5 is the load calculator. Items 6–9 run only for exercises where you switch on a rule, and you can replace any of them with your own.

**5. Load calculator (fine weight jumps).**

```
target weight = trend ÷ (1 + (target reps + target RIR − 1) / k)
```

Round down to a weight you actually have. If the smallest available jump is more than 4% of the weight, use double progression instead.

*Example:* trend 122 kg, target 5 reps at RIR 2, k = 29 → 122 ÷ 1.207 = 101.1 → **100 kg × 5**.

**6. Double progression (coarse weight jumps).** Each session, pick the first case that applies:

- **Reps maxed:** every working set reached the top of the rep range at roughly the target RIR → move to the next available weight and drop to the bottom of the range.
- **Too easy:** RIR was more than 1 above target → add 2 reps.
- **Too hard:** RIR was more than 1 below target, or you fell short of the range → repeat the session. Only drop the weight after two such sessions in a row.
- **Otherwise:** add 1 rep to the first set.

**7. Next set within the session.**

```
next weight = weight × (1 + step × (RIR logged − RIR expected))
```

- **Step:** 0.03 for sets of 8 reps or fewer, 0.02 for higher-rep sets.
- **Cap:** never more than 7.5% in one session.
- **Rounding:** if rounding wipes out the change, adjust reps instead.
- **Expected RIR:** falls about 0.7 reps per set with 3+ minute rests on compounds, about 1.0 with 2–3 minutes, and about 1.5 with under 2 minutes. Replace these with your own averages after about five sessions.

*Example:* 100 kg × 5 logged at RIR 4 when 2 was expected → +6% → **105 kg**.

**8. Exercise order.** Apply only when today's order differs from last time:

```
order factor = 1 − 0.007 × (overlapping hard sets done before this exercise today − the same count last time)
```

**9. Plateau and deload flags.**

- **Plateau:** the trend gained 0.25% per week or less over 6+ sessions, with no PR in the last 4 → suggest changing the rep range or swapping the variation.
- **Fatigue:** on two or more lifts, the first set came in 4% or more below the trend in 2 sessions in a row, or 3 or more sets per session were 1.5+ RIR harder than predicted → suggest a deload week (40–50% fewer sets, and either 10% less weight or 2–3 more RIR).

**10. Volume.** A hard set is any working set at RIR 4 or less, or with RIR not logged.

```
weekly sets for a muscle = Σ (hard set × 1.0 if primary, 0.5 if secondary, 0 otherwise)
```

Offer 0.3 as an optional setting for the secondary weight. Weekly zones per muscle:

| Weekly fractional sets | Zone |
|---|---|
| Under 4 | Below minimum |
| 4–10 | Maintenance |
| 10–20 | Evidence-based target |
| 20–30 | Diminishing returns |
| Over 30 | Beyond detectable benefit |

Flag any session with more than 11 fractional sets for one muscle as "soft limit, preprint evidence". For strength, track weekly sets of the specific lift and the share of sets at 80% or more of e1RM. Show tonnage only as a secondary line.

**11. Explanations.** Every calculated number shows its reasoning in one line. For example: "Last: 100 × 5 @ RIR 2 → e1RM 120.7; trend +0.4%/wk; target 5 @ RIR 2 → 101.1 → rounded to 100."

**12. Analytics formulas.**

```
relative intensity (%)   = set weight ÷ e1RM trend on that date × 100
rep-range bucket         = 1–5 | 6–10 | 11–15 | 16–30 (reps logged)
weekly intensity point   = (Σ fractional hard sets, mean relative intensity of those sets)
frequency (muscle)       = days in the week with ≥ 1 fractional hard set for that muscle
drop-off (exercise)      = 1 − reps on last working set ÷ reps on first, same load, per session
balance ratio            = weekly hard sets of pattern A ÷ pattern B (e.g. horizontal push ÷ horizontal pull)
bodyweight trend         = same smoothing as item 4, τ ≈ 7–10 days
block change (lift)      = e1RM trend at block end ÷ trend at block start − 1
```

## Conclusion

The research reframes the build. The hard part isn't the clever math: the best-supported 1RM and volume methods fit on an index card, and the commercial apps' secret formulas turn out to be a version of "compare logged RIR to target RIR and nudge". The real risks are elsewhere. One is **keeping the app alive and the data safe on a free account**, where Apple's autumn-2026 sign-in changes showed how fragile third-party re-signing is. The other is **making the importer and the exercise library excellent**, where every commercial rival is weakest. A Mac plus a weekly Xcode run, a weekly automatic backup file, and a careful Strong importer matter more than any formula.

The science also limits what the app can promise. Per-set 1RM estimates wobble by about 10%, and RIR self-reports run about a rep low. Order, rest and deload thresholds have no validated numbers. The design therefore measures rather than prescribes. It shows what you did against the evidence-based markers (sets per muscle, closeness to failure, load range, e1RM trend), and leaves the training decisions to you. A personal app can do that because it answers to one lifter, not millions. In that sense, the four years of Strong history are the most valuable part of the project. If the importer keeps your RPE values and set types, the app can fit your personal curves from day one instead of starting from population averages.
