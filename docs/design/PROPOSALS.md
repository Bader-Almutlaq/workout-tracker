# JEM: proposals for the owner (2026-10-31)

Short proposals for the owner's list. Items marked **Building** are clear and in progress. Items marked **Proposal** wait for the owner's yes, or changes, before tasks are written. Everything follows the product rule: the app measures and suggests on request; training decisions stay with the owner.

---

## 1. Loadable weights: one concept used everywhere (Building, T-044)

Every suggested weight (warm-ups, progression, deload, "last time + 2.5 kg") is rounded to a weight you can actually load. One implementation in core:

| Equipment | Default steps (kg) | Default steps (lb) | Notes |
|---|---|---|---|
| Barbell | bar 20 + pairs of plates, smallest plate 1.25 → **2.5 kg** steps | bar 45, **5 lb** steps | per-exercise bar weight (EZ bar 10, trap bar 25…) |
| Dumbbell | **2.5 kg** steps from 2.5 | **5 lb** steps | per-exercise override (some gyms go 2 kg) |
| Machine / cable | **5 kg** stack steps | **10 lb** | per-exercise override (2.5, 4.5, 7…); add-on plates later |
| Plate-loaded machine | like barbell plates, no bar | | per-exercise starting weight |
| Bodyweight / band | none | | |

Rounding rule: suggestions round **to the nearest loadable weight**, and warm-ups round **down**. A suggestion never rounds to the same weight as a neighbouring set.

## 2. Warm-up sets (Building, T-044)

- Warm-ups get their own look: a softer colour across the whole row, a thin separator above the first working set, and no tick-mark weight in totals. They are never counted in volume, hard sets or e1RM (already true).
- **Auto-generated** from the first working set's weight, rounded with section 1. Suggested values appear greyed until you touch or tick them, exactly like "last time" values.
- Default count per exercise (editable per exercise, 0–4):
  - heavy compound barbell lifts (squat, bench, deadlift, overhead press, rows): **3**
  - other compounds: **2**
  - isolation: **1**
  - bodyweight: **0**
