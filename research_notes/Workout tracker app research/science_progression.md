# Evidence-Based Next-Set Load/Rep Suggestion Engine (Progressive Overload & Autoregulation)

> Scope: transparent, non-AI, rule-based progression engine for an advanced lifter's personal tracking app. Inputs: previous sets, RPE/RIR, set position, exercise position, fatigue across sets, long-term trend.
> Evidence labels used throughout: **[STRONG]** = peer-reviewed RCT/meta-analysis with consistent findings; **[MODERATE]** = small peer-reviewed studies / single RCTs; **[WEAK/HEURISTIC]** = practitioner charts, app vendor claims, or my own inference; **[UNVERIFIED]** = background knowledge not confirmed by a source fetched in this session.
> Research note: PMC full texts were blocked by a reCAPTCHA during this session; several findings come from abstracts or secondary summaries and are flagged as such.

## Q1. Autoregulation methods and evidence (RPE/RIR loading, APRE, double progression, RPE stops, velocity loss)

### Takeaway
Autoregulated loading (RPE/RIR, APRE, VBT) is at least as effective as fixed %1RM loading in trained lifters and probably slightly better (pooled SMD 0.64 favoring autoregulation in one meta-analysis, though with few, small studies). RIR self-ratings are biased by roughly −1 rep (people underpredict reps left), most accurate close to failure and in sets ≤12 reps — so an engine can safely use RIR as its main control signal, but should calibrate per user.

