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
  const [slotOrder, setSlotOrder] = useState<readonly number[]>([]);
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
        (query.value.cards.length === 0 && query.value.suggestions.length === 0 ? (
          <p>No pinned lifts</p>
        ) : (
          <div className={styles.pins}>
            {[
              ...query.value.suggestions,
              ...query.value.cards
                .filter(({ pin }) => !query.value.suggestions.some((entry) => entry.id === pin.exerciseId))
                .map(({ pin, detail }) => ({ id: pin.exerciseId, name: detail?.exercise.name ?? '' })),
            ]
              .sort((left, right) => {
                const leftIndex = slotOrder.indexOf(left.id);
                const rightIndex = slotOrder.indexOf(right.id);
                return (
                  (leftIndex < 0 ? slotOrder.length : leftIndex) - (rightIndex < 0 ? slotOrder.length : rightIndex)
                );
              })
              .map((entry) => {
                const card = query.value.cards.find(({ pin }) => pin.exerciseId === entry.id);
                if (card === undefined) {
                  return (
                    <button
                      className={styles.suggestionSlot}
                      key={entry.id}
                      type="button"
                      onClick={() => void act(() => database.pinExercise(entry.id))}
                    >
                      + {entry.name}
                    </button>
                  );
                }
                const { pin, detail, strength } = card;
                if (detail === null) return null;
                const index = query.value.cards.findIndex((item) => item.pin.exerciseId === pin.exerciseId);
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
                      {lift !== undefined && (
                        <span
                          className={
                            lift.changePercent > 0 ? styles.good : lift.changePercent < 0 ? styles.bad : styles.neutral
                          }
                        >
                          {lift.changePercent >= 0 ? '+' : ''}
                          {lift.changePercent.toFixed(1)}%
                        </span>
                      )}
                    </p>
                    <svg viewBox="0 0 100 30" aria-hidden="true">
                      <path d={path} fill="none" stroke="currentColor" />
                      {values.length > 0 && (
                        <circle
                          cx={values.length === 1 ? 0 : 100}
                          cy={28 - (((values.at(-1) ?? minimum) - minimum) / span) * 26}
                          r="2.5"
                          fill="currentColor"
                        />
                      )}
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
                        onClick={() =>
                          void act(async () => {
                            await database.movePinnedExercise(pin.exerciseId, 'up');
                            const ids = [
                              ...query.value.suggestions.map((item) => item.id),
                              ...query.value.cards
                                .map((item) => item.pin.exerciseId)
                                .filter((id) => !query.value.suggestions.some((item) => item.id === id)),
                            ];
                            const ordered = ids.sort(
                              (a, b) =>
                                (slotOrder.indexOf(a) < 0 ? slotOrder.length : slotOrder.indexOf(a)) -
                                (slotOrder.indexOf(b) < 0 ? slotOrder.length : slotOrder.indexOf(b)),
                            );
                            const other = query.value.cards[index - 1]?.pin.exerciseId;
                            if (other !== undefined)
                              setSlotOrder(
                                ordered.map((id) =>
                                  id === other ? pin.exerciseId : id === pin.exerciseId ? other : id,
                                ),
                              );
                          })
                        }
                      >
                        Move left
                      </button>
                      <button
                        type="button"
                        disabled={index === query.value.cards.length - 1}
                        onClick={() =>
                          void act(async () => {
                            await database.movePinnedExercise(pin.exerciseId, 'down');
                            const ids = [
                              ...query.value.suggestions.map((item) => item.id),
                              ...query.value.cards
                                .map((item) => item.pin.exerciseId)
                                .filter((id) => !query.value.suggestions.some((item) => item.id === id)),
                            ];
                            const ordered = ids.sort(
                              (a, b) =>
                                (slotOrder.indexOf(a) < 0 ? slotOrder.length : slotOrder.indexOf(a)) -
                                (slotOrder.indexOf(b) < 0 ? slotOrder.length : slotOrder.indexOf(b)),
                            );
                            const other = query.value.cards[index + 1]?.pin.exerciseId;
                            if (other !== undefined)
                              setSlotOrder(
                                ordered.map((id) =>
                                  id === other ? pin.exerciseId : id === pin.exerciseId ? other : id,
                                ),
                              );
                          })
                        }
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
