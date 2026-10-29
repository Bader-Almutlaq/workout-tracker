# Science of Counting Training Volume & Intensity per Muscle (for workout-tracker analytics)

Research date: 2026-10-29. The two main quantitative sources are both from the Florida Atlantic University (Zourdos) lab:
- **Pelland et al. (published Sports Medicine, Dec 2025)**: weekly volume and frequency. Peer reviewed.
- **Remmert et al. (SportRxiv 2025)**: per-session volume. Still a preprint when last checked (March 2025 version).

I read the full text of the Remmert preprint, which also restates many of Pelland's numbers. I could not reach the published Pelland full text (Springer paywall redirect), so Pelland figures come from its abstract record and from Remmert's description of it.

---

## 1. Fractional set counting (direct vs indirect) and per-session diminishing returns

### Takeaway
Counting a set as **1.0 for the muscle that is the primary mover and 0.5 for meaningful secondary movers** ("fractional" sets) is now the best-supported way to count weekly hypertrophy volume.
- In Pelland et al. 2025 (67 studies, 2,058 participants), it explained hypertrophy better than counting all sets equally ("total") or counting only direct sets.
- Exploratory fits suggest an indirect set is worth less than half a direct set: about 32% for hypertrophy and about 16–39% for strength.
- Returns diminish at both the weekly and the per-session level:
  - Hypertrophy shows no detectable extra benefit beyond **~31 fractional sets/week** and **~11 fractional sets per muscle per session**.
  - Strength plateaus far earlier: **~3 fractional sets/week** or **~2 direct sets/session** of the tested lift.

