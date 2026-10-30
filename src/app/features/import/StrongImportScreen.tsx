import { useRef, useState, type ChangeEvent } from 'react';
import type { StrongImportOptions, SetCorrection } from '../../../core/import/StrongImportOptions';
import { makeImportOptions } from '../../../core/import/StrongImportOptions';
import type { StrongImportPlan, SetContext } from '../../../core/import/StrongImportPlan';
import type { ImportResult } from '../../../core/import/StrongImporter';
import { log } from '../../../core/support/log';
import { toKilograms } from '../../../core/units/Weight';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { SetFinding } from '../../../core/validation/SetPlausibility';
import { database, messageOf } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { Section, SectionRow } from '../../design/components/Section';
import { weightNumberText, weightText } from '../../format/weightText';
import styles from './StrongImportScreen.module.css';

type Phase = 'pick' | 'working' | 'review' | 'result' | 'failed';
interface FindingItem {
  readonly finding: SetFinding;
  readonly context: SetContext;
}
interface FindingGroup {
  readonly key: string;
  readonly date: string;
  readonly name: string;
  readonly items: FindingItem[];
}

/** Pick Strong CSV files, review their units and suspicious sets, and import them. */
export function StrongImportScreen() {
  const [phase, setPhase] = useState<Phase>('pick');
  const [message, setMessage] = useState('');
  const [plan, setPlan] = useState<StrongImportPlan>();
  const [options, setOptions] = useState<StrongImportOptions>(makeImportOptions);
  const [result, setResult] = useState<ImportResult>();
  const [editing, setEditing] = useState<FindingItem>();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  const work = async (label: string, action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setMessage(label);
    setPhase('working');
    try {
      await action();
    } catch (error) {
      log.import.error('Strong import failed', error);
      setMessage(messageOf(error));
      setPhase('failed');
    } finally {
      busy.current = false;
    }
  };
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    void work('Reading and checking files…', async () => {
      const contents = await Promise.all(files.map(async (file) => ({ name: file.name, text: await file.text() })));
      const next = await database.planStrongImport(contents);
      setOptions(makeImportOptions());
      setPlan(next);
      setPhase('review');
    });
  };
  const review = (next: StrongImportOptions) =>
    void work('Updating review…', async () => {
      const updated = await database.reviewStrongImport(next);
      setOptions(next);
      setPlan(updated);
      setPhase('review');
    });
  const keep = (items: readonly FindingItem[]) =>
    review({
      ...options,
      confirmedLines: new Set([...options.confirmedLines, ...items.map((item) => item.finding.id)]),
    });
  const apply = (items: readonly FindingItem[]) => {
    const corrections = new Map(options.corrections);
    const confirmedLines = new Set(options.confirmedLines);
    for (const { finding } of items) {
      if (finding.suggestion === null) confirmedLines.add(finding.id);
      else corrections.set(finding.id, correction(finding, finding.suggestion));
    }
    review({ ...options, corrections, confirmedLines });
  };
  const saveEdit = () => {
    if (editing === undefined) return;
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    if (
      weight.trim() === '' ||
      reps.trim() === '' ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 0 ||
      !Number.isInteger(parsedReps) ||
      parsedReps < 0
    ) {
      setMessage('Enter a non-negative weight and a whole number of reps.');
      return;
    }
    const corrections = new Map(options.corrections);
    corrections.set(editing.finding.id, {
      weightKilograms: toKilograms(parsedWeight, editing.context.set.entryUnit),
      reps: parsedReps,
    });
    setEditing(undefined);
    setMessage('');
    review({ ...options, corrections });
  };
  const groups = plan === undefined ? [] : groupFindings(plan);
  const poundExercises =
    plan?.exercises.filter((exercise) => exercise.columnUnit === 'lb' || exercise.isOverridden) ?? [];
  return (
    <Screen
      title="Import from Strong"
      leading={phase === 'working' ? undefined : <BackLink to="/settings" label="Settings" />}
    >
      <input ref={input} type="file" accept=".csv,text/csv" multiple hidden onChange={pick} />
      {phase === 'pick' && (
        <>
          <p className={styles.description}>
            In Strong: Settings → Export Data. Save the files to Files, then select all of them here: the workouts file
            and any measurement files.
          </p>
          <p className={styles.note}>Nothing is saved until you've reviewed the import.</p>
          <button className={styles.primary} onClick={() => input.current?.click()}>
            Choose files…
          </button>
        </>
      )}
      {phase === 'working' && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          {message}
        </div>
      )}
      {phase === 'failed' && (
        <>
          <EmptyState message={`Import didn't work. ${message}`} />
          <button className={styles.primary} onClick={() => input.current?.click()}>
            Choose files again
          </button>
        </>
      )}
      {phase === 'review' && plan !== undefined && (
        <>
          <Section label="What will be imported">
            <SectionRow label="Workouts" value={plan.totals.workouts.toLocaleString()} />
            <SectionRow
              label="Sets"
              value={`${plan.totals.sets.toLocaleString()} (${plan.totals.workSets.toLocaleString()} excluding warm-ups)`}
            />
            <SectionRow label="Exercises" value={plan.exercises.length.toLocaleString()} />
            <SectionRow label="Dates" value={dateRange(plan)} />
            {plan.measurements.length > 0 && (
              <SectionRow label="Body measurements" value={plan.measurements.length.toLocaleString()} />
            )}
          </Section>
          {poundExercises.length > 0 && (
            <Section
              label="Exercises Strong exported in pounds"
              footnote="Strong exports each exercise in the unit it's set to now. These were detected as pounds and will be converted to kg. Switch one back if it's wrong."
            >
              {poundExercises.map((exercise) => (
                <div className={styles.unitRow} key={exercise.name}>
                  <div>
                    {exercise.name}
                    <p className={styles.note}>{exercise.setCount} sets</p>
                  </div>
                  <select
                    aria-label={`Unit for ${exercise.name}`}
                    value={exercise.columnUnit}
                    onChange={(event) => {
                      const unit: WeightUnit = event.target.value === 'lb' ? 'lb' : 'kg';
                      const unitOverrides = new Map(options.unitOverrides);
                      unitOverrides.set(exercise.name, unit);
                      review({ ...options, unitOverrides });
                    }}
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              ))}
            </Section>
          )}
          <section>
            <div className={styles.heading}>
              <h2>Check these sets ({plan.findings.length})</h2>
              {options.corrections.size + options.confirmedLines.size > 0 && (
                <button className={styles.link} onClick={() => review(makeImportOptions())}>
                  Reset {options.corrections.size + options.confirmedLines.size} decisions
                </button>
              )}
            </div>
            {groups.length === 0 ? (
              <p className={styles.description}>Nothing looks like a typo.</p>
            ) : (
              <p className={styles.note}>
                These differ a lot from the same exercise in nearby sessions: maybe a missed digit, an extra zero or the
                wrong unit.
              </p>
            )}
            {groups.map((group) => (
              <div className={styles.card} key={group.key}>
                <div className={styles.cardHeader}>
                  <strong>{group.name}</strong>
                  <p className={styles.note}>{dateText(group.date)}</p>
                </div>
                {group.items.map((item) => (
                  <div className={styles.finding} key={`${item.finding.id}-${item.finding.issue}`}>
                    <div className={styles.findingText}>
                      <span>
                        {weightText(item.context.set.weightKilograms, item.context.set.entryUnit)} ×{' '}
                        {item.context.set.reps}
                      </span>
                      <span>⚠ {explanation(item)}</span>
                    </div>
                    <div className={styles.buttons}>
                      {item.finding.suggestion !== null && (
                        <button onClick={() => apply([item])}>Use {suggestionText(item)}</button>
                      )}
                      <button onClick={() => keep([item])}>Keep</button>
                      <button
                        onClick={() => {
                          setEditing(item);
                          setWeight(
                            weightNumberText(item.context.set.weightKilograms, item.context.set.entryUnit).replaceAll(
                              ',',
                              '',
                            ),
                          );
                          setReps(String(item.context.set.reps));
                          setMessage('');
                        }}
                      >
                        Edit…
                      </button>
                    </div>
                  </div>
                ))}
                {group.items.length > 1 && (
                  <div className={styles.buttons}>
                    <button onClick={() => keep(group.items)}>Keep all as logged</button>
                    {group.items.some((item) => item.finding.suggestion !== null) && (
                      <button onClick={() => apply(group.items)}>Use suggestions</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
          <div>
            <button
              className={styles.primary}
              onClick={() =>
                void work(`Importing ${plan.totals.workouts.toLocaleString()} workouts…`, async () => {
                  const counts = await database.runStrongImport(options);
                  setResult(counts);
                  setPhase('result');
                })
              }
            >
              Import {plan.totals.workouts.toLocaleString()} workouts
            </button>
            {plan.findings.length > 0 && <p className={styles.note}>Sets you haven't reviewed import as logged.</p>}
          </div>
        </>
      )}
      {phase === 'result' && result !== undefined && (
        <>
          <h2 className={styles.result}>✓ Import complete</h2>
          <Section label="Imported">
            <SectionRow label="Workouts added" value={result.workoutsAdded.toLocaleString()} />
            <SectionRow label="Already imported" value={result.workoutsSkipped.toLocaleString()} />
            <SectionRow label="Sets added" value={result.setsAdded.toLocaleString()} />
            <SectionRow label="Exercises created" value={result.exercisesCreated.toLocaleString()} />
            <SectionRow label="Body measurements added" value={result.measurementsAdded.toLocaleString()} />
          </Section>
          <BackLink to="/settings" label="Done" />
        </>
      )}
      {editing !== undefined && (
        <div className={styles.overlay}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="correct-title">
            <h2 id="correct-title">Correct this set</h2>
            <p className={styles.note}>Leave a field as is to keep the logged value.</p>
            <label>
              Weight ({editing.context.set.entryUnit})
              <input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
            <label>
              Reps
              <input inputMode="numeric" value={reps} onChange={(event) => setReps(event.target.value)} />
            </label>
            {message && <p role="alert">{message}</p>}
            <div className={styles.buttons}>
              <button onClick={() => setEditing(undefined)}>Cancel</button>
              <button onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

function groupFindings(plan: StrongImportPlan): FindingGroup[] {
  const groups = new Map<string, FindingGroup>();
  for (const finding of plan.findings) {
    const context = plan.setsByLine.get(finding.id);
    if (context === undefined) continue;
    const key = JSON.stringify([context.workoutStartedAt, context.exerciseName]);
    let group = groups.get(key);
    if (group === undefined) {
      group = { key, date: context.workoutStartedAt, name: context.exerciseName, items: [] };
      groups.set(key, group);
    }
    group.items.push({ finding, context });
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
function correction(finding: SetFinding, value: number): SetCorrection {
  return finding.issue === 'weightTooHigh' || finding.issue === 'weightTooLow'
    ? { weightKilograms: value }
    : { reps: Math.round(value) };
}
function dateText(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function dateRange(plan: StrongImportPlan): string {
  return plan.totals.firstDate === null || plan.totals.lastDate === null
    ? '—'
    : `${dateText(plan.totals.firstDate)} – ${dateText(plan.totals.lastDate)}`;
}
function explanation(item: FindingItem): string {
  const { finding, context } = item;
  if (finding.issue === 'zeroReps') return '0 reps';
  if (finding.issue === 'repsTooHigh') return `usually ~${Math.round(finding.typical)} reps`;
  return `usually ~${weightText(finding.typical, context.set.entryUnit)}`;
}
function suggestionText(item: FindingItem): string {
  const value = item.finding.suggestion;
  if (value === null) return '';
  return item.finding.issue === 'weightTooHigh' || item.finding.issue === 'weightTooLow'
    ? weightText(value, item.context.set.entryUnit)
    : `${Math.round(value)} reps`;
}
