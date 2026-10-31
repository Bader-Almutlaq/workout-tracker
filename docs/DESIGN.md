# Design system

Inspired by Linear: calm, dense, precise. Designed dark-first, with a full light theme. By default it follows the phone's appearance setting; Settings → Appearance can force Dark or Light (`src/app/appearance/appearance.ts`, stored in `localStorage`). Near-black layered surfaces, hairline borders instead of shadows, one indigo accent, and a type scale that carries hierarchy without extra decoration. Numbers are the content, so they get the best typography.

Tokens live in `src/app/design/tokens.css` as CSS variables (`--color-surface`, `--font-headline`, `--space-l`…). Components use them through CSS modules, never raw colors, font sizes or paddings. Screens are designed at 430 × 932 (iPhone 15 Pro Max) and respect the safe areas (`env(safe-area-inset-*)`).

## Color tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `background` | `#08090A` | `#FBFBFC` | Screen background |
| `surface` | `#141516` | `#FFFFFF` | Cards, list rows |
| `surfaceRaised` | `#1C1D1F` | `#F4F5F7` | Active set row, sheets, pressed state |
| `border` | white 8% | black 8% | Hairline (0.5 pt) card and row borders |
| `borderStrong` | white 14% | black 14% | Focused input, selected chip |
| `textPrimary` | `#F7F8F8` | `#0B0C0E` | Values, titles |
| `textSecondary` | `#9EA1A8` | `#5A5E66` | Labels, previous-session values |
| `textTertiary` | `#62666D` | `#8A8F98` | Units, captions, axis labels |
| `accent` | `#7C85E8` | `#5E6AD2` | Primary action, selection, single-series lines |
| `accentSubtle` | accent 16% | accent 12% | Selected chip fill, completed-set row tint |
| `warmupRow` | `#30355E` | `#E7E9FB` | Full warm-up row; explicit accent-derived purple tint |
| `warmupLabel` | `#B6BDFF` | `#505BB8` | W label, brighter purple against the warm-up row |
| `suggestion` | `#F4BF50` | `#946000` | Optional amber value beside a set cell; tap to accept |
| `statusBad` | `#D03B3B` | `#D03B3B` | Failure-set F label (`--color-status-bad`) |

**Status** (always paired with an icon and a label, never color alone): good `#0CA30C`, warning `#FAB219`, serious `#EC835A`, critical `#D03B3B`.

## Typography

System font (`-apple-system`, which is SF Pro on the iPhone). Text inputs are 16 px so iOS doesn't zoom into them. Hierarchy comes from size and weight, never color alone.

| Style | Size / weight | Use |
|---|---|---|
| `display` | 34 / semibold, tight tracking | Hero number (e.g. current e1RM) |
| `title` | 22 / semibold | Screen titles |
| `headline` | 15 / semibold | Card titles, exercise names |
| `body` | 15 / regular | Default |
| `callout` | 13 / medium | Labels, chips |
| `caption` | 11 / medium, uppercase, +0.4 tracking | Section labels, axis titles |

All numbers in tables, set rows and axes use **monospaced digits** so columns align. Units sit beside the value in `textTertiary` (for example **102.5** kg).

## Units

- **Logging** shows each exercise in its own entry unit (kg or lb, remembered per exercise). What you did last time and what to load next appear in that unit. One tap on the number pad switches the exercise's unit; stored values never change.
- **Analytics** are always in kg, so every chart and total shares one scale. Touching a chart point reveals both units ("63.5 kg · 140 lb").
- Converted numbers use `Weight.displayValue(in:)`, so 61.23 kg reads as 135 lb, not 134.99.

## Spacing, shape, motion

- 4-pt grid: `xs 4, s 8, m 12, l 16, xl 24, xxl 32`. Screen side margin 16.
- Corner radius: 8 (rows, chips), 12 (cards), 16 (sheets).
- No drop shadows. Elevation is shown by a lighter surface plus a hairline border.
- Motion: 150–200 ms ease-out, no bounces (`--motion-standard`). No haptics: Safari on iOS has no vibration API.

## Charts

Charts follow the data-viz method used for this project. Its rules: pick the form first; color by job; thin marks; one y-axis; legends for two or more series; text in ink colors, never series colors.