### Cited Findings
**RPE vs %1RM (Helms et al. 2018)** [MODERATE]
- Design: resistance-trained males aged 19–35, squat then bench 3×/week in a daily undulating format for 8 weeks; %1RM group (n=11) vs RPE group with "participant-selected loads to reach target RPE ranges" (n=10). — [Helms et al. 2018, Frontiers in Physiology (abstract)](https://public-pages-files-2025.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/text); [PubMed 29628895](https://pubmed.ncbi.nlm.nih.gov/29628895/)
- 1RM gains: bench +9.64 ± 5.36 kg (%1RM) vs +10.70 ± 3.30 kg (RPE); squat +13.91 ± 5.89 kg vs +17.05 ± 5.44 kg; total +23.55 ± 10.38 vs +27.75 ± 7.94 kg. Squat: 79% chance of a small RPE advantage (ES 0.50 ± 0.63); bench: 57% (ES 0.28 ± 0.73). Conclusion: "Both loading-types are effective"; RPE loading "may provide a small 1RM strength advantage in a majority of individuals." — [Helms et al. 2018](https://public-pages-files-2025.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/text)
- Rationale given: %1RM loading misfires when the pre-test 1RM is atypical, and reps achievable at a given % vary considerably between individuals. — [Helms et al. 2018 (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5877330/)
- Group differences were not statistically significant; muscle thickness gains also did not differ. — [Stronger By Science summary](https://www.strongerbyscience.com/reps-in-reserve)

**RIR autoregulation vs fixed loading (Graham & Cleather 2019)** [MODERATE]
- 31 resistance-trained men, twice-weekly squat program, autoregulated (loads prescribed by RIR) vs fixed loading (% of pre-test 1RM), volume matched, 12 weeks; title states RIR autoregulation "leads to greater improvements in strength … than fixed loading." Exact effect sizes not retrieved. — [Graham & Cleather, JSCR (St Mary's repository)](https://research.stmarys.ac.uk/id/eprint/3067)

**Meta-analysis of autoregulation (Zhang et al. 2021)** [MODERATE — small evidence base]
- 8 studies (17 reports), 166 participants (151 male), 5–10 weeks. Overall 1RM SMD 0.64 (95% CI 0.43–0.85; I² = 0%) favoring autoregulation. Squat MD 4.65 kg; bench MD 3.21 kg. — [Zhang et al. 2021, Frontiers in Physiology](https://www.frontiersin.org/articles/10.3389/fphys.2021.651112/full)
- By method: APRE 0.78 (CI 0.54–1.02), RPE 0.17 (CI −0.33 to 0.67, n.s.), VBT 0.43 (CI −0.24 to 1.10, n.s.); between-method P = 0.08. Limitations: few studies, no blinding, mostly estimated 1RMs, only experienced athletes, internal inconsistency in the duration subgroup reporting. — [Zhang et al. 2021](https://www.frontiersin.org/articles/10.3389/fphys.2021.651112/full)

**APRE (Mann et al. 2010)** [MODERATE]
- 23 Division I football players, 6 weeks preseason: APRE (n=12) vs linear periodization (n=11). APRE produced larger gains in bench 1RM, estimated squat 1RM and reps at 225 lb. — [Mann et al. 2010 JSCR, Univ. Missouri repository](https://lso-live-01.umsystem.edu/xmlui/handle/10355/15836); [IDEA Fit summary](https://www.ideafit.com/self-paced-resistance-exercise-yields-results)
- Unit inconsistency: abstract reports change in Newtons (APRE 93.4 ± 103 N vs LP −0.40 ± 49.6 N for bench) while a secondary summary reports ~93 lb — treat magnitudes cautiously. — [IDEA Fit](https://www.ideafit.com/self-paced-resistance-exercise-yields-results)

**RIR/RPE scale validity & accuracy** [STRONG for direction, MODERATE for magnitudes]
- The RIR-based RPE scale (RPE 10 = 0 RIR, 9 = 1 RIR, …) was validated by Zourdos et al. 2016 (JSCR 30(1):267–275): strong inverse relationship between average bar velocity and RPE (r = −0.88 experienced squatters; r = −0.77 novices). Authors: practical for regulating daily training load. — [Zourdos et al. 2016 (AUT repository)](https://openrepository.aut.ac.nz/items/efef3b25-6701-4fb5-bb82-55fcd2a26027/full)
- Halperin et al. meta-analysis (12 studies, 414 participants): people **underpredict** reps to failure by ~0.95 reps on average (SD 1.45); accuracy better closer to failure and in sets ≤12 reps; experience, upper vs lower body, and set number did not significantly affect accuracy. — [Stronger By Science](https://www.strongerbyscience.com/reps-in-reserve)
- Remmert et al.: error ~1.2 reps when predicting at 5 RIR vs ~0.46 at 1 RIR; set 1 error 0.955 vs set 3 0.706. Refalo et al.: mean absolute error 0.65 ± 0.78 reps (bench, 75% 1RM), no differences by sex/experience. — [Stronger By Science](https://www.strongerbyscience.com/reps-in-reserve)
- Practical recommendation: periodically take the last set of an exercise to failure while predicting RIR, to calibrate per lift. — [Stronger By Science](https://www.strongerbyscience.com/reps-in-reserve)

**RTS / Tuchscherer RPE chart (load increments per RPE/rep)** [WEAK/HEURISTIC — practitioner chart, not peer-reviewed; values from calculator sites]
- RPE 10 column, reps 1–8: 100%, 95.5%, 92.2%, 89.2%, 86.3%, 83.7%, 81.1%, 78.6% of 1RM. Cells are aligned so that RPE 8 × 3 reps = 86.3% and RPE 7 × 5 reps = 78.6% (i.e., same "reps + RIR" → same %). — [FitnessVolt chart](https://fitnessvolt.com/?p=300212); [sensai.fit RPE tool](https://www.sensai.fit/tools/rpe); [FitnessVolt guide](https://fitnessvolt.com/rpe-training/guides/tuchscherer-chart-explained)
- Sources disagree slightly (e.g., 87.5% vs 86.3% for 3 @ RPE 8). — [FitnessVolt guide](https://fitnessvolt.com/rpe-training/guides/tuchscherer-chart-explained)

**Velocity loss thresholds (analog for "RPE stops"/fatigue stops)** [MODERATE]
- Pareja-Blanco et al. 2017 (Scand J Med Sci Sports): 20% velocity loss (VL20) vs 40% (VL40) in squat for 8 weeks: similar 1RM gains despite VL20 doing ~40% fewer reps; VL20 better CMJ (9.5% vs 3.5%); VL40 more vastus lateralis/intermedius hypertrophy and loss of IIX fibers. — [Universidad Loyola listing](https://www.uloyola.es/en/research-transfer/publications/effects-of-velocity-loss-during-resistance-training-on-athletic-performance-strength-gains-and-muscle-adaptations-article); [PDF](https://paulogentil.com/pdf/Effects%20of%20velocity%20loss%20during%20resistance%20training%20on%20athletic%20performance,%20strength%20gains%20and%20muscle%20adaptations.pdf)
- A later Smith-machine study (46 men; 0/10/20/40% thresholds): VL20 largest 1RM gains; VL40 largest but non-significantly different CSA gains. — [PubMed 36754062](https://pubmed.ncbi.nlm.nih.gov/36754062/)

### Inferences
- **Derived per-rep/RIR load step from the RTS chart**: differences between adjacent cells are ≈4.5% (1→2 reps), 3.3% (2→3), 3.0% (3→4), 2.9% (4→5), 2.6% (5→6, 6→7), 2.5% (7→8). So **one RIR point ≈ 2.5–3.5% load in the 3–8 rep zone, ≈4–5% near singles**. A sensible default is ~3% per RIR point for 3–8 reps and ~2% per RIR point for 10–15 reps (extrapolation; [WEAK/HEURISTIC]).
- Because "reps + RIR" is the effective rep-max in the chart, the core primitive of the engine should be **e1RM from (load, reps, RIR)** — this makes all sets comparable regardless of target.
- RIR underprediction of ~1 rep means a user's logged "RIR 2" is often really ~3. Systematic bias is fine for a progression engine as long as it is consistent; but a per-user calibration offset learned from occasional AMRAP/failure sets is evidence-supported.
- Velocity-loss literature supports the concept of **fatigue-based stopping**: stopping sets earlier (less fatigue) preserves strength gains; more fatigue may help hypertrophy. Translates to an "RPE stop" (end exercise when a set at fixed load reaches RPE X) or "load drop" (reduce load X% for back-off sets).
- APRE's large meta-analytic effect comes from tiny samples of football players; it's a useful template (max-rep set → adjust next load) but not proven superior for advanced lifters.

### Gaps
- **APRE adjustment table** [UNVERIFIED — background knowledge, not retrieved this session]: APRE 6RM protocol is commonly described as: warm-up 10 @ 50% of 6RM, 6 @ 75%, then set 3 = max reps @ 6RM; set 4 load adjusted by set-3 reps (0–2 reps: −5–10 lb; 3–4: −0–5 lb; 5–7: keep; 8–12: +5–10 lb; ≥13: +10–15 lb); set 4 reps set next week's load. Verify against Mann 2010 or [Training & Conditioning "Understanding APRE"](https://training-conditioning.com/article/understanding-apre-part-3/) before use.
- Tuchscherer's "load drop"/"repeat"/"RPE stop" fatigue percentages (e.g., common 3–8% load drop prescriptions) could not be found in a primary or reliable source this session.
- Helms 2018 exact RPE-group load-adjustment rules (how much load changed per RPE miss) could not be retrieved (PMC blocked).
- No peer-reviewed study directly compares double progression vs RIR-based load progression in advanced lifters (none found).

## Q2. Performance decline across consecutive sets (rep drop-off vs rest interval) — predicting reps on set N

### Takeaway
With a fixed load, reps fall substantially across sets; the drop is steep with 1–2 min rest and much smaller with 3–5 min, and smaller for exercises done early in a session. Published data give group averages only; no validated general "set-N predictor" exists, so the engine should learn a per-exercise, per-user drop-off coefficient with a rest-dependent prior.

### Cited Findings
- Senna et al. 2011 (15 trained men; 1-, 3-, 5-min rest): from set 1 to set 5 reps declined by almost 75% with 1-min rest vs ~33% with 5-min rest; RPE rose across sets in all conditions, highest with 1-min rest. — [Cissik blog summary](https://www.cissik.com/blog/?p=1556); [Brookbush Institute review](https://brookbushinstitute.com/article/rest-interval-length-multi-single-joint-exercise-performance-perceived-exertion)
- Senna et al. 2009 (14 trained men, 10RM loads, 3 sets × 6 exercises per sequence): total reps lower body 66.7 ± 4.9 (2-min rest) vs 80.9 ± 6.9 (5-min); upper body 71.1 ± 4.7 vs 83.7 ± 6.1. 2-min rest reduced reps across sets and exercises; 5-min rest produced fewer significant set-to-set declines; "reductions were less evident in the initial exercises of the session." — [Senna et al. 2009, J Sports Sci Med](https://jssm.org/jssm-08-197.xml-Fulltext)
- Senna et al. 2016: 2 min sufficient between sets of machine chest fly, 3–5 min needed for bench press (multi-joint requires longer acute recovery). — [Brookbush Institute](https://brookbushinstitute.com/article/rest-interval-length-multi-single-joint-exercise-performance-perceived-exertion)
- ACSM recommends 2–3 min for multi-joint and 1–2 min for single-joint exercises; Willardson's review recommends 3–5 min to maintain intensity for strength goals (secondary description). — [Brookbush Institute](https://brookbushinstitute.com/article/rest-interval-length-multi-single-joint-exercise-performance-perceived-exertion); [arXiv 2603.17495 (citing Willardson)](https://arxiv.org/abs/2603.17495)
- RIR accuracy improves on later sets (Remmert: 0.955 rep error set 1 vs 0.706 set 3), so later sets in a session give more reliable RIR data. — [Stronger By Science](https://www.strongerbyscience.com/reps-in-reserve)

### Inferences
- Rough default priors (fixed load, sets started near the target RIR): with ≥3 min rest on compound lifts, expect ~0.5–1 rep lost per subsequent set (or equivalently RIR dropping ~0.5–1 per set); with ~1–2 min rest, ~1–2 reps per set. These are extrapolated from the Senna percentages and are [WEAK/HEURISTIC] — the engine should override with user data after ~3–5 sessions.
- Simple model that fits the qualitative data: `expected_reps(n) = reps(1) × (1 − d)^(n−1)` or additive `reps(1) − k·(n−1)`, with `d`/`k` estimated per exercise (shrunk toward a rest-dependent prior). Additive is simpler and more interpretable for 3–5 set sessions.
- Equivalent framing in RIR terms: if load is held, **effective RIR falls about one point per set** at moderate rest — this is why many practitioners program "rising RPE" across straight sets or use back-off load drops.

### Gaps
- Richmond & Godard (2004) and Willardson & Burkett (2005–2006) rep-per-set data were not retrieved; exact per-set rep tables from Senna 2009 (Tables 1–2) not available in fetched text.
- No published, validated equation predicting reps on set N from set 1 across exercises/rest intervals was found.
- Data are mostly 10RM/to-failure protocols; drop-off when sets stop at 1–3 RIR (typical of advanced lifters) is likely smaller but unquantified in sources found.

## Q3. Exercise order effects

### Takeaway
An exercise done later in the session yields fewer reps at the same load (robust acute finding) and, over time, slightly smaller strength gains for that exercise, while hypertrophy appears unaffected by order. Magnitude depends on prior exercises' muscle overlap — not reliably quantified in the sources found, so it should be learned from user data.

### Cited Findings
- Simão et al. 2012 review (Sports Medicine): total reps (volume) are greater when an exercise is performed first, regardless of muscle mass involved; performed later at constant intensity, fewer reps are completed for both multi- and single-joint exercises; pre-exhaustion may not increase recruitment of large muscles (e.g., pec deck before bench). — [QxMD record](https://read.qxmd.com/read/22292516/exercise-order-in-resistance-training); [Paulo Gentil PDF](https://paulogentil.com/pdf/Exercise%20Order%20in%20Resistance%20Training.pdf); [IDEA Fit](https://www.ideafit.com/does-exercise-order-really-matter-in-resistance-training)
- Nunes et al. 2021 meta-analysis (European Journal of Sport Science 21(2):149–157; 11 studies): significant effect of order on strength gains, favoring exercises performed early (specificity); similar hypertrophy regardless of order. (Note: published in EJSS, not Sports Medicine.) — [IAT/LIDA record](https://lida.sport-iat.de/ta/Record/4059795?lng=en); [VU repository](https://vuir.vu.edu.au/44202/)
- Senna 2009: set-to-set rep reductions were less evident in the initial exercises of a session (cumulative session fatigue). — [Senna et al. 2009](https://jssm.org/jssm-08-197.xml-Fulltext)

### Inferences
- The engine should **not compare raw performance across different positions** (e.g., a session where incline press was done after flat bench vs first). Store `exercise_index` and a `prior_overlap_sets` feature (number of hard sets already done in the session for muscles shared with this exercise).
- Default prior [WEAK/HEURISTIC]: reduce expected reps by ~1 rep (or ~2–3% expected load) per ~3–4 prior hard sets with the same prime mover; zero adjustment if prior exercises don't share muscles. Then learn the user's own coefficient via regression of e1RM residual on `prior_overlap_sets`.
- Practical design: when the user's template keeps order constant (typical for advanced lifters running a program), order effects are automatically baked into "last session at this slot" and need no explicit modeling. Only apply the order adjustment when the order **changes** vs the reference session.
- Strength-priority lifts should be placed first; the app can surface a hint when a "main lift" is logged late.

### Gaps
- No pooled effect size (e.g., % rep loss per prior exercise) was retrieved from Simão 2012 or Nunes 2021 full texts.
- Effects of non-overlapping prior exercises (systemic fatigue) are not quantified in found sources.

## Q4. Rest interval effects

### Takeaway
Longer rest (≈3 min vs 1 min) improves strength and probably hypertrophy in trained lifters, mainly by preserving volume load; rest length should be logged and used as a modifier for expected set-to-set drop-off.

### Cited Findings
- Schoenfeld et al. 2016 (JSCR, "Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men"): 3-min rest group gained more strength and muscle thickness than 1-min group over 8 weeks; muscular endurance did not differ. Sample reported as 21 or 23 depending on source. — [NASE](https://www.naseinc.com/blog/how-long-should-you-rest-between-sets-for-size-and-strength/); [planfit.ai](https://planfit.ai/en/blog/how-long-should-you-rest-between-sets); [FitSociety](https://fitsociety.nl/?p=20690)
- Grgic et al. 2017 systematic review (EJSS 17(8):983–993): findings "equivocal"; for trained participants, newer sensitive measures suggest a possible advantage of longer rest; both short and long rest viable for untrained. — [PubMed 28641044](https://pubmed.ncbi.nlm.nih.gov/28641044/); [ResearchGate PDF](https://researchgate.net/profile/Brad_Schoenfeld/publication/317832672_The_effects_of_short_versus_long_inter-set_rest_intervals_in_resistance_training_on_measures_of_muscle_hypertrophy_A_systematic_review/links/59a010ad0f7e9b18359db18f/The-effects-of-short-versus-long-inter-set-rest-intervals-in-resistance-training-on-measures-of-muscle-hypertrophy-A-systematic-review.pdf)
- Schoenfeld has said 1 min seems short enough to compromise hypertrophy, ~2 min probably sufficient. — [James Fell](https://jamesfell.com/how-long-should-you-rest-between-sets/)
- See Q2: Senna 2009/2011/2016 quantify volume loss with shorter rest. — [Senna et al. 2009](https://jssm.org/jssm-08-197.xml-Fulltext)

### Inferences
- Auto-capture rest time (timestamp between sets). If actual rest < user's typical rest for that exercise, expect lower performance and do **not** interpret a rep shortfall as regression; flag "short rest" instead.
- Suggested rest defaults: compounds 3–5 min, isolation 1.5–2.5 min (aligned with Senna 2016 / Willardson / ACSM).

### Gaps
- No dose–response function (reps lost per minute of rest reduction) found.

## Q5. Long-term trend / readiness modeling (Banister vs simpler approaches)

### Takeaway
The Banister fitness–fatigue model is theoretically appealing but ill-conditioned, poorly identifiable, and sensitive to parameter choices — unsuitable as the core of a transparent personal app. A rolling e1RM trend (robust regression or EWMA over the last 4–8 weeks per lift) is simpler, explainable, and adequate.

### Cited Findings
- A 2025 Scientific Reports study found the FFM ill-conditioned with poor identifiability of fitness and fatigue parameters; earlier swimmer work showed similar instability. — [HAL INRAE (Sci Rep 2025)](https://hal.inrae.fr/hal-04999009v1); [HAL Inserm (2006)](https://www.hal.inserm.fr/inserm-00149782)
- FFM limitations: linearity, independence, and deterministic assumptions (doubling load predicts doubled improvement); fixes include non-linear inputs and state-space models. — [Swinton et al., RGU repository](https://rgu-repository.worktribe.com/OutputFile/1871154)
- A 2025 arXiv paper argues the Banister model fails to yield optimal recommendations consistent with empirical guidelines; FFM-type models don't yet meet criteria for practical use. — [arXiv 2505.20859](https://arxiv.org/pdf/2505.20859)
- Parameter values depend on starting values, modeling technique and training-load input; general constants don't capture inter-individual differences. — [LIDA: "The fitness-fatigue model: what's in the numbers?"](https://lida.sport-iat.de/ta/Record/4075491)
- **e1RM estimation**: a 2026 arXiv preprint (Marzagao; 303,494 near-failure sets, 14,966 users, 388 exercises from a consumer app) proposes `1RM = w × (1 + (r − 1)^0.85 / (−2.55 + 4.58 × ln(w)))`, reducing internal inconsistency 17–22% vs four classical equations; 91% of improvement from making the rep-conversion factor weight-dependent (at lighter loads each rep is a larger fraction of capacity). Caveats: preprint, no measured 1RMs (internal consistency only), units unstated. — [arXiv 2603.17495](https://arxiv.org/abs/2603.17495)

### Inferences
- Use **e1RM per set** from (weight, reps + RIR) as the universal performance metric; take the session's best (usually first working set) as the session e1RM.
- Trend = EWMA (e.g., half-life ~3 weeks) or Theil–Sen/OLS slope of session e1RM vs date over last 6–8 exposures. Express as %/week. For an advanced lifter, realistic main-lift progress is small, so noise (±2–3% day-to-day) will dominate single sessions — the engine should **smooth before acting**.
- "Readiness" for today = today's first working set e1RM vs trend prediction (residual). A residual of < −5% (or 2+ RIR worse than expected at the planned load) is a reasonable "bad day" flag [WEAK/HEURISTIC].
- Marzagao's equation is promising for isolation/light exercises but unvalidated against real maxes; offer Epley/RTS-style as default and let the per-user model choose the formula with the lowest internal inconsistency on the user's own data.

### Gaps
- No validated readiness thresholds (e.g., what % e1RM drop warrants a deload) were found in peer-reviewed sources.
- Stephens Hemingway et al. 2019 resistance-training FFM simulation results not retrieved.

## Q6. Plateau detection & deload/variation

### Takeaway
No peer-reviewed algorithm defines a "plateau" for an individual; practical, transparent rules based on e1RM slope and RIR-at-load trends are reasonable, but their thresholds are heuristics.

### Cited Findings
- FFM-style fatigue modeling is not reliable enough to drive deload timing (see Q5). — [HAL INRAE](https://hal.inrae.fr/hal-04999009v1)
- RP Hypertrophy app markets feedback (pump, soreness, workload) to adjust plans week by week; no published rules. — [RP Hypertrophy App Store](https://apps.apple.com/jp/app/id1555614554)

### Inferences (all [WEAK/HEURISTIC])
- **Plateau**: e1RM slope over last 6–8 exposures ≤ +0.25%/week AND no new rep/load PR in last 4 exposures → suggest variation (rep range change, exercise swap) or deload.
- **Overreaching / deload**: ≥2 consecutive sessions with e1RM residual < −3 to −5% across ≥2 lifts, or RIR repeatedly lower than target at unchanged loads (e.g., planned RIR 2, achieved RIR 0) → suggest deload week (~50% fewer sets, keep load ~-10%, or RIR +2–3).
- Also default "scheduled deload" every 4–8 weeks of accumulation as user setting.

### Gaps
- No RCT-derived deload trigger thresholds found.

## Q7. How existing apps implement progression (reference only)

### Takeaway
Commercial apps disclose little; vendor statements confirm per-set weight/reps/RIR targets from logged history and rounding to real available weights, but no formulas are published.

### Cited Findings
- Alpha Progression: per-set recommendations (weight, reps, RIR) based on logged training; uses the gym's actually available weights (e.g., a theoretical 31.7 kg target is unusable on a machine that jumps 30→35 kg, so it recommends a realistic weight/rep combination). — [Alpha Progression guide](https://alphaprogression.com/en/blog/alpha-progression-guide); [Alpha Progression vs Hevy](https://alphaprogression.com/en/blog/alpha-progression-vs-hevy)
- RP Hypertrophy: adjusts week-to-week based on pump, soreness and workload feedback; gives weekly weight and rep targets; rules not public. — [App Store listing](https://apps.apple.com/ar/app/id1555614554)
- Dr. Muscle markets a "challenge" mode; no algorithm details found. — [Dr. Muscle](https://dr-muscle.com/challenge/)

### Gaps
- Juggernaut AI and Liftosaur logic not researched in detail this session (Liftosaur is open-source/scriptable — its "Liftoscript" double-progression templates could be inspected directly if needed).

## Q8. Proposed algorithm (pseudo-code + evidence per factor)

### Takeaway
Use e1RM-from-(load, reps+RIR) as the core state, a per-exercise smoothed trend as the long-term anchor, double progression as the fallback when equipment increments are too coarse, in-session RIR-error correction (~2.5–3.5% per RIR point) for the next set, and learned per-user drop-off/order coefficients. Every suggestion carries a human-readable "why".

### Cited Findings (evidence anchors for each factor)
- RIR as control signal: Zourdos 2016; Helms 2018; Graham & Cleather 2019; Zhang 2021 — [Zourdos](https://openrepository.aut.ac.nz/items/efef3b25-6701-4fb5-bb82-55fcd2a26027/full); [Helms](https://pubmed.ncbi.nlm.nih.gov/29628895/); [Graham & Cleather](https://research.stmarys.ac.uk/id/eprint/3067); [Zhang](https://www.frontiersin.org/articles/10.3389/fphys.2021.651112/full)
- RIR bias ~−1 rep, best accuracy near failure and ≤12 reps — [SBS / Halperin](https://www.strongerbyscience.com/reps-in-reserve)
- Load step per rep/RIR — RTS chart [heuristic] — [FitnessVolt](https://fitnessvolt.com/?p=300212)
- Set drop-off & rest — [Senna 2009](https://jssm.org/jssm-08-197.xml-Fulltext); [Brookbush](https://brookbushinstitute.com/article/rest-interval-length-multi-single-joint-exercise-performance-perceived-exertion)
- Order — [Simão 2012](https://read.qxmd.com/read/22292516/exercise-order-in-resistance-training); [Nunes 2021](https://lida.sport-iat.de/ta/Record/4059795?lng=en)
- Real-weight rounding — [Alpha Progression](https://alphaprogression.com/en/blog/alpha-progression-guide)
- Trend vs Banister — [Sci Rep 2025](https://hal.inrae.fr/hal-04999009v1); [arXiv 2603.17495 e1RM](https://arxiv.org/abs/2603.17495)

### Inferences — the proposed engine

**Data per set**: exercise_id, equipment profile, load, reps, RIR (or RPE→RIR = 10 − RPE), set_index, exercise_index, rest_before_set (s), timestamp, set_type (warm-up/top/back-off/AMRAP), target {rep_range [lo,hi], target_RIR}.

**Equipment profile** (user-editable): barbell → plates allow 2.5 kg jumps (1.25 kg with fractional plates); dumbbells → user's actual DB list (often 2 kg/2.5 kg steps; 5 lb in imperial); machines → stack step (e.g., 5 kg / 7 kg / irregular list) + optional add-on weights; cable → stack list. The engine always rounds to the nearest *available* load (Alpha Progression's approach).

**1. e1RM primitive**
```
pct(reps_to_failure)       # RTS-style table for 1–12 (100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, ...),
                           # Epley-like extension beyond 12; optional Marzagao weight-dependent formula
e1rm(load, reps, rir) = load / pct(reps + rir + user_rir_bias[exercise])
user_rir_bias: learned from AMRAP/failure calibration sets (predicted RIR vs actual), default 0, clamp [-1, +2]
Exclude from trend: sets with reps+RIR > 15 (RIR less accurate) unless exercise is high-rep only.
```

**2. Long-term anchor (per exercise)**
```
session_e1rm = max e1rm over working sets with set_index ≤ 2 (fresh sets)
trend_e1rm   = EWMA(session_e1rm, half-life ≈ 3 weeks) or Theil–Sen over last 8 exposures
slope_pct_wk = robust slope / trend_e1rm
expected_today = trend_e1rm × (1 + slope_pct_wk × weeks_since_last)   # small forward projection
```

**3. Suggest first working set (pre-session)**
```
mode = "double_progression" if exercise.mode == DP or step_size/load > 4% else "load_from_e1rm"

if mode == "load_from_e1rm":                      # barbell compounds, fine increments
    target_load = expected_today × pct(target_reps + target_RIR)
    target_load *= order_factor × rest_factor      # see 5 & 6 (usually 1.0)
    load = round_to_available(target_load, prefer="down")
    reps = solve reps so that e1rm(load, reps, target_RIR) ≈ expected_today, clamp to [lo,hi]

if mode == "double_progression":                  # DBs, machines with coarse jumps, isolation
    last = last session's same-slot sets
    if all working sets hit reps ≥ hi at RIR ≥ target_RIR - 0.5:
         load = next_available_load_above(last.load); reps = lo        # load jump, reset reps
    elif last top set RIR > target_RIR + 1:        # too easy
         reps = last.reps + 2 (≤ hi)  (or load up if already near hi)
    elif last top set RIR < target_RIR - 1 or reps < lo:   # too hard / failed
         if this happened 2 sessions in a row: load = next_available_load_below(last.load)
         else: repeat last prescription (one bad day ≠ regression)
    else:
         reps = last.reps + 1 on first set (rep PR), same load
```
Rationale: double progression handles coarse increments (a 2.5 kg jump on a 12 kg DB is +21%, far beyond the ~3%/RIR step), which is exactly the case where rep progress must carry overload.

**4. In-session next-set adjustment (autoregulation)**
```
after each working set s:
   rir_err = reported_RIR - expected_RIR(s)      # expected_RIR(s) = target_RIR - k_drop × (s - 1) if load held
   step = 0.03 if target_reps ≤ 8 else 0.02      # ≈ RTS chart per-RIR step
   if |rir_err| ≥ 1:
       new_load = load × (1 + step × rir_err)    # e.g. RIR 4 when 2 expected → +6%
       new_load = round_to_available(new_load)
       if rounding swallows change: adjust reps by ±rir_err instead (bounded by rep range)
   else: keep load; suggest reps = last_reps - round(k_drop_reps)   # expected fatigue
   RPE-stop option: if planned "RPE stop @ RIR x" → stop exercise once a set lands ≤ x RIR
   Load-drop option: back-offs at load × (1 - drop%) where drop% default 5–10% [heuristic]
   Hard guardrails: never raise > 7.5% within a session; never suggest a load change on warm-ups
```

**5. Set-position fatigue model (per user, per exercise)**
```
prior: k_drop_reps = 0.7 if rest ≥ 180s & compound; 1.0 if 120–180s; 1.5 if < 120s  [heuristic from Senna]
update: Bayesian shrinkage / running mean of (reps_s1 - reps_sn)/(n-1) for straight sets at constant load,
        weight prior as ~5 pseudo-sessions
rest_factor: if rest_before_set < 0.75 × user_typical_rest: lower expected reps by +0.5–1 more; label "short rest"
```

**6. Exercise-order adjustment**
```
overlap_sets = Σ hard sets earlier today × muscle_overlap(prev_ex, this_ex)   # 1.0 primary, 0.5 secondary, 0 none
if overlap_sets differs from the reference (last) session:
     order_factor = 1 - c_order × (overlap_sets - ref_overlap_sets)      # prior c_order ≈ 0.007 (≈2–3% per 3–4 sets)
learn c_order per user by regressing session_e1rm residuals on overlap_sets (only once ≥ ~10 varied sessions exist)
```
Evidence for direction is solid (Simão 2012, Nunes 2021); magnitude is not → user data must decide.

**7. Plateau / deload logic**
```
plateau  = slope_pct_wk ≤ 0.25% over ≥ 6 exposures AND no rep- or load-PR in last 4 exposures
fatigue  = ≥ 2 consecutive sessions with first-set e1RM residual ≤ -4% on ≥ 2 exercises,
           OR ≥ 3 sets/session landing ≥ 1.5 RIR harder than predicted
if fatigue: suggest deload (sets -40–50%, load -10% or target RIR +2–3, 1 week)
elif plateau: suggest variation (change rep range by ±3, swap variation, or add/remove 1–2 sets) 
scheduled deload: user setting (e.g., every 5th week)
```

**8. Transparency** — every suggestion stores and shows its drivers, e.g.: "Last time 100 kg × 6 @ RIR 2 → e1RM 120.3 kg; 6-week trend +0.6%/wk; target 6 @ RIR 2 → 101.6 → rounded 102.5 kg. Bench done 2nd today after 3 OHP sets (−1.5%)."

**Where evidence is weak → rely on user-specific data**: per-RIR load step size beyond 3–8 reps, set-to-set drop-off magnitude at RIR-based (non-failure) sets, order-effect magnitude, plateau/deload thresholds, rest-interval dose response, choice of e1RM formula for isolation lifts, and individual RIR bias.

### Gaps
- No peer-reviewed validation exists for any complete rule-set like the one above; it is a synthesis of moderate evidence (RIR autoregulation, order/rest directions) plus practitioner heuristics (RTS chart, double progression, load-drop %). Recommend logging prediction error (predicted vs achieved reps at suggested load) to tune constants empirically.
