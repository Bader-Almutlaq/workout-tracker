import { useState } from 'react';
import { line } from 'd3-shape';
import { Link } from 'react-router';
import { KILOGRAMS_PER_POUND } from '../../../core/units/WeightUnit';
import { log } from '../../../core/support/log';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import styles from './Analytics.module.css';

/** Ordered pinned exercises and history-backed suggestions. */
export function PinnedLifts({ from, to }: { readonly from: string; readonly to: string }) {
  const [error, setError] = useState<string>();
  const query = useDatabaseQuery(`pins-${from}-${to}`, async () => {
    const [pins, entries, ranking] = await Promise.all([
      database.pinnedExercises(),
      database.exerciseEntries(),
      database.strengthRanking(from, to),
    ]);
    const cards = await Promise.all(
      pins.map(async (pin) => ({
        pin,
        detail: await database.exerciseDetail(pin.exerciseId),
        strength: await database.exerciseStrength(pin.exerciseId),
      })),
    );
    const candidates = entries.filter(
      (entry) =>
        ['Squat (Barbell)', 'Bench Press (Barbell)', 'Deadlift (Barbell)'].includes(entry.name) && entry.usageCount > 0,
    );
    const suggestions = (
      await Promise.all(candidates.map(async (entry) => ({ entry, detail: await database.exerciseDetail(entry.id) })))
    )
      .filter(({ detail }) => detail !== null && detail.workoutCount > 0)
      .map(({ entry }) => entry);
    return { cards, suggestions, ranking };
  });
  const act = async (action: () => Promise<void>) => {
    try {
      setError(undefined);
      await action();
    } catch (failure) {
      log.ui.error('Changing pinned lifts failed', failure);
      setError(messageOf(failure));
    }
  };
  return (
    <section>
      <h2>Pinned lifts</h2>
      {error !== undefined && <p role="alert">{error}</p>}
      {query.status === 'failed' && <p role="alert">{query.message}</p>}
      {query.status === 'ready' &&
        (query.value.cards.length === 0 ? (
          <>
            <p>Pin lifts from an exercise's ⋯ menu.</p>
            {query.value.suggestions.map((entry) => (
              <button key={entry.id} type="button" onClick={() => void act(() => database.pinExercise(entry.id))}>
                Pin {entry.name}
              </button>
            ))}
          </>
        ) : (
          <div className={styles.pins}>
            {query.value.cards.map(({ pin, detail, strength }, index) => {
              if (detail === null) return null;
              const lift = query.value.ranking.lifts.find((item) => item.id === pin.exerciseId);
              const values = lift?.points ?? strength.trend.map((point) => point.e1rmKilograms);
              const minimum = Math.min(...values, 0);
              const span = Math.max(...values, 1) - minimum || 1;
              const path =
                line<number>()
                  .x((_, i) => (i * 100) / Math.max(1, values.length - 1))
                  .y((value) => 28 - ((value - minimum) / span) * 26)(values) ?? '';
              const unit = detail.exercise.defaultEntryUnit;
              const value =
                strength.latest === null
                  ? null
                  : unit === 'lb'
                    ? strength.latest / KILOGRAMS_PER_POUND
                    : strength.latest;
              return (
                <article className={styles.pin} key={pin.exerciseId}>
                  <Link to={`/exercises/${pin.exerciseId}?tab=charts`}>{detail.exercise.name}</Link>
                  <p>
                    {value === null ? '—' : `${value.toFixed(1)} ${unit}`}{' '}
                    {lift === undefined
                      ? ''
                      : `· ${lift.changePercent >= 0 ? '+' : ''}${lift.changePercent.toFixed(1)}%`}
                  </p>
                  <svg viewBox="0 0 100 30" aria-hidden="true">
                    <path d={path} fill="none" stroke="currentColor" />
                  </svg>
                  <details>
                    <summary>
                      ⋯<span className="sr-only"> Options</span>
                    </summary>
                    <button type="button" onClick={() => void act(() => database.unpinExercise(pin.exerciseId))}>
                      Unpin
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void act(() => database.movePinnedExercise(pin.exerciseId, 'up'))}
                    >
                      Move left
                    </button>
                    <button
                      type="button"
                      disabled={index === query.value.cards.length - 1}
                      onClick={() => void act(() => database.movePinnedExercise(pin.exerciseId, 'down'))}
                    >
                      Move right
                    </button>
                  </details>
                </article>
              );
            })}
          </div>
        ))}
    </section>
  );
}
