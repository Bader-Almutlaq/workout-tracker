# Design system

Inspired by Linear: calm, dense, precise. Designed dark-first, with a full light theme; it follows the phone's appearance setting. Near-black layered surfaces, hairline borders instead of shadows, one indigo accent, and a type scale that carries hierarchy without extra decoration. Numbers are the content, so they get the best typography.

Tokens live in `App/DesignSystem/`. Views use tokens only, never raw colors, font sizes or paddings.

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

**Status** (always paired with an icon and a label, never color alone): good `#0CA30C`, warning `#FAB219`, serious `#EC835A`, critical `#D03B3B`.

## Typography

System font (SF Pro). Hierarchy comes from size and weight, never color alone.

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
- Motion: 150–200 ms ease-out, no bounces. Haptics only on set completion and timer end.

## Charts

Charts follow the data-viz method used for this project. Its rules: pick the form first; color by job; thin marks; one y-axis; legends for two or more series; text in ink colors, never series colors.

- **Single-series trends** (e1RM, bodyweight): the smoothed trend is a 2 pt `accent` line. Raw session values are 6–8 pt dots at 35% opacity, so the noise is visible but quiet. The title names the series, so there's no legend.
- **Interaction:** touch-and-drag shows a vertical rule with a value readout (Swift Charts `chartXSelection`). This replaces hover on a phone.

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
- Built with Swift Charts only (`LineMark`, `PointMark`, `RuleMark`, `chartXSelection`), with no third-party chart library. Chart math (windows, baselines, % change, range statistics) lives in `WorkoutCore/Analytics`; the view only draws.
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