- **Single-series trends** (e1RM, bodyweight): the smoothed trend is a 2 pt `accent` line. Raw session values are 6–8 pt dots at 35% opacity, so the noise is visible but quiet. The title names the series, so there's no legend.
- **Interaction:** touch-and-drag shows a vertical rule with a value readout (pointer events on the SVG). This replaces hover on a phone.

### Signature chart: recent vs baseline

The owner's reference is Apple Fitness's Training Load card (screenshot, 2026-10-29). Its pattern is reused for every "how am I doing lately" chart: weekly hard sets per muscle, weekly tonnage, e1RM trend and bodyweight.

- **Two lines, one axis.**
  - The recent line is a short window, such as the 7-day sum or the latest session. It is a 3 pt smooth line (`catmullRom`) with a dot on every data point.
  - The baseline line is a long window, such as the 28-day average or the EWMA trend. It is a 1.5 pt line in `textPrimary`, with no dots.
  - Both lines share the y-axis. They describe the same quantity, so this never becomes a dual-axis chart.
- **Dots colored by distance from the baseline.** This is a diverging encoding:
  - **Neutral** (`textSecondary`): within ±10% of the baseline.
  - **Cool** (slot 1 blue): further below.
  - **Warm** (slot 5 magenta): further above.
  - The intensity grows with the distance.
  - The headline always states the number, so color is never the only cue.
- **Latest point** gets an 8 pt ring with a soft glow. This is the only decoration on the chart.
- **Headline above the chart** is descriptive, never a verdict: **"+12%"** followed by "7-day vs 28-day hard sets" in caption style. There are no "Steady", "Overreaching" or "Detraining" labels: the app measures, it doesn't judge.
- **Grid:** vertical dashed hairlines at week starts, with date labels inside the plot at the bottom. There are no horizontal gridlines or y-axis labels on this card; exact values come from touch. The card background fades to `accentSubtle` at the bottom.
- **Scope chips** go above the headline, one row that scrolls horizontally. Each chip shows its own % change, e.g. "All · −3%" and "Chest · +72%".
- **Touch:**
  - **One finger, press and drag:** a vertical rule snaps to the nearest point and the headline area becomes a readout. It shows the date, the recent and baseline values, and for weights both units.
  - **Two fingers, or press then drag the second edge:** selects a range (`chartXSelection(range:)`). The readout shows the range statistics: start → end change, mean, min, max, number of sessions and total hard sets.
  - Releasing returns to the headline.
- Drawn as SVG by React components, using `d3-scale` and `d3-shape` for scales and smooth curves (`curveCatmullRom`), with no chart framework. Touch uses pointer events on the SVG. Chart math (windows, baselines, % change, range statistics) lives in `src/core/analytics`; the component only draws.
- **Axes:** gridlines in `border`, horizontal only. Axis labels in `textTertiary`, using monospaced digits. The y-axis does not start at zero for e1RM trends (a trend chart, not a magnitude chart). Bars always start at zero.
- **Volume per muscle:** horizontal bars sorted by value, with direct and indirect sets stacked and a 2 pt gap between segments. Evidence zones are drawn as faint background bands with text labels.
- **Categorical palette** (fixed order, never cycled; at most 3 series on scatter-type charts, at most 8 on lines and bars, and anything beyond folds into "Other"):

| Slot | Dark | Light |
|---|---|---|
| 1 blue | `#3987E5` | `#2A78D6` |
| 2 orange | `#D95926` | `#EB6834` |
| 3 aqua | `#199E70` | `#1BAF7A` |
| 4 yellow | `#C98500` | `#EDA100` |
| 5 magenta | `#D55181` | `#E87BA4` |
| 6 green | `#008300` | `#008300` |
| 7 violet | `#9085E9` | `#6250D6` |
| 8 red | `#E66767` | `#E34948` |

  This is the data-viz skill's reference palette, validated for color-vision deficiency on its own surfaces (`#1A1A19` dark, `#FCFCFB` light), which are close to ours. If any value changes, re-run the skill's validator against `#141516` and `#FFFFFF` (it needs Node.js).
- **Sequential (heatmaps, body map):** one blue ramp, light to dark: `#CDE2FB` … `#0D366B`.
- **Color follows the entity.** A muscle or lift keeps its color across every chart and filter.
- Every chart has a "Show as table" option.

## Layout principles

