import { useState } from 'react';
import { DeloadPlan, type DeloadMode, type DeloadSettings, type DeloadStage } from '../../../core/logging/DeloadPlan';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { KILOGRAMS_PER_POUND } from '../../../core/units/WeightUnit';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import styles from './DeloadSheet.module.css';

/** Owner-selected deload settings for one entry or the whole workout. */
export function DeloadSheet({
  entry,
  onClose,
  onSave,
  onEnd,
}: {
  readonly entry?: LiveWorkoutEntry;
  readonly onClose: () => void;
  readonly onSave: (settings: DeloadSettings, targetSets?: number) => void;
  readonly onEnd?: () => void;
}) {
  const stage: DeloadStage = entry?.entry.deloadStage ?? 1;
  const active = entry?.entry.deloadStage !== null && entry?.entry.deloadStage !== undefined;
  const [mode, setMode] = useState<DeloadMode>(entry?.entry.deloadMode ?? 'load');
  const current = entry?.sets.filter((set) => set.kind !== 'warmup').length ?? 0;
  const savedPercent = entry?.entry.deloadSetPercent ?? null;
  const total = savedPercent === null ? current : Math.max(current, Math.round(current / (1 - savedPercent / 100)));
  const [keep, setKeep] = useState(active && savedPercent !== null ? current : DeloadPlan.keptSets(total));
  const defaultLoad =
    entry === undefined
      ? 10
      : DeloadPlan.reductionPercent(entry.exercise, stage, {
          mode: 'load',
          loadPercent: entry.entry.deloadLoadPercent ?? null,
          setPercent: null,
        });
  const [load, setLoad] = useState(defaultLoad || 10);
  const [setPercent, setSetPercent] = useState(50);
  const [custom, setCustom] = useState(false);
  const tracksWeight =
    entry === undefined || entry.exercise.tracking === 'weight-reps' || entry.exercise.tracking === 'weight-duration';
  const first = entry?.sets.find((set) => set.kind !== 'warmup');
  const suggested =
    entry === undefined || first === undefined
      ? null
      : DeloadPlan.suggestions(
          entry.previous,
          [first],
          entry.exercise,
          stage,
          first.entryUnit,
          entry.deload?.baseline ?? entry.previous,
          {
            mode: 'load',
            loadPercent: stage === 2 ? load * 2 : load,
            setPercent: null,
          },
        )[0]?.weightKilograms;
  const shownWeight =
    suggested === null || suggested === undefined || first === undefined
      ? ''
      : ` · ${Number((first.entryUnit === 'lb' ? suggested / KILOGRAMS_PER_POUND : suggested).toFixed(2))} ${first.entryUnit}`;
  return (
    <BottomSheet title={entry === undefined ? 'Deload workout' : `Deload ${entry.exercise.name}`} onClose={onClose}>
      {entry !== undefined && (
        <p>
          {stage === 2
            ? 'Building back'
            : mode === 'sets'
              ? 'Next time is a normal session.'
              : 'Lighter session. Next time builds back halfway.'}
        </p>
      )}
      <p>Reduce</p>
      <SegmentedControl
        label="Reduce"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'load', label: 'Weight' },
          { value: 'sets', label: 'Sets' },
          { value: 'both', label: 'Both' },
        ]}
      />
      {mode !== 'sets' &&
        (tracksWeight ? (
          <>
            {entry === undefined && (
              <SegmentedControl
                label="Weight choice"
                value={custom ? 'custom' : 'suggested'}
                onChange={(value) => setCustom(value === 'custom')}
                options={[
                  { value: 'suggested', label: 'Suggested per exercise' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            )}
            {(entry !== undefined || custom) && (
              <div className={styles.stepper}>
                <button
                  type="button"
                  aria-label="Decrease weight reduction"
                  onClick={() => setLoad(Math.max(5, load - 5))}
                >
                  −
                </button>
                <span>
                  −{load}%{shownWeight}
                </span>
                <button
                  type="button"
                  aria-label="Increase weight reduction"
                  onClick={() => setLoad(Math.min(50, load + 5))}
                >
                  +
                </button>
              </div>
            )}
          </>
        ) : (
          <p>Bodyweight has no weight reduction.</p>
        ))}
      {mode !== 'load' &&
        (entry === undefined ? (
          <div className={styles.stepper}>
            <button
              type="button"
              aria-label="Decrease sets reduction"
              onClick={() => setSetPercent(Math.max(5, setPercent - 5))}
            >
              −
            </button>
            <span>−{setPercent}% sets</span>
            <button
              type="button"
              aria-label="Increase sets reduction"
              onClick={() => setSetPercent(Math.min(95, setPercent + 5))}
            >
              +
            </button>
          </div>
        ) : (
          <div className={styles.stepper}>
            <button type="button" aria-label="Keep fewer sets" onClick={() => setKeep(Math.max(1, keep - 1))}>
              −
            </button>
            <span>
              Keep {keep} of {total} sets
            </span>
            <button type="button" aria-label="Keep more sets" onClick={() => setKeep(Math.min(current, keep + 1))}>
              +
            </button>
          </div>
        ))}
      <Button
        variant="primary"
        onPress={() =>
          onSave(
            {
              mode,
              loadPercent: entry === undefined && !custom ? null : stage === 2 ? load * 2 : load,
              setPercent:
                mode === 'load' ? null : entry === undefined ? setPercent : total > 0 ? (1 - keep / total) * 100 : 0,
            },
            entry === undefined || mode === 'load' ? undefined : keep,
          )
        }
      >
        {active ? 'Save' : 'Start deload'}
      </Button>
      {active && onEnd !== undefined && (
        <button type="button" className={styles.end} onClick={onEnd}>
          End deload
        </button>
      )}
      <Button onPress={onClose}>Cancel</Button>
    </BottomSheet>
  );
}
