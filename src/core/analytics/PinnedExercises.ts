import type { Database } from '../db/Database';

/** A pinned exercise in display order, with its original pin timestamp. */
export interface PinnedExercise {
  readonly exerciseId: number;
  readonly position: number;
  readonly pinnedAt: string;
}

/** Persistent ordered exercise pins; duplicate pins and moves past either end do nothing. */
export const PinnedExercises = {
  /** Returns pins in stable display order. */
  list(db: Database): PinnedExercise[] {
    return db.all<PinnedExercise>(
      'SELECT exerciseId, position, pinnedAt FROM pinnedExercise ORDER BY position, pinnedAt, exerciseId',
    );
  },
  /** Pins an exercise at the end without changing an existing pin. */
  pin(db: Database, exerciseId: number, now: Date = new Date()): void {
    db.run(
      `INSERT OR IGNORE INTO pinnedExercise (exerciseId, position, pinnedAt)
      VALUES (?, (SELECT COALESCE(MAX(position) + 1, 0) FROM pinnedExercise), ?)`,
      [exerciseId, now.toISOString()],
    );
  },
  /** Removes a pin if it exists. */
  unpin(db: Database, exerciseId: number): void {
    db.run('DELETE FROM pinnedExercise WHERE exerciseId = ?', [exerciseId]);
  },
  /** Moves one pin one place in either direction, retaining all pin timestamps. */
  move(db: Database, exerciseId: number, direction: 'up' | 'down'): void {
    db.transaction(() => {
      const pins = PinnedExercises.list(db);
      const index = pins.findIndex((pin) => pin.exerciseId === exerciseId);
      const other = index + (direction === 'up' ? -1 : 1);
      if (index < 0 || other < 0 || other >= pins.length) return;
      const selected = pins[index];
      const neighbor = pins[other];
      if (selected === undefined || neighbor === undefined) return;
      pins[index] = neighbor;
      pins[other] = selected;
      pins.forEach((pin, position) =>
        db.run('UPDATE pinnedExercise SET position = ? WHERE exerciseId = ?', [position, pin.exerciseId]),
      );
    });
  },
} as const;