- The workout logging screen is the most important screen. Last session's numbers sit inline on every set row. Logging a set takes 2–3 taps.
- One primary action per screen, in `accent`. Everything else is quiet.
- Prefer lists and tables over cards when comparing numbers.
- Empty states say what to do next in one line, with no illustrations.

## App icon

- Source: `design/app-icon.svg`. Render with `make icon` into `public/icon-192.png`, `public/icon-512.png` and `public/apple-touch-icon.png` (the Home Screen icon). Never edit the PNGs by hand.
- Concept: the end of a loaded barbell from the side. The plates grow left to right, so the mark also reads as a rising bar chart. It is the indigo accent on the near-black background, with no text.
- Graphics are drawn as SVG by agents. A design tool such as Figma isn't needed for marks this simple.

## Live workout

The sticky top bar keeps elapsed time and Finish visible. The session header shows its name,
a menu for rename/discard, local date and elapsed time. Each exercise name opens its exercise
page and uses the accent. An info line shows only saved rest targets and session exercise notes;
unset fields take no space. Rest targets are display metadata here; completing a set does not
open a rest timer.

Live rows use Set · Previous · kg/lb · Reps (or Time) · ✓, followed by Add set. RPE sits on an
independent badge at the check: logged effort is visible, empty badges require Show RPE for that
exercise. Tapping a badge or holding the check for 500 ms opens the existing RPE pad. A hold
never completes a set. History editing retains its separate RPE column, notes and disabled check.

Untouched planned weight/reps stay greyed; completion accepts their already-saved values. A
separate amber suggestion is optional and only copied on tap. `ValueSuggestion` uses the cell's
entry unit (seconds for timed cells), so future progression can supply the same slot. Generated
warm-ups use their existing planned values as suggestions; generation and protected-row rules
remain in WorkoutCore. Entered/accepted styling is local to the mounted editor; reopening safely
shows saved planned values as greyed again. Suggested warm-up identity after reload follows the
existing conservative core provenance rules.

Warm-ups use an explicit purple surface across the whole row with a hairline before the first
working row. Set labels are W (purple), normal-set numbers, D (accent), F (bad-status red).
The menu lists only existing capabilities: session note, warm-ups, rest target, Show RPE, kg/lb,
move and remove. Sticky notes, replacement and superset editing have no live operation yet.

Heuristic layout tokens: `--workout-tap-size: 44px`, `--workout-weight-width: 88px`,
`--workout-reps-width: 76px` keep headers aligned with rows at 430 px, including suggestions.
`--font-input: 400 16px/1.4 var(--font-family)` avoids Safari focus zoom in note inputs.


## Long-range charts

`LongRangeChart` is the shared period chart for Measure and future entity pages. Its small view shows all recorded history: daily buckets through 92 elapsed days, ISO weeks through 730 days, and calendar months beyond. A caller chooses mean (measurements and session totals), maximum (strength), last, or sum (session counts). Plan frequency fixes the overview to ISO weeks; its expanded view uses the usual finer automatic periods. Sum charts omit the per-observation spread band, which does not describe a total. Period boundaries use the phone's local calendar; missing periods are not filled. The 2 px line shows the aggregate (PR progression uses a step-after line), with a faint min–max band only where buckets contain multiple observations. A single populated bucket retains a dot and a narrow spread mark. Paired parts use independent named series on one axis; legend text stays in ink colors.

Tap the chart to open a full-screen native dialog with a plot at 60% of viewport height, with safe-area padding, a Close button and Escape support. Range chips are 3M, 6M, 1Y and All, anchored to the latest recorded observation so older history remains readable. Month subtraction clamps at month ends. Full-screen periods are one step finer (month → week, week → day); daily is the floor. Touch/arrow-key selection uses the shared rule and reads out all series at that period, including value, min, max and count. Each view offers a table of the same buckets. Range selection clips observations before aggregation, so boundary buckets contain only observations inside the chosen window.

Measure uses grouped body-part rows with latest values on the right and separate + targets. Never-recorded parts appear only in Add body part; selecting one opens the existing log sheet and a first saved entry reveals it. Creating a custom part opens its page immediately for logging. Bodyweight is excluded from this navigation without changing its data. Body-part pages share the Chart · History segmented control; History includes both states, newest first.


## Plans and workouts

Visible wording uses **Plan** for a saved template folder, **Workout** for a saved template, and **Session** for a finished History entry. Storage and internal code names stay unchanged.