### Cited Findings
- **Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC.** "The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains." *Sports Medicine*, published online 4 Dec 2025, doi 10.1007/s40279-025-02344-w — [sponet record](https://sponet.de/sponet/Record/4097139); [DOI](https://doi.org/10.1007/s40279-025-02344-w)
  - 67 studies, 2,058 participants. Multilevel meta-regressions adjusted for intervention duration and training status. — [sponet record](https://sponet.de/sponet/Record/4097139); [Spanish summary](https://www.fisiologiadelejercicio.com/dosis-respuesta-en-volumen-y-frecuencia-en-la-mejora-de-hipertrofia-y-fuerza-muscular/)
  - Counting methods compared: indirect sets weighted 1 ("total"), 0.5 ("fractional") or 0 ("direct"). Fractional had the strongest relative evidence and was used for the primary models. — [sponet record](https://sponet.de/sponet/Record/4097139)
  - For hypertrophy, fractional beat total with a **Bayes Factor of 9.48**. — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
  - Higher weekly volume improved both hypertrophy and strength. Strength showed much stronger diminishing returns than hypertrophy. — [sponet record](https://sponet.de/sponet/Record/4097139)
  - Point of undetectable outcome superiority (PUOS): **~31 fractional sets/week for hypertrophy** and **~3 fractional sets/week for strength**. — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
  - Best-fit functional form for weekly volume was a **root (square-root-type) curve**. — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Definitions used by the FAU lab** (all from the [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)):
  - Direct set: the measured muscle is likely the primary force generator.
  - Indirect set: the measured muscle likely contributes meaningfully to force but is not the primary force generator.
  - Hypertrophy example: if the biceps are measured, isolated elbow flexion (curls) counts 1 and non-isolated elbow flexion (e.g., rows) counts 0.5.
  - Strength example: if back squat is tested, squat sets count 1 and leg press counts 0.5 (fractional) or 0 (direct).
  - The authors say the classification "was not wholly objective". The full direct/indirect table is Table 1 of the Pelland paper.
- **Why indirect sets count less:** the preprint cites Mannarino et al. With volume equated, curls grew elbow-flexor thickness +11.06% vs +5.16% for dumbbell rows (within-subject, trained to failure). — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Evidence that 0.5 may be generous** ([Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)):
  - Exploratory model-fit analyses (AIC/BIC) estimated the indirect-set weight at **~32% of a direct set for hypertrophy** (per-session analysis).
  - For strength, the estimates were **~16% (per-session)** and **~39% (weekly)**.
  - The authors note one "might reasonably critique" using 50%.
  - They conclude indirect sets' contribution to strength is "likely <50%" of direct sets.
- **Remmert JF, Pelland JC, Robinson ZP, Hinson SR, Zourdos MC (2025)**, "Is There Too Much of a Good Thing? Meta-Regressions of the Effect of Per-Session Volume on Hypertrophy and Strength." SportRxiv preprint, not peer reviewed, last modified March 2025.
  - Positive per-session dose-response for both outcomes (posterior probability of slope > 0 = 100%).
  - PUOS at **~11 fractional sets/session for hypertrophy** and **~2 direct sets/session for strength**.
  - Best-fit per-session form was logarithmic.
  - Source: [preprint](https://sportrxiv.org/index.php/server/preprint/view/537); [Biolayne summary](https://biolayne.com/reps/issue-36/too-much-muscle-math-finding-the-ideal-training-volume-per-session/)
- **How the two papers fit together:** the per-session PUOS × the average frequency in the dataset (2.33 sessions/wk) gives ≈25.6 weekly sets, reasonably close to the ~31 weekly PUOS. The authors caution against translating directly between the two, since the functional forms differ and many studies trained only one muscle. — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Definition of PUOS:** the volume beyond which an additional set does not give a >50% probability that the difference in gain exceeds the smallest detectable effect size. — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Earlier work counted sets differently:**
  - Earlier meta-analyses (Schoenfeld 2017; Ralston 2017; etc.) either counted only direct sets or counted all sets equally (the "total" method). — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
  - Ralston et al. 2017 (strength; 9 studies) reported a graded dose-response between weekly sets and strength. — [PMC5684266](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5684266/)
- **Practitioner reading of Pelland:** "up to 30–40 weekly fractional sets is optimal for hypertrophy," but the best return per set is likely lower. — [Stronger By Science, Milo Wolf, 31 Dec 2025](https://www.strongerbyscience.com/high-volume-vs-high-intensity/)

### Inferences
- The default weighting should be primary = 1.0 and secondary = 0.5, because that is what the best-supported meta-regression used. The PUOS benchmarks (~31/wk, ~11/session) are therefore expressed in this unit, and a dashboard that compares against them must use the same counting.
- Consider an advanced setting for the secondary weight (e.g., 0.3–0.5). The data hint ~0.3 may fit hypertrophy better, but 0.5 is the published convention.
- The per-session cap is a useful "junk volume" flag: more than ~10–11 fractional sets for one muscle in one session is unlikely to add detectable growth. Because the source is a preprint, show it as soft guidance, not a hard limit.
- For strength, the meaningful metric is **sets of the specific lift (or close variants) per week and per session**, not muscle-level fractional sets. Fractional muscle sets explain strength poorly at the per-session level.

### Gaps
- The published Pelland full text was not accessible (paywall), so I could not extract:
  - its exact marginal slopes for volume (e.g., % gain per added set at 5/10/20 sets);
  - the final peer-reviewed PUOS values, which may differ slightly from the preprint figures Remmert quotes.
- I could not confirm whether the Remmert per-session preprint has since been peer reviewed or published.
- The direct/indirect classification table (Pelland Table 1) was not retrieved.

---

## 2. Mapping exercises to muscles with weights (primary/secondary coefficients)

### Takeaway
I found no peer-reviewed standard table of per-exercise muscle coefficients. The research convention is binary:
- **direct = 1.0**
- **indirect = 0.5** (the measured muscle contributes meaningfully but is not the primary mover)
- **non-contributing = 0**

Consumer apps such as Boostcamp use the same 1.0 / 0.5 scheme (bench = 1 chest + 0.5 triceps). EMG-based weightings are not validated predictors of hypertrophy.

### Cited Findings
- The FAU lab's classification is a judgment call: a muscle is "direct" if it is likely the primary force generator and "indirect" if it likely contributes meaningfully. The authors say this was "not wholly objective". — [Remmert et al. preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- Boostcamp's Muscle Tracker applies fractional counting automatically: a bench press counts as one chest set and half a triceps set. — [Boostcamp muscle tracker](https://www.boostcamp.app/features/muscle-tracker)
- Practitioner coverage describes the fractional method as counting multi-joint movements as half sets for the muscles they assist (e.g., triceps/front delts on pressing, biceps on rows). — [train.fitness, "Not All Sets Are Created Equal"](https://train.fitness/personal-trainer-blogs/not-all-sets-are-created-equal)
- Volume-equated curls grew the elbow flexors about twice as much as rows (+11.06% vs +5.16%). This supports a secondary weight of ≤0.5. — [Remmert et al. preprint, citing Mannarino et al.](https://sportrxiv.org/index.php/server/preprint/view/537)

### Inferences
- Recommended practical scheme:
  - **primary = 1.0**
  - **secondary (meaningful synergist) = 0.5**
  - **stabilizer/isometric only = 0** (e.g., abs on squats, forearms on rows, glutes on leg extension = none)
- Allow per-exercise user overrides.
- Example mappings, all inferred from the research convention:

  | Exercise | Primary (1.0) | Secondary (0.5) |
  |---|---|---|
  | Bench / incline press | chest | triceps, front delts |
  | OHP | front delts | triceps (and side delts as 0.5) |
  | Row / pull-up / pulldown | lats/upper back | biceps, rear delts |
  | Squat | quads | glutes, adductors |
  | RDL / deadlift | hamstrings/glutes | erector spinae |
  | Hip thrust | glutes | hamstrings |
  | Curl | biceps | (none) |
  | Dip | chest/triceps (pick one primary) | the other at 0.5 |
- Keep the muscle granularity moderate, around 12–16 groups:
  - chest, lats/upper back, front/side/rear delts, biceps, triceps, quads, hamstrings, glutes, calves, abs, forearms, adductors, erectors
  - Finer splits (e.g., upper vs lower chest) have no counting evidence.

### Gaps
- No peer-reviewed or published coefficient tables were found for RP, MacroFactor Workouts, Hevy, Alpha Progression or Stronger By Science. Searches did not confirm how MacroFactor or Hevy weight secondary muscles.
- No studies validate EMG-derived continuous weights (e.g., 0.7 / 0.3) against hypertrophy outcomes.
- Regional hypertrophy (e.g., long vs short head, stretch-biased exercises) is not handled by any counting scheme found.

---

## 3. Definition of a "hard set", effective reps, and proximity to failure

### Takeaway
Proximity to failure matters for **hypertrophy but much less for strength**:
- In Robinson et al. 2024's meta-regression, hypertrophy improved as estimated reps-in-reserve (RIR) approached 0, while strength was mostly unaffected; load mattered more for strength.
- Refalo et al. 2023 found only a trivial hypertrophy advantage for training to true failure over non-failure (ES 0.19, CI 0.00–0.37).

"Hard sets" (roughly 0–3/4 RIR) are therefore the right unit for hypertrophy volume. Sets far from failure plausibly count less, but there is no validated discount function. The "effective reps" model (only the last ~5 reps stimulate growth) is a mechanistic hypothesis that has been critiqued and is not well supported by outcome data.

### Cited Findings
- **Robinson ZP et al. (2024).** "Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions." *Sports Medicine* 54(9):2209–2231, doi 10.1007/s40279-024-02069-2 — [Abertay repository](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/); [lida record](https://lida.sport-iat.de/ta/Record/4089104)
  - Proximity to failure was measured as RIR estimated from each study's description. The accuracy of that estimation is unknown.
  - Hypertrophy improved when sets ended closer to failure. Strength gains were relatively consistent across RIR, with load more influential.
  - Secondary sources disagree on how many studies were included (55 vs 214). This is unresolved.
  - Data and code are on OSF (osf.io/7knsj).
- **Refalo MC et al. (2023).** "Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis." *Sports Medicine* 53(3):649–665 — [Deakin repository](https://dro.deakin.edu.au/articles/journal_contribution/Influence_of_Resistance_Training_Proximity-to-Failure_on_Skeletal_Muscle_Hypertrophy_A_Systematic_Review_with_Meta-analysis/22030796)
  - 15 studies. Trivial advantage for failure vs non-failure (ES = 0.19, 95% CI 0.00–0.37). No moderating effect of volume load (p = 0.884).
  - A secondary summary reports 0.15/0.21 depending on the comparison. This is a minor discrepancy to verify.
- **Pelland's volume–hypertrophy relationship** held across proximity to failure (as well as rest periods, duration and training status) in its supplementary analyses. — [Stronger By Science](https://www.strongerbyscience.com/high-volume-vs-high-intensity/)
- **Practitioner guidance:** about **4–10 hard sets per muscle per week** can work well if sets are truly near failure (low-volume, high-intensity approach). — [Stronger By Science, Wolf 2025](https://www.strongerbyscience.com/high-volume-vs-high-intensity/)
- **Effective reps model (Beardsley):** the final ~5 reps before failure drive hypertrophy, reasoning from motor-unit recruitment and slowing bar velocity. — [summary](https://summify.io/discover/what-are-effective-reps-kHm_h6/)
  - Critics say it has "some mechanistic basis" but "doesn't align with the actual research findings." — [Menno Henselmans](https://mennohenselmans.com/how-close-to-failure-should-you-train/)
  - Stronger By Science published a dedicated critique (Nuckols), which I did not retrieve in full. — [SBS](https://www.strongerbyscience.com/?p=49459)

### Inferences
- **Hard set definition for the app:** a working set with RIR ≤ 3–4 (RPE ≥ 6–7). Warm-ups and sets logged with RIR ≥ 5 are excluded from "hard sets". If no RPE/RIR is logged, assume a working set is hard by default and let users tag warm-ups.
- **Optional RIR-weighted volume:** e.g., weight 1.0 at 0–3 RIR, 0.5 at 4–5 RIR, 0 at ≥6 RIR. This is a heuristic consistent with Robinson et al.'s direction of effect, not a validated coefficient, and should be labelled as such.
- Do not compute "effective reps" as a headline metric. Its evidence base is weaker than set counting.
- Robinson suggests proximity to failure is largely irrelevant for strength, so a strength dashboard should focus on load (%1RM / e1RM) and specific-lift sets, not RIR.

### Gaps
- No peer-reviewed study defines an exact RIR cutoff for a "hard set". The 0–4 RIR convention is practitioner consensus, and I found no primary source stating it.
- No validated function converts RIR to a fractional "stimulus" weight.
- The exact Robinson slope estimates (e.g., % hypertrophy per RIR) were not retrieved.

---

## 4. Intensity metrics: %1RM, average intensity, tonnage, INOL, Prilepin, RPE-weighted volume

### Takeaway
- **Hypertrophy:** across loads, set count of hard sets is the best-supported volume metric. Load-based metrics add little.
- **Strength:** relative intensity (%1RM, or %e1RM from logged reps/RPE) and sets of the specific lift matter most.
- **Tonnage (volume load = sets × reps × load)** does not track hypertrophy well and is confounded by load (lighter sets inflate reps). It also did not moderate the failure effect in Refalo 2023.
- **Prilepin's chart and INOL** are practitioner heuristics from Olympic weightlifting with no peer-reviewed validation. They may be offered as strength-programming aids, not science-backed targets.

### Cited Findings
- Volume load did not moderate the failure-vs-non-failure hypertrophy effect (p = 0.884). — [Refalo et al. 2023](https://dro.deakin.edu.au/articles/journal_contribution/Influence_of_Resistance_Training_Proximity-to-Failure_on_Skeletal_Muscle_Hypertrophy_A_Systematic_Review_with_Meta-analysis/22030796)
- For strength, load appears to be the more influential variable than proximity to failure. — [Robinson et al. 2024](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)
- **Prilepin's chart**
  - It was compiled from observations of Soviet weightlifters' training, based on percentages of competition max, rather than peer-reviewed research. — [Chivers, Absolute newsletter](https://drmichaelchivers.substack.com/p/lessons-from-coach-prilepin-training); [Long Term Training](https://longtermtraining.substack.com/p/method-breakdown-prilipens-chart)
  - Commonly quoted "optimal total reps" (second-hand): 55–65% → 24 reps; 70–80% → 18; 80–90% → 15; 90%+ → 7. — [Mind Pump summary](https://stationlm.com/analysis/1129350c-b170-4f36-b1b5-83ce11b93c5a)
  - Critique: it is derived from Olympic lifts that lack an eccentric phase, so it may not transfer to presses, squats or rows. — [StrongFirst forum](https://www.strongfirst.com/community/goto/post?id=509570)
- **Weekly-volume effect on strength** shows strong diminishing returns (~3 fractional sets/wk PUOS). The extra weekly days effect is +3.27% strength per additional training day at the average frequency. — [Remmert et al. preprint, quoting Pelland](https://sportrxiv.org/index.php/server/preprint/view/537)

### Inferences
- Recommended intensity metrics for dashboards:
  1. **Estimated 1RM (e1RM) trend per lift**, from reps + load (+ RPE if logged). This is the primary strength-progress metric.
  2. **Relative intensity distribution:** % of working sets in load bands, e.g., <60%, 60–75%, 75–85%, >85% e1RM, or rep-range bands 1–5 / 6–12 / 13–30.
  3. **Average RPE/RIR of working sets** per muscle or lift, as an effort proxy.
  4. **Tonnage**, shown only as a secondary per-exercise "work done" trend, with a tooltip noting it is not a hypertrophy-dose metric.
- The INOL formula as used by practitioners is reps ÷ (100 − %1RM), summed per lift per session. Treat it as optional, labelled "practitioner heuristic, unvalidated". See Gaps: no source confirmed.

### Gaps
- No source retrieved for INOL (attributed to Hristov) or its recommended ranges. The formula above comes from general practitioner usage and was not verified this session.
- No peer-reviewed validation of Prilepin's chart or INOL was found.
- I did not retrieve a peer-reviewed critique of tonnage specifically. The limitations are inferred from load–rep trade-offs and the Refalo moderator result.

---

## 5. Recommended weekly set ranges per muscle and frequency

### Takeaway
Evidence-graded ranges, in hard sets per muscle per week:
- **Minimum effective, especially near failure:** ~4–10 hard sets (practitioner synthesis).
- **Common evidence-based target:** 10–20 sets. This comes from older direct/total-set meta-analyses and Baz-Valle 2022 (12–20 in trained young men; low certainty, 6–7 studies).
- **Upper bound of detectable benefit:** ~30–40 fractional sets (Pelland 2025).

The relationship is graded with diminishing returns (Schoenfeld 2017: ~0.37% extra gain per weekly set). Frequency has negligible independent effect on hypertrophy when volume is equated, but helps strength. RP's MEV/MAV/MRV are practitioner heuristics, not empirically derived.

### Cited Findings
- **Schoenfeld, Ogborn & Krieger (2017).** *J Sports Sci* 35(11):1073–1082. — [PubMed 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/)
  - 15 studies, 34 treatment groups.
  - Each additional weekly set gave ES +0.023, about **+0.37% hypertrophy**.
  - Lower vs higher volume within studies: ES diff 0.241 (3.9%).
  - Categorical (<5, 5–9, 10+ sets/muscle/week) showed only a trend (p = 0.074). The popular "10+ sets" recommendation stems from this categorical analysis.
- **Baz-Valle et al. (2022).** *J Hum Kinet*. — [PMC8884877](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/)
  - Trained men aged 18–35, ≥1 yr experience, 7 studies (6 in meta-analysis). Groups: low <12, moderate 12–20, high >20 sets/wk.
  - No moderate vs high difference for quads or biceps. High volume was better for triceps.
  - Conclusion: 12–20 weekly sets "may be" an optimum standard recommendation.
- **Pelland et al. (2025)**
  - PUOS ~31 fractional sets/wk for hypertrophy. — [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
  - "Up to 30–40 weekly fractional sets is optimal," with better per-set efficiency lower down. — [SBS](https://www.strongerbyscience.com/high-volume-vs-high-intensity/)
  - SBS also recommends 10–20 hard weekly (direct) sets for major muscles for size. — [search summary of SBS content](https://www.strongerbyscience.com/?p=61514)
- **Frequency**
  - Pelland 2025: frequency's effect on hypertrophy was compatible with negligible effects (+0.32%/extra day, 95% CrI −0.14% to 0.82%). For strength, +3.27%/extra day (CrI 2.74–3.84%) with diminishing returns. — [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537); [sponet record](https://sponet.de/sponet/Record/4097139)
  - Schoenfeld, Ogborn & Krieger 2016 (*Sports Med*): training a muscle ≥2×/wk was superior to 1×/wk (volume not strictly equated in all studies). — [PubMed 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/)
  - Schoenfeld, Grgic & Krieger 2019 (*J Sports Sci* 37(11):1286–1295; 25 studies): no significant difference between frequencies on a volume-equated basis, so frequency can be chosen by preference. — [lida record](https://lida.sport-iat.de/ta/Record/4052540); [Henselmans review](https://mennohenselmans.com/training-frequency-2018-meta-analysis-review/)
- **RP volume landmarks** (practitioner heuristics)
  - Chest, for intermediates: MV 2–4, MEV 4–6, MAV 6–16, MRV 16–24 sets/wk. RP says beginners' landmarks are "substantially lower". — [RP chest guide](https://rpstrength.com/chest-training-tips-hypertrophy/)
  - MAV is described as the progression zone between MEV and MRV. Maintenance is ~6 sets/wk (inconsistent with the chest-specific MV of 2–4). — [RP volume landmarks](https://rpstrength.com/training-volume-landmarks-muscle-growth/)

### Inferences
- Dashboard target bands per muscle (weekly fractional hard sets), with an evidence label on each:
  - **<4** = "below minimum" (low evidence for growth)
  - **4–10** = "maintenance / minimum effective"
  - **10–20** = "evidence-based target" (moderate evidence)
  - **20–30** = "high, diminishing returns"
  - **>30** = "beyond detectable benefit" (Pelland PUOS)
- Note that Schoenfeld, Baz-Valle and RP counted mostly direct or total sets, not fractional. The same lifter's fractional count is lower than "total" and higher than "direct".
- Frequency: show sessions per muscle per week as information only. Flag only when per-session fractional sets exceed ~11 (suggesting the user split volume across more days).
- Present RP landmarks as optional user-calibrated personal ranges (MEV/MRV the user sets), not as literature values.

### Gaps
- RP landmark numbers for muscles other than chest were not retrieved.
- No meta-analysis provides muscle-specific ranges (e.g., calves vs quads); evidence is mostly quads, biceps and triceps.
- Sex, age and training-status-specific ranges were not extracted. Baz-Valle covers young trained men only.

---

## 6. Block/periodization analytics

### Takeaway
I found no research-defined standard for summarizing a training block. Literature-consistent summaries combine:
- weekly fractional sets per muscle over time (the volume ramp)
- sets per muscle relative to target bands
- load/rep-range distribution (intensity profile)
- average RIR trend
- e1RM change per key lift

RP's mesocycle model (start near MEV and add sets toward MRV, then deload) gives a practitioner template for "volume ramp" visuals.

### Cited Findings
- RP frames MAV as the progression zone between MEV and MRV within a mesocycle, implying volume increases across the block. — [RP volume landmarks](https://rpstrength.com/training-volume-landmarks-muscle-growth/)
- Practical guidance: the high-volume vs high-intensity choice should be judged by whether lifts hold or rise. Performance trend is used as the recovery/feedback signal. — [SBS, Wolf 2025](https://www.strongerbyscience.com/high-volume-vs-high-intensity/)
- Hypertrophy and strength respond to different dose drivers:
  - Hypertrophy is volume- and failure-sensitive, with weak frequency effects.
  - Strength is load-, specificity- and frequency-sensitive, with low-volume plateaus.
  - Sources: [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537); [Robinson 2024](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)

### Inferences
Suggested block summary card:
- **Emphasis:**
  - The top 3 muscles by average weekly fractional sets.
  - Each muscle's share of total fractional sets, for example as a radar or bar chart.
  - Muscles below 4 sets/wk flagged as "maintenance only".
- **Volume ramp:** per-muscle weekly fractional sets for weeks 1..N, the slope (sets/wk added per week), and deload weeks detected by a >30–40% drop in volume. The threshold is a heuristic.
- **Intensity distribution:**
  - % of hard sets by rep range (1–5, 6–12, 13–20, 20+) or %e1RM band.
  - Average RIR per week.
- **Outcomes:** e1RM change per main lift and best-set rep PRs. Optionally, bodyweight and measurements if logged.
- **Junk-volume flags:** sessions with >11 fractional sets per muscle, and weeks with >30 fractional sets per muscle.

### Gaps
- No peer-reviewed literature on block-summary metrics or deload detection was found.
- Evidence comparing periodization models was out of scope and not searched.

---

## 7. Concrete recommendation: formulas and dashboard metrics

### Takeaway
Use **fractional hard sets per muscle per week** as the core hypertrophy metric, with per-session and weekly diminishing-return flags. For strength, use **specific-lift sets plus an e1RM/intensity distribution**. All benchmark numbers should come from Pelland 2025 / Remmert 2025 (fractional), Schoenfeld 2017 and Baz-Valle 2022, each labelled with its counting method and evidence strength.

### Cited Findings
- **Fractional weights** (1 / 0.5 / 0) are the best-supported counting method for hypertrophy. — [sponet record](https://sponet.de/sponet/Record/4097139); [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Weekly PUOS** ≈31 fractional sets (hypertrophy) and ≈3 (strength). — [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Per-session PUOS** ≈11 fractional sets (hypertrophy) and ≈2 direct sets (strength). — [Remmert preprint](https://sportrxiv.org/index.php/server/preprint/view/537)
- **Graded dose-response:** ≈0.37% extra hypertrophy per weekly set. — [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- **12–20 sets/wk** is a reasonable standard for trained young men (low certainty). — [Baz-Valle 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/)
- **Closer to failure** gives more hypertrophy; there is little effect on strength. — [Robinson 2024](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)

### Inferences (proposed formulas, derived from the cited findings, not from any single paper)
- **Hard set flag:** `hard = is_working_set && (RIR == null || RIR <= 4)`. Warm-ups are excluded.
- **Fractional sets per muscle m in week w:**
  `FS(m,w) = Σ_sets hard × weight(exercise, m)`, where `weight ∈ {1.0 primary, 0.5 secondary, 0 otherwise}`.
  - Optional user setting: secondary weight 0.3–0.5.
- **Optional effort-weighted sets:**
  `EFS(m,w) = Σ hard × weight × f(RIR)`, with `f = 1.0 (RIR 0–3), 0.5 (RIR 4–5), 0 (≥6)`.
  - Label this "experimental heuristic".
- **Per-session cap flag:** `FS(m,session) > 11`, worded as "additional sets unlikely to add detectable growth (preprint evidence)".
- **Weekly zones:** <4 / 4–10 / 10–20 / 20–30 / >30 fractional sets.
- **Frequency:** `sessions(m,w)` = number of sessions with FS(m) ≥ 1. Informational only for hypertrophy, and relevant for strength.
- **Strength metrics per lift:**
  - weekly direct sets of the lift
  - top-set e1RM, e.g., Epley `load × (1 + reps/30)` or an RPE-adjusted table. This is a standard formula, but its source was not verified this session.
  - % of sets ≥80% e1RM
- **Secondary/optional:** tonnage per exercise (labelled "work done, not hypertrophy dose"), INOL (labelled "unvalidated practitioner heuristic").
- **Block summary:** average FS per muscle, ramp slope, deload detection, rep-range distribution, average RIR, and e1RM delta.

### Gaps
- No standard is published for e1RM formula accuracy across rep ranges (not searched).
- No app (MacroFactor, Hevy, Alpha Progression, RP Hypertrophy App) muscle-weight tables were verified; only Boostcamp's 1/0.5 convention was confirmed.
- The published Pelland paper's final numerical estimates should be checked against the preprint-quoted values before the dashboard copy is finalized.