- Scheme (`Heuristic:`, from Ribeiro 2021's review: specific warm-ups near working loads can help strength; and studies using 40–80% of the working load):

| Warm-ups | Sets (× working weight, reps) |
|---|---|
| 1 | 60% × 6 |
| 2 | 50% × 8, 75% × 3 |
| 3 | 40% × 8, 60% × 5, 80% × 2 |

## 3. Finish screen: compared with last time, and personal bests (Building, T-045)

- **Compared with the last time you did this workout** (same template; or the same exercises when there's no template): duration, sets, volume, and per exercise "top set 100 × 8 → 102.5 × 8".
- **Personal bests** found in this workout, as plain lines with no confetti:
  - new best e1RM
  - most reps at a weight
  - heaviest weight for a rep count
  - best set volume
  - best session volume for an exercise

  They show in the finish summary and as a small marker in History.

## 4. Exercise search (Building, T-046)

Type plainly: "chest machine", "rear delt cable", "db bench", "bay" (finds Bayesian), typos included. It searches names, aliases, muscles, equipment and gym slang (DB, BB, RDL, SSB, BSS, OHP…), ranks your recent and frequent exercises higher, and keeps one-tap filters for muscle, equipment and compound/isolation.

## 5. Bigger library, with descriptions and pictures (Building after T-043, T-047)

- Merge **free-exercise-db** (public domain, 876 exercises, instructions, photos) and **wger** (Creative Commons, 939, modern lifts such as Bayesian curl, pendulum squat, JM press), plus a hand-written top-up of modern movements. Target: about 1,200+ exercises. A Credits screen covers the licences.
- Descriptions are stored offline. Pictures load when online and are kept after the first view, so the app doesn't grow by 100 MB.
- **Smaller muscles tracked:** serratus anterior, hip flexors (already present), tibialis, rotator cuff (present), brachialis, brachioradialis, lower traps, rhomboids, abductors/adductors (present) and teres. They appear in volume like the others.
- **Lengthened-bias tag** (the report's "worth considering"): exercises that load the muscle hardest at long length (Bayesian curl, overhead triceps extension, seated leg curl, deficit work). Analytics can then show what share of each muscle's sets were lengthened-biased. See the exercise-quality proposal (section 9).

## 6. Import and export for the main apps (Building, T-048/T-049)

- **Import:** Strong (done), **Hevy** (CSV), **FitNotes** (CSV), **Jefit** (CSV), **Fitbod** (CSV). Every importer goes through the same review: units, flagged sets, leave out all.
- **Export:** the full backup (done), plus **Strong CSV**, which Hevy and most apps import, and **Hevy CSV**. Each export is checked by importing it back.

---

## 7. Analytics structure (Proposal)

Three ways in, matching how you think:

1. **Exercise → its own page** (from Exercises or any workout):
   - e1RM trend over everything (load-independent, so switching to lighter weights doesn't break it)
   - best sets by rep range
   - volume per week
   - RPE over time
   - all sessions
   - Splits by machine/attachment when recorded (section 8).
2. **Workout → its own page** (a template such as "Upper A"):
   - progression *within that workout*, session by session
   - per exercise, the top set and e1RM in that workout only, so a heavy day and a light day of the same exercise never mix
   - the workout's total hard sets and duration over time
3. **Overview** (the Analytics tab):
   - the 7-day vs 28-day signature chart
   - weekly sets per muscle
   - Body (measurements)
   - a "this block" summary

**Trends and outliers:**
- The trend line uses the e1RM of qualifying sets (no warm-ups; RIR ≤ 4), so a light high-rep day counts at its true estimated strength instead of looking like a drop.
- Outliers (> 15% jump) are held until a second session confirms them. They show as hollow dots so you can see them.
- **Deload weeks are shaded** and excluded from "change per week" maths, so a planned dip reads as a deload.

## 8. Machines and attachments (Proposal)

- Each exercise in a workout can carry a **machine** (free text with suggestions from your history: "Panatta", "Nautilus", "Hammer Strength") and an **attachment** (rope, V-bar, straight bar, wide bar, single handle, EZ bar, MAG grip…), plus grip (pronated/supinated/neutral, width).
- Templates remember them, so they are set once per workout.
- Progression, "last time", PRs and suggestions are matched on **exercise + machine + attachment**. Analytics shows "all variants" by default, with one tap to split.
- Distinct movements stay separate exercises (bench vs incline), as today.

## 9. Exercise quality: stretch and tension profile (Proposal)

- Each exercise gets two descriptive tags:
  - **where the tension peaks** (lengthened / mid-range / shortened)
  - **stretch under load** (high / moderate / low)
- These come from biomechanics, are hand-checked, and are shown on the exercise page with a one-line reason and the citation (Maeo 2022, Wolf 2023, Pedrosa 2022).
- No "score out of 10": the evidence supports "lengthened-biased" as a useful tag, not a ranking. Analytics shows each muscle's share of sets that were lengthened-biased.

## 10. Deload (Proposal)

- **Deload button** on a program or workout. It proposes a deload from the report (40–50% fewer sets, and either 10% less weight or 2–3 more RIR), rounded with section 1. You accept or edit it before it applies, and it lasts one week by default.
- The app can *flag* when a deload might be worth considering, using the report's fatigue rule (first sets ≥ 4% below trend on two lifts, two sessions in a row). It's a quiet note, never automatic.
- Deload weeks are shaded on every chart.

## 11. Progression (Proposal)

- **Off by default and opt-in per exercise.** You pick a rule:
  - double progression (e.g. 8–12 reps, then add one load step)
  - RIR target (keep the top set at RIR 2)
  - % of e1RM
  - top set plus back-offs
- The app pre-fills next time's suggestion (greyed, like last time) rounded to a loadable weight, and shows why ("hit 12, 12, 11 last time → +2.5 kg").

## 12. Workout screen (waiting for the owner's Strong screenshots)

- Keep Strong's layout:
  - weight × reps
  - tick to complete
  - RPE per set
  - notes
  - free order
- Planned changes: warm-ups distinct (section 2); failure, drop and superset styling across the row with clear labels; rest shown at the top of the exercise, optional and never auto-added; RIR as an alternative to RPE; the template's target reps visible while training; and the workout's description at the top (templates already store notes).
- The rest waits for the screenshots.

## 13. RPE and RIR (Proposal)

- One setting chooses how you enter effort (RPE or RIR); it's stored once.
- The exercise page shows **RPE over time** and, for a planned weight, an **estimate**: "100 kg × 8 ≈ RPE 8.5 for you", from your e1RM trend. Descriptive, never a target.

## Owner decisions (2026-10-31)

The owner's answers to sections 1–13. Screenshots from Strong will follow for the workout screen, warm-up styling and finish screen; anything below marked *(images pending)* waits for them.

- **Progression (§11): yes, opt-in suggestions.**
  - Progress isn't only weight: it can be reps or intensity (a higher RPE). Usually reps first, within the exercise's chosen rep range, then a weight step.
  - Each exercise gets a **rep range** and **rest time** shown at its top, next to the notes.
  - Suggested values appear **beside** the input (e.g. in yellow) and are used only when tapped. *(images pending)*
- **Top set and back-off sets** (e.g. squat, bench): a separate feature, not part of progression. One heavy top set, then lighter back-off sets at a percentage of it.
- **Loadable weights (§1): agreed, with one change.** Many cable machines accept a small add-on plate, so cables (and machines where the owner sets it) step by small plates like plate-loaded equipment, not only 5 kg stack steps.
- **Warm-ups (§2):**
  - **Not generated by default.** The owner adds them; the generator stays available on request.
  - Warm-up rows use a lighter tint of the theme purple, with a thin separator before the working sets. Colours come from defined hex tokens so they stay unified. *(images pending)*
- **Suggested values everywhere** (last time, warm-up, progression): shown greyed. Ticking the set uses them. Default prefill is the previous workout's values.
- **Finish screen (§3): agreed.** Compare with the last workout (or last two), with a little analytics. *(Strong reference pending)*
- **Exercise search (§4): very good.** Add **filters**, e.g. show only biceps exercises before typing.
- **Pictures (§5):** an illustrated model (drawing or animation, not a photo of a real person) is preferred. It's a side feature; don't spend much on it.
- **Smaller muscles (§5):** keep them **secondary**: shown for the load they receive, never treated like main muscles (biceps, triceps). Searching for one (e.g. rotator cuff) may find exercises, but they must not crowd normal results.
- **Import/export (§6): done well.**
- **Analytics (§7): later.** It needs the most work and comes after measurements, exercises and workouts.
- **Machines and attachments (§8):**
  - Pick the manufacturer from a **list** (Panatta, Atlas, Hammer Strength, Life Fitness, Technogym, Nautilus, Cybex, Matrix, Prime, Gym80…) instead of typing it.
  - Analytics per exercise can show all machines together, or be **filtered to one machine**, since loads differ widely between machines.
- **Exercise quality (§9):** show it as a small profile (bars or a radar-style shape) if accurate data can be found.
- **Deload (§10):**
  - A yellow **Deload** button, for one exercise or the whole workout.
  - Default: about **20% less weight** on big lifts (squat, deadlift); for other exercises lower the intensity rather than the sets (the owner already does few sets). Then build back over 2–3 weeks (e.g. −20%, −10%, normal), depending on the exercise.
  - Deloaded sets are **stored as deload**, so analytics can shade them and show the training cycle.
- **RPE/RIR (§13):** intensity (RPE) is part of progression; entry details come with the workout screen images.
- **Order of work:** measurements → exercises → workouts → analytics. The owner will send feedback per page; each feature gets its own agent and runs in parallel where independent.