The Workout tab keeps Start empty workout first. Plans are separate navigation cards with a name, workout count, workout names and latest finished-session date; the card menu keeps rename, reorder and delete. Other workouts follow below. A plan opens `/workout/plans/:folderId`, with a Workout back link and management menu. Unknown/deleted ids return to Workout.

Plan pages use Workouts · History · Analytics. Workouts are ordered cards with an exercise summary, last done and management menu. + Workout opens the existing editor with that plan selected. History links every finished session in the current plan to History. Analytics shows weekly session sums, mean session volume and mean known duration, followed by a per-workout table including never-performed workouts.

Workout sheets have a title, Edit and Close, description (or Add a description), Last performed, and Exercises · History · Analytics. The body scrolls independently of the pinned Start workout footer and respects the bottom safe area. Exercise rows retain targets and add sets × name and main muscles, including archived exercise metadata. Analytics uses mean session volume/duration and best per-session e1RM for the first saved exercise, named explicitly. Missing estimates and unknown durations remain absent. History keeps separate sessions even on the same day.



## Exercise page (T-057)

Exercises open a Summary · History · Charts · Records · How-to segmented control. The `tab` URL parameter preserves the section through browser Back; unknown values open Summary. Each section mounts its own data query when opened. The five labels stay on one line with horizontal overflow on narrower displays, using the shared control and existing theme tokens.

Summary keeps primary/secondary muscle chips, equipment and traits, usage dates/counts, the existing smoothed e1RM headline, loading preferences and the existing Edit/actions. History shows finished sessions newest first, including repeated exercise entries and all completed set kinds with their recorded load, reps or seconds and RPE. Each session links to its History entry. Older/newer controls keep at most 200 sessions mounted.

Charts use `LongRangeChart` and its expansion, range picker and table. Best qualifying e1RM, heaviest load and best reps use maximum buckets. Working-set volume uses mean buckets explicitly labelled per session. PR progression retains the running e1RM maximum at each qualifying session. Timed tracking shows longest duration; loaded duration also shows heaviest load. Bodyweight tracking shows reps without inventing total mass. Each applicable series with fewer than two sessions is replaced by one explanatory line.

Records show dated lifetime e1RM, heaviest load (with reps and recorded effort) and session volume. The 1–12-rep table uses the heaviest actual set achieving at least the row's reps, even without effort data. Predictions invert the canonical e1RM formula at RIR 0, from the best qualifying estimate, with shared estimate display rounding (0.5 kg / 1 lb); absent performances do not hide predictions. Unclassified exercises retain actual records but have no predictions. Reps and duration charts are the alternatives for unsupported weight records.

How-to defers the existing preference-controlled pictures until opened and retains bundled numbered instructions. Missing instructions read “No instructions for this exercise.”

## Deload (T-062)

The live exercise and workout menus offer **Deload this exercise** and **Deload whole workout** in
`--color-deload` (dark `#F4BF50`, light `#946000`, a legible yellow/ochre). A yellow **Deload · −20%**
chip on the exercise info line opens **End deload**. The percent is nominal, before loadable rounding;
bodyweight shows **Deload** without a load percentage. History shows a small noninteractive Deload tag.

Deload values occupy the existing amber suggestion slot in place of progression. The previous saved
values remain grey and ticking still uses them; only tapping amber or typing changes a value.
Entered and completed cells hide amber. Deload suggestions may reappear on reopening the editor,
including equal values; they remain opt-in. Timed rows do not suggest a rep value as seconds.

`LongRangeChart.marks` optionally accepts `{ date, kind: 'deload' }`. Marks use the existing core
calendar buckets and range clipping. A populated bucket containing a deload session gets a hollow
yellow-edged point and a faint yellow column. Overview and expanded plots include a text explanation,
the touch readout names Deload, and marked table rows have a Deload note. Exercise performance plots
pass these dates. The PR step line retains its existing appearance and still counts all sessions.

### Analytics tab

Overview and Muscles share whole Monday-week period chips (4W, 12W, 6M, 1Y, All). Overview shows weekly totals and previous-period changes, the recent versus baseline card, workout frequency, and ranked lift trends. Deloads count in totals and are marked on frequency charts but excluded from lift trends. Muscles retains its week selector and uses the selected period for history.


The tab bar is Workout, Exercises, Measure, Analytics and Settings. The Workout header links to full History. Plan cards highlight during a held drag; a lifted label follows the finger.
