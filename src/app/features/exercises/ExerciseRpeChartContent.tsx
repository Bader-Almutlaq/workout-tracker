import { useState } from 'react';
import type { WorkerApi } from '../../../worker/WorkerApi';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { weightText } from '../../format/weightText';
import { ExerciseRpeTable } from './ExerciseRpeTable';
import styles from './ExerciseProgress.module.css';

/** Loaded RPE chart with independent guide/load views; default to the load grid whenever an estimate is available. */
export function ExerciseRpeChartContent({
  chart,
  unit,
}: {
  readonly chart: Awaited<ReturnType<WorkerApi['exerciseRpeChart']>>;
  readonly unit: WeightUnit;
}) {
  const available = chart.lift.length > 0 && chart.estimate !== null;
  const [mode, setMode] = useState<'weight' | 'percent'>(available ? 'weight' : 'percent');
  const personal =
    chart.curve?.isPersonal === true
      ? `this lift's curve (learned from ${chart.curve.personalSets} sets)`
      : "this lift's curve (lift-type default)";
  return (
    <section className={styles.chart}>
      <h2>RPE chart</h2>
      <SegmentedControl
        label="RPE chart units"
        value={mode}
        options={[
          { value: 'percent', label: '%' },
          { value: 'weight', label: unit },
        ]}
        onChange={setMode}
      />
      <p className={styles.note}>
        {mode === 'percent'
          ? 'Guide: RTS chart, the same for every lift'
          : chart.estimate === null
            ? 'Log qualifying sets to see weights for this lift.'
            : `From e1RM ${weightText(chart.estimate, unit)} · ${personal}`}
      </p>
      {mode === 'weight' && !available ? (
        <p>No qualifying strength estimate yet.</p>
      ) : (
        <ExerciseRpeTable rows={mode === 'percent' ? chart.guide : chart.lift} mode={mode} unit={unit} />
      )}
      <p className={styles.note}>Muted cells: reps + RIR above 12, lower reliability.</p>
    </section>
  );
}
