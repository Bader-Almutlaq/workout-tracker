import { useRef, useState, type ChangeEvent } from 'react';
import { makeImportOptions, type StrongImportOptions } from '../../../core/import/StrongImportOptions';
import type { StrongImportPlan } from '../../../core/import/StrongImportPlan';
import type { ImportResult } from '../../../core/import/StrongImporter';
import { log } from '../../../core/support/log';
import { toKilograms } from '../../../core/units/Weight';
import { database, messageOf } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { Screen } from '../../design/components/Screen';
import { weightNumberText } from '../../format/weightText';
import { CorrectSetDialog } from './CorrectSetDialog';
import { correction, type FindingItem } from './importFindingText';
import { ImportPickStep } from './ImportPickStep';
import { ImportResultStep } from './ImportResultStep';
import { ImportReviewStep } from './ImportReviewStep';
import { ImportWorkingOverlay } from './ImportWorkingOverlay';

type Phase = 'pick' | 'working' | 'review' | 'result' | 'failed';
/** Pick supported workout CSVs, review their units and suspicious sets, and import them. */
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
      log.import.error('Workout import failed', error);
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
  const edit = (item: FindingItem) => {
    setEditing(item);
    setWeight(weightNumberText(item.context.set.weightKilograms, item.context.set.entryUnit).replaceAll(',', ''));
    setReps(String(item.context.set.reps));
    setMessage('');
  };
  const runImport = () => {
    if (plan === undefined) return;
    void work(`Importing ${plan.totals.workouts.toLocaleString()} workouts…`, async () => {
      const counts = await database.runStrongImport(options);
      setResult(counts);
      setPhase('result');
    });
  };
  return (
    <Screen
      title="Import workouts"
      leading={phase === 'working' ? undefined : <BackLink to="/settings" label="Settings" />}
    >
      <input ref={input} type="file" accept=".csv,text/csv" multiple hidden onChange={pick} />
      {(phase === 'pick' || phase === 'failed') && (
        <ImportPickStep failed={phase === 'failed'} message={message} choose={() => input.current?.click()} />
      )}
      {phase === 'working' && <ImportWorkingOverlay message={message} />}
      {phase === 'review' && plan !== undefined && (
        <ImportReviewStep
          plan={plan}
          options={options}
          review={review}
          apply={apply}
          keep={keep}
          edit={edit}
          runImport={runImport}
        />
      )}
      {phase === 'result' && result !== undefined && <ImportResultStep result={result} />}
      {editing !== undefined && (
        <CorrectSetDialog
          editing={editing}
          weight={weight}
          reps={reps}
          message={message}
          setWeight={setWeight}
          setReps={setReps}
          cancel={() => setEditing(undefined)}
          save={saveEdit}
        />
      )}
    </Screen>
  );
}
