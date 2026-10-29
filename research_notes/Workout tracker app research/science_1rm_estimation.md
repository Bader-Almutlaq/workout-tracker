# Estimating 1RM from Submaximal Sets: Science and Algorithm Choice for a Workout Tracker

Notes by research subagent, 2026-10-29. Every claim has an inline source. Where I read only a secondary account of a paper (for example the 2026 arXiv preprint's literature review), I say so. Arithmetic I did myself is labelled as an inference.

---

## Q1. How accurate are the classic prediction equations, and at what rep count do they stop being reliable?

### Takeaway
Classic equations correlate highly with measured 1RM (r > 0.90–0.95), but their absolute error varies by exercise. Accuracy is best at about 5 reps or fewer, falls off clearly above about 10 reps to failure, and the equations barely differ from one another. Most were derived from small bench-press samples or practitioner charts, not from large empirical studies. No meta-analysis directly pools prediction-equation accuracy. The largest relevant syntheses are Nuzzo et al. 2024 (reps at a given %1RM) and a 2026 app-data preprint (formula consistency).

### Cited Findings
**Equations as usually stated** (w = weight, r = reps):
- Epley (1985): `1RM = w × (1 + r/30)`. It came from a University of Nebraska poundage chart, not a peer-reviewed derivation. — [Marzagao 2026, arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- Brzycki (1993): `1RM = w / (1.0278 − 0.0278 × r)`. Published in a practitioner article (JOPERD) with no reported sample. It goes to infinity as r approaches about 37. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- Mayhew et al. (1992): `1RM = 100 × w / (52.2 + 41.9 × e^(−0.055 × r))`. Derived from 435 college students (184 men, 251 women) on the bench press. It was among the first equations with a substantial sample. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- Wathen (1994): `1RM = 100 × w / (48.8 + 53.8 × e^(−0.075 × r))`. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- Lander (1985), O'Conner (1989), Lombardi (1989): "similarly originated from practitioner manuals, textbook chapters … or small unpublished datasets." — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495). Their commonly listed forms are below. I did not verify these against the primary sources in this session.
  - Lander: `1RM = 100w / (101.3 − 2.67123r)`
  - O'Conner: `1RM = w(1 + 0.025r)`
  - Lombardi: `1RM = w × r^0.10`
  - Commonly listed on [Wikipedia: One-repetition maximum](https://en.wikipedia.org/wiki/One-repetition_maximum).

**Validation studies:**
- **LeSuer et al. 1997** (JSCR 11(4):211–213) tested 7 equations on 67 untrained college students (40 men, 27 women) in bench, squat and deadlift. Correlations were r > 0.95, but absolute accuracy differed by exercise, and all equations significantly underestimated deadlift 1RM. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
  - Secondary sources disagree on which equation "won" for each lift: Mayhew/Wathen for bench and squat versus Epley or Brzycki. I could not retrieve the primary abstract. — [musclecalc docs](https://crates-io.ganymede-static.progval.net/crates/musclecalc/0.1.0)
- **Reynolds, Gordon & Robergs 2006** (JSCR 20(3):584–592) tested 70 adults (34 men, 36 women, aged 18–69) on 1RM, 5RM, 10RM and 20RM in chest press and leg press.
  - The 5RM gave the best prediction (R² = 0.993 bench, 0.974 leg press).
  - Bench equation: `1RM = 1.1307 × 5RM + 0.6999 kg` (SEE 2.98 kg). Leg press: `1RM = 1.0970 × 5RM + 14.2546 kg` (SEE 16.16 kg).
  - The authors advised that no more than 10 reps be used in linear equations. Anthropometrics did not improve prediction.
  - — [Reynolds et al. 2006 PDF (UNM)](https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf); [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Mayhew et al. 2008** tested 103 women on bench before and after 12 weeks of training. Equations were more accurate when fewer than 10 reps to failure were used. — [PubMed 18714230](https://pubmed.ncbi.nlm.nih.gov/18714230/); [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Pattern across validation studies**, as summarised in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495):
  - High correlations hide meaningful absolute error.
  - Accuracy degrades above about 10 reps.
  - The deadlift and lower-body compounds often show larger errors than the bench.
- **Nuzzo et al. 2024** (Sports Med 54:303–321) is a meta-regression of 952 reps-to-failure tests from 7,289 people in 269 studies.
  - Mean reps fell with %1RM and were best fit by natural cubic splines, not linear or simple exponential curves.
  - The general model gives about 5 reps at 90% 1RM and about 15 reps at 70% 1RM.
  - Between-person SD is 2.51 reps at 80% 1RM and 4.36 reps at 60% 1RM, so variability grows as load falls.
  - The paper does not itself evaluate reps-based 1RM estimation.
  - — [Nuzzo et al. 2024, PMC10933212](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212)
- **Marzagao 2026** (arXiv preprint, Fitbod) compared four classic equations on 303,494 near-failure sets from 14,966 app users.
  - Mean within-person, 14-day SD of log(e1RM): Brzycki 0.1028, Epley 0.1026, Wathen 0.1021, Mayhew 0.1084. The first three are almost identical.
  - The author argues the equations "share a common structural limitation rather than differing in calibration."
  - — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Not located:** Wood et al. 2002, DiStasio 2014 and Macht et al. 2016. See Gaps.

### Inferences
- The choice between Epley, Brzycki and Wathen matters much less than (a) rep count, (b) exercise type and (c) proximity to failure. In the 2026 dataset, the three equations' consistency differed by only 0.0007 in SD(log).
- Practical rep cap: treat effective reps (reps + RIR) of 10 or fewer as reliable, with 1–6 best. Above 10–12, down-weight the set heavily or exclude it from the strength trend.
- Arithmetic check (mine): Epley and Brzycki agree at about 10 reps. Epley is higher at low reps (for r = 1 it returns 1.033·w rather than w), and Brzycki explodes above about 20 reps. Using `(r − 1)` in an Epley-style form gives exactly w at r = 1.

### Gaps
- I could not access the primary text or numbers for Wood et al. (2002, maybe *Meas Phys Educ Exerc Sci*), DiStasio (2014 thesis), Macht et al. (2016) or LeSuer et al. (1997). For LeSuer I have only the secondary summary.
- I found no peer-reviewed systematic review or meta-analysis that pools absolute error (for example %SEE) of Epley, Brzycki and the others across studies.

---

## Q2. Does accuracy differ by exercise, equipment, training status or sex?

### Takeaway
Exercise type is the dominant moderator. Sex, age and training status matter little.
- **Bench vs leg press:** at the same %1RM, leg press allows many more reps than bench press, so lower-body and large-muscle lifts need a flatter reps→%1RM curve.
- **App data:** the 2026 app-data study found that light exercises (dumbbell, isolation) need a much steeper curve than classic equations assume.
- **Effect size:** at 13 kg × 10, a classic equation and the weight-dependent formula disagree by about 30%.

### Cited Findings
- **Nuzzo 2024, bench vs leg press:**
  - Bench press: about 4 reps @90%, 8.8 @80% (95% CI 7.7–10.1), 14.1 @70%.
  - Leg press: about 9 @90%, 13.1 @80% (95% CI 9.8–17.5), 19.0 @70%.
  - Separate tables are recommended only for bench and leg press. Sex, age and training status showed little or no clear moderation.
  - Data for other exercises (OHP, row, calf raise) are limited. Bench made up 42% of tests and leg press 14%.
  - — [PMC10933212](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212)
- **Shimano et al. 2006:** at 60% 1RM, trained and untrained men did significantly more reps on the back squat than on the bench or curl. Training status had minimal impact. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Richens & Cleather 2014:** on leg press, endurance runners did 39.9 vs 17.9 reps @70% and 19.8 vs 11.8 @80% compared with weightlifters. Training background can change the curve, at least at the extremes. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **LeSuer 1997:** all equations underestimated deadlift 1RM in untrained students. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Marzagao 2026, weight-dependent formula.** Fitted on app data:

  `1RM = w × (1 + (r − 1)^0.85 / (−2.55 + 4.58 × ln(w_kg)))`

  - The implied k(w) rises with weight: 8.0 at 10 kg (DB lateral raise), 12.2 at 25 kg (DB bench), 16.9 at 70 kg (barbell bench), 20.4 at 150 kg (deadlift). Classic equations imply k ≈ 29–36.
  - Within-person inconsistency fell 17–22% against all four classic equations, and fell for all 183 exercises with at least 50 tuples.
  - Improvement by type: compound 16.3%, isolation 21.9% (vs Brzycki).
  - Improvement by equipment: barbell 12.3%, machine 16.0%, cable 18.9%, dumbbell 22.1%. Barbell bench gained only about 8%.
  - Examples: 13 kg curl × 10 gives about 17 kg (Brzycki) vs about 22 kg (new). 100 kg bench × 5 agree within 2 kg.
  - The weight-dependence term supplied 91% of the gain and the 0.85 exponent 9%.
  - User-level 5-fold cross-validation showed about 0% overfitting (train SD 0.0847, test 0.0848).
  - — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Caveats on Marzagao** (from the paper itself):
  - There is no measured 1RM. The criterion is internal consistency only.
  - Lower α kept improving the metric, possibly just by "compressing" the rep term, which "cannot be determined from the consistency metric alone."
  - Weight is a proxy for exercise and equipment, and dumbbells are logged per hand.
  - Sample: 80% male, mean age 35. The author is a Fitbod employee. It is a preprint, not peer reviewed.
  - In lb, the intercept shifts by b × ln(2.205).
  - k(w) is 0 at 1.75 kg, so a floor k ≥ 0.5 is needed.
  - — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)

### Inferences
- **My calculation from Nuzzo's means:** if you express them as an Epley-type `1RM = w(1 + (r−1)/k)`, the bench gives k ≈ 27–31 and the leg press k ≈ 42–48. Within one exercise the curve is fairly stable; across exercises it differs a lot.
- **A possible confound in the 2026 result (inference):**
  - Marzagao's very low k for light exercises is not necessarily an exercise property. It may partly reflect high-rep sets being stopped further from failure, because "near-failure" was inferred from AMRAP flags or rep drop-off, not true failure.
  - A weight-dependent k also gives a weak and a strong lifter different curves on the same exercise. It is unit-sensitive (kg vs lb, per-hand dumbbells).
  - So use it as an exercise-category prior, not as an absolute truth.
- **Practical design:** keep a per-exercise curve parameter k_e with a category prior, then personalise it from the user's own data (see Q4). Suggested starting priors:
  - barbell lower-body compounds: k ≈ 35–45
  - barbell upper-body compounds: k ≈ 28–30
  - machine and cable compounds: about 20–25
  - dumbbell and isolation: about 12–20

  These priors are my synthesis of the Nuzzo and Marzagao numbers above, not a published table.
- Deadlifts likely deserve extra caution, given the underestimation in LeSuer and grip or technique limits.

### Gaps
- There are no validated exercise-specific equations for most accessory, machine or cable lifts. Nuzzo and Marzagao both note this.
- I found no peer-reviewed data on sex differences in prediction-equation error specifically, beyond Nuzzo's finding of minimal moderation in reps-at-%1RM.

---

## Q3. How should RIR/RPE be incorporated, and how accurate are self-reported RIR?

### Takeaway
The standard method is to add reported RIR to the reps done, then look up %1RM at RPE 10 for that effective rep count. RIR = 10 − RPE in the Zourdos/Helms scale, and this is the structure of the Tuchscherer/RTS chart. Lifters typically underpredict how many reps they have left by about 1 rep on average. Error is larger far from failure, in high-rep sets (above 12) and, per older studies, in novices. So RIR-adjusted estimates are reliable only for sets reported at about RIR 0–3 (RPE ≥ 7).

### Cited Findings
- **RIR-based RPE scale (Zourdos et al. 2016):** RPE 10 = 0 RIR. Tested in 29 squatters (15 experienced, 14 novices). Velocity–RPE correlations were r = −0.88 (experienced) and −0.77 (novice). — [arXiv 2603.17495 review](https://arxiv.org/pdf/2603.17495)
- **Helms et al. velocity correlations:** RIR-based RPE correlated with velocity at r = −0.87 (squat) and −0.79 (bench), citing Helms 2017. — [Helms et al. 2018, Front Physiol](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/pdf)
- **RPE→RIR mapping:** 10 = 0, 9.5 = 0–1, 9 = 1, 8.5 = 1–2, 8 = 2, 7.5 = 2–3, 7 = 3, 6.5 = 3–4, 6 = 4+. — [FitnessVolt RPE calculator](https://fitnessvolt.com/rpe-calculator/)
- **Tuchscherer RPE chart** (attributed to Mike Tuchscherer; percentages called "approximations based on population averages"). — [FitnessVolt](https://fitnessvolt.com/rpe-calculator/)
  - RPE 10, 1–12 reps: 100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.6%.
  - RPE 8 row, 1–12 reps: 92.2, 89.2, 86.3, 83.7 … This is the RPE 10 row shifted by 2 reps, so the chart is exactly "reps + RIR".
  - Worked example: FitnessVolt quotes 300 lb × 3 @ RPE 8 as "about 87.5%", giving about 343 lb. Note the inconsistency: its own chart lists 86.3% for 3 reps @ RPE 8, which gives 300/0.863 ≈ 348 lb. — [FitnessVolt rep-max/RPE pages](https://fitnessvolt.com/rpe-training/rep-max-chart/)
- **Halperin et al. 2022** (Sports Med; scoping review plus exploratory meta-analysis): 13 publications, 12 studies, 414 participants.
  - Participants underpredicted reps to failure by 0.95 reps (95% CI 0.17–1.73), with I² = 97.9%.
  - Accuracy improved slightly closer to failure (β = −0.025).
  - It was much worse for sets with more than 12 reps to failure (spline β = 0.47 reps per extra rep vs 0.06 for 12 or fewer).
  - Training experience had no meaningful effect (β = −0.006). Later sets were slightly more accurate (β = −0.07). Upper vs lower body was unclear (−0.58, CI −2.32 to 1.16).
  - The authors judged that the primary source of error was systematic underprediction, with relatively small between-person variation.
  - — [Halperin et al. preprint, SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/67); [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/?term=Halperin+accuracy+predicting+repetitions+to+task+failure+scoping+review)
- **Steele et al. 2017** (n = 141): experienced trainees underpredicted reps to failure by about 1–2, less experienced by about 4–5. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Refalo et al. 2024** (24 trained, 12 men and 12 women; bench at 75% 1RM): intraset RIR error 0.65 ± 0.78 reps, with no effect of sex, experience or relative strength. — secondary account in [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Squat RIR study** (PubMed 30747900): RIR error grew from about 2 reps at RPE 9 to about 5 reps at RPE 5, and larger errors accompanied more total reps in the set. — [PubMed 30747900](https://pubmed.ncbi.nlm.nih.gov/30747900/) (detail via search summary; not read in full)
- **Retraction:** Hughes, Peiffer & Scott 2020 (RIR in squat, bench, OHP, row) is flagged as retracted. Do not cite it. — [Murdoch research portal](https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Estimating-repetitions-in-reserve-in-four/991005542917507891)
- **STMr R package** (Jovanović): its reps-max estimation functions take a subjective `eRIR` input and offer weighting by `1/(eRIR+1)` and `1/reps`. This weights sets closer to failure and with fewer reps more heavily. — [STMr estimate functions](https://r-packages.io/packages/STMr/estimate_functions)

### Inferences
- **Recommended:** `r_eff = reps + RIR`, where RIR = 10 − RPE if RPE was logged.
- **Systematic bias:** people underpredict by about 1 rep, so reported RIR understates true RIR and e1RM from `reps + RIR` will be slightly low. Options:
  - (a) add a small correction (+0.5 rep) when RIR ≥ 2, or
  - (b) leave it, because the bias is consistent and the trend, not the absolute level, is what matters.

  I recommend (b) by default, or a per-user calibration (Q4).
- **Weight sets by RIR:** full weight at RIR 0–2, reduced at RIR 3–4, and exclude RIR ≥ 5 or "no RIR logged and not to failure" from strength-trend estimation. They can still count for volume.
- **No RIR/RPE logged:** do not assume RIR 0. Either treat the set as a lower bound on e1RM, or assume a default (for example RIR 2) and down-weight it.

### Gaps
- I found no study that directly validates RPE- or RIR-adjusted e1RM against measured 1RM across many exercises.
- I did not obtain Helms et al. 2016/2018 1RM-estimation accuracy figures beyond the velocity correlations.
- I did not obtain the RTS chart from Tuchscherer's own site. The values above come from a third-party reproduction.

---

## Q4. Can an individualised load–reps profile be fitted from the user's own history?

### Takeaway
Yes, and it is the most defensible upgrade.
- **Why:** individual variability in reps at a given %1RM is large (SD 2.5–4.4 reps at 60–80%). Individualised models outperform generic equations in the velocity literature.
- **What exists:** open-source tooling (STMr) already fits per-person Epley-type k and 1RM jointly from training sets, with RIR-based weighting and mixed-effects variants.
- **What is missing:** I found no peer-reviewed validation of a Bayesian or hierarchical reps-based e1RM against tested maxima.

### Cited Findings
- **Between-person variability (Nuzzo 2024):** SD 2.51 reps at 80% and 4.36 at 60%. A generic table is a population average, not an individual prediction. — [PMC10933212](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212)
- **STMr** (Mladen Jovanović, *Strength Training Manual*, 2020): `estimate_k_1RM()` jointly estimates k and 1RM from absolute weight and reps.
  - Variants exist for the Epley (k), modified Epley (kmod) and linear/Brzycki (klin) forms. The default generic k is 0.0333 (that is, 1/30).
  - The package also has a non-linear mixed-effects estimation function.
  - Fits use `nlsLM`, with optional weights such as `1/reps` and `1/(eRIR+1)`.
  - — [STMr docs](https://r-packages.io/packages/STMr/estimate_functions); [STMr package](https://r-packages.io/packages/STMr)
- **Velocity analogy (Greig et al. 2023):** individualised load–velocity profiles had a pooled SEE of about 9.8% of 1RM (20 studies, 434 participants). Individualised models "consistently outperform generic equations." — [arXiv 2603.17495 review](https://arxiv.org/pdf/2603.17495); [Greig et al. 2023, PMC10432349](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10432349/)
- **Internal-consistency criterion:** different weight×rep sets from the same person, exercise and 14-day window should map to the same e1RM. This is how Marzagao fitted parameters without tested maxima, and it can be applied per user. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)

### Inferences
**Suggested model** (my design, built from the sources above):
- `%1RM(r_eff) = 1 / (1 + (r_eff − 1)/k_e)`, so `e1RM = w × (1 + (r_eff − 1)/k_e)`.
- k_e is per user × exercise, with a hierarchical or shrinkage prior centred on the exercise-category k from Q2. With n near-failure sets, shrink toward the prior (empirical Bayes):

  `k̂ = (n·k_user_fit + n0·k_prior) / (n + n0)`, with n0 ≈ 10–20.

- **Fit k_e by internal consistency:** within short windows (7–14 days), choose the k_e that minimises the variance of log(e1RM) across that user's near-failure sets at different rep counts.
- **Requirement:** the user must log at least 2 distinct rep counts and 2 distinct weights in a window. 81% of Marzagao's qualifying tuples had only 2 sets ([arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)), so data will be sparse. Personalisation should be slow and guarded.
- **Bounds:** clamp k_e to a plausible range (about 8–50) and only update from sets with RIR ≤ 3 and r_eff ≤ 12.

### Gaps
- I found no peer-reviewed paper validating Bayesian or mixed-model per-user reps-based e1RM against measured 1RM. STMr is open-source tooling, not a validation study.

---

## Q5. Velocity-based estimation (brief)

### Takeaway
Load–velocity profiling is the main alternative paradigm, but it needs a sensor. Its accuracy is also only moderate: about 10% SEE for individualised profiles, and the two-point method slightly overestimates 1RM. It is not relevant to a sensorless app.

### Cited Findings
- **Greig et al. 2023** (Sports Med; systematic review with individual-participant-data meta-analysis, 20 studies, 434 participants): pooled SEE about 9.8% of 1RM for individualised load–velocity profiles. The authors recommend direct testing when precision is required. — [PMC10432349](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10432349/); [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Two-point method systematic review** (PLOS ONE 2023; 16 studies): slight 1RM overestimation (ES = 0.203, 95% CI 0.132–0.275). — [PMC10659210](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10659210/)
- **González-Badillo & Sánchez-Medina 2010** (120 trained men, bench): mean propulsive velocity vs %1RM gave R² = 0.98, and the relationship was stable after a 9.3% 1RM gain. — [arXiv 2603.17495 review](https://arxiv.org/pdf/2603.17495)

### Inferences
- Without a sensor, RIR/RPE is the practical proxy for "velocity / proximity to failure." The RIR scale was validated against velocity (r ≈ −0.8 to −0.9).

### Gaps
- None material for this app.

---

## Q6. How should noisy per-set e1RMs be turned into a reliable strength trend?

### Takeaway
Per-set e1RMs from real training logs are noisy: about 8–10% SD within a person over 2 weeks. True 1RM day-to-day variation is smaller, with a median test-retest CV of about 4%. Raw per-set or per-session values therefore overstate fluctuation, and smoothing is required. Practitioner apps mostly plot the best set per session. I found no peer-reviewed study comparing smoothing methods for e1RM. The recommended filter below is an engineering inference.

### Cited Findings
- **App-data scatter:** within-person, within-exercise, 14-day SD of log(e1RM) is about 0.10 with classic equations and 0.085 with the weight-dependent formula, i.e. roughly ±8.5–10%. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **1RM test-retest reliability** (systematic review of 32 studies, pooled n = 1,595): median ICC 0.97, median CV 4.2% (range about 0.5–12.1%), consistent across experience and exercise type. — [Grgic et al. 2020, PMC7367986](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7367986/)
- **Within-session fatigue:** rep performance falls from set 2 with 1-minute rest and from set 3 with 3–5-minute rest (Senna et al. 2011, 15 trained men). No classic equation accounts for set order. — [arXiv 2603.17495 review](https://arxiv.org/pdf/2603.17495)
- **Marzagao's de-duplication:** the study kept only the first near-failure set per user × exercise × day as "the freshest data point." — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- **Practitioner and app conventions:**
  - Several apps take the highest e1RM in a session as that session's value and chart the best-set e1RM over time ([Vitruve support](https://support.vitruve.fit/how-to-estimate-the-1rm); [Reppie docs](https://vivekascoder.notion.site/Reppie-Docs-1d639909ecfc801bb18cc1e3e546e601)).
  - FitnessVolt says day-to-day e1RM fluctuations of 3–7% are "completely normal" and advises tracking the multi-week trend ([FitnessVolt](https://fitnessvolt.com/rpe-training/my-strength-profile/)). This is non-peer-reviewed.
- **Not found:** a Stronger By Science / Nuckols article specifically on e1RM trend smoothing.

### Inferences
These are my recommendations, derived from the noise figures above.

**1. Per-session value.** For each exercise and session, compute e1RM for every working set that qualifies: r_eff ≤ 12, RIR ≤ 4 (or failure/AMRAP), not a warm-up. Then take a weighted max-ish statistic.
- Simple: **best qualifying set** (max e1RM).
- More robust: **weighted mean of the top 2 sets**, with weights `w_i = 1/(1 + RIR_i) × 1/r_eff_i` (mirrors STMr weighting).
- Best set is biased upward by noise, since the max of noisy estimates is inflated. But it is stable and familiar, and fatigue biases later sets downward, so the best set roughly offsets that. Pick one and keep it consistent.

**2. Outlier handling.** Reject or down-weight a session value that deviates more than about 15% (about 2 SD of 0.085 log) from the current trend. Possible causes are a typo, a unit error, or a dumbbell logged as a pair vs per hand. Use a robust (Huber) Kalman update or a Hampel-style filter.

**3. Smoothing.** Apply a time-aware filter on log(e1RM):
- **EWMA with time-based decay:** `α = 1 − exp(−Δt/τ)`, τ ≈ 14–21 days. This handles irregular session spacing.
- **Or a local-level (random-walk) Kalman filter:**
  - process variance q ≈ (0.5–1% per week)² × Δt_weeks, i.e. true strength drifts slowly.
  - observation variance R ≈ 0.085² / weight_i, larger for high-rep, high-RIR or unlogged-RIR sets.
  - The Kalman gain then down-weights noisy sets automatically and gives an uncertainty band.
- Show the smoothed line, with raw session points as dots and an "estimated 1RM ± band".

**4. Detraining gaps.** If no session occurs for more than about 3–4 weeks, inflate the Kalman state variance so the next sessions re-anchor quickly.

**5. Actual heavy singles.** If a set is r = 1 at RIR 0, treat it as a near-direct measure: low R, and no formula needed.

### Gaps
- I found no peer-reviewed comparison of best-set vs averaged sets or of EWMA vs Kalman vs LOESS for e1RM tracking. This is an evidence gap, and the recommendations above are engineering judgement grounded in the measured noise levels.

---

## Q7. Concrete recommendation: what algorithm should the app use?

### Takeaway
Use an Epley-type `(r−1)/k` equation driven by `reps + RIR`, with an exercise-specific k (category priors that get personalised slowly). Cap effective reps at about 10–12. Weight sets by proximity to failure and low rep count. Track log(e1RM) with a time-aware EWMA or a robust Kalman filter. If you want a single fixed formula, Epley/Brzycki with r_eff ≤ 10 is as good as any classic equation, but it will underestimate light, isolation-exercise maxima.

### Cited Findings
- Classic equations perform nearly identically, and none was derived across many exercises. — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- Accuracy degrades above about 10 reps; the 5RM is most accurate. — [Reynolds 2006](https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf); [Mayhew 2008](https://pubmed.ncbi.nlm.nih.gov/18714230/)
- RIR self-report error is about 1 rep and worsens above 12 reps and far from failure. — [Halperin 2022](https://sportrxiv.org/index.php/server/preprint/view/67); [PubMed 30747900](https://pubmed.ncbi.nlm.nih.gov/30747900/)
- Exercise type is the main moderator; leg press reps far exceed bench at the same %1RM. — [Nuzzo 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212)
- Light-exercise curves are steeper (lower k). — [arXiv 2603.17495](https://arxiv.org/pdf/2603.17495)
- The RTS chart equals the RPE 10 curve evaluated at reps + RIR. — [FitnessVolt](https://fitnessvolt.com/rpe-calculator/)

### Inferences
**Recommended algorithm (synthesis):**

1. **Effective reps**
   - `RIR = 10 − RPE` if RPE is logged; RIR = 0 if the set is marked failure or AMRAP.
   - `r_eff = reps + RIR`.
2. **Eligibility**
   - Use for the trend if `r_eff ≤ 12` (best ≤ 10), `RIR ≤ 4` and the set is not a warm-up.
   - Sets with no RIR or RPE: assume RIR = 2, apply a lower weight, and use them only if no RIR-logged set exists that session.
3. **Per-set estimate**
   - `e1RM = w × (1 + (r_eff − 1)/k_e)`. With r_eff = 1 this returns w exactly.
   - Default k_e by category (inference from Nuzzo and Marzagao): barbell lower-body compound about 38; barbell upper-body compound and pulls about 29; machine/cable compound about 24; dumbbell compound about 20; isolation (DB/cable/machine) about 15.
   - Equivalence checks:
     - Classic Epley ≈ k = 30 on `r` rather than `r − 1`.
     - Brzycki ≈ k ≈ 36.
     - RTS RPE 10 table ≈ k ≈ 25 (my arithmetic: 5 reps = 86.3% → k ≈ 25.2; 10 reps = 73.9% → k ≈ 25.5).
   - Optional alternative: adopt Marzagao's `k(w) = max(0.5, −2.55 + 4.58 ln w_kg)` with exponent 0.85. Convert lb to kg first, and use total load where possible. This is preprint-only evidence.
4. **Personalisation.** Once a user has at least 10 eligible sets on an exercise spanning at least 2 rep counts, update k_e by minimising within-14-day variance of log(e1RM). Apply shrinkage toward the category prior (n0 ≈ 15) and clamp to 8–50.
5. **Set weight:** `w_i = 1/(1 + RIR_i) × min(1, 6/r_eff_i)`. Optionally apply a 0.9× penalty for the third and later sets of an exercise in a session (fatigue).
6. **Session value:** the max e1RM among eligible sets, or the weight-averaged top 2. Pick one and keep it fixed.
7. **Trend:** on `y = ln(session_e1RM)`, run a local-level Kalman filter.
   - Observation noise SD about 0.085, scaled by 1/√weight.
   - Process noise about 0.007/√week.
   - Huber-robust update: clip innovations beyond 2.5σ.
   - Display `exp(state)` with ±1σ.
   - Simpler alternative: time-decayed EWMA, τ ≈ 14–21 days.
8. **Display.** Show the smoothed e1RM as the headline. Show actual tested singles distinctly. Label e1RM for r_eff > 10 sets as "low confidence."

### Gaps
- Default k values per category are my synthesis, not a published, validated table.
- A clean validation of the full pipeline against tested maxima across many exercises does not exist in the literature I found. The app could gather this itself from users' occasional true singles.
