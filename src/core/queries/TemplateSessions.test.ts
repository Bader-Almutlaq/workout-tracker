import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { TemplateSessionsFixture } from './fixtures/TemplateSessionsFixture';
import { TemplateSessions } from './TemplateSessions';

let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  TemplateSessionsFixture.seed(db);
});
afterEach(() => db.close());

describe('TemplateSessions', () => {
  test('workout scope keeps same-day sessions separate, newest first, with independent duration', () => {
    const report = TemplateSessions.read(db, { templateId: 1 });
    expect(report.sessions.map((session) => session.id)).toEqual([2, 1]);
    expect(report.sessions.map((session) => session.durationSeconds)).toEqual([null, 3600]);
    expect(report.workouts).toEqual([
      {
        templateId: 1,
        name: 'Workout Alpha',
        sessionCount: 2,
        lastStartedAt: '2024-01-01T17:00:00Z',
        averageDurationSeconds: 3600,
      },
    ]);
  });
  test('volume and counts exclude warm-ups and uncompleted sets, but include drops, failure and low effort', () => {
    const report = TemplateSessions.read(db, { folderId: 1 });
    expect(report.sessions.map((session) => session.id)).toEqual([3, 2, 1]);
    expect(report.sessions.find((session) => session.id === 1)).toMatchObject({
      workingSetCount: 4,
      volumeKilograms: 620,
    });
    expect(report.sessions.find((session) => session.id === 3)).toMatchObject({
      workingSetCount: 1,
      volumeKilograms: 50,
    });
    expect(report.workouts.find((workout) => workout.templateId === 5)).toMatchObject({
      sessionCount: 0,
      lastStartedAt: null,
      averageDurationSeconds: null,
    });
  });
  test('two plans and unfiled scope never leak into each other; active sessions stay out', () => {
    expect(TemplateSessions.read(db, { folderId: 2 }).sessions.map((session) => session.id)).toEqual([4]);
    expect(TemplateSessions.read(db, { templateId: 4 }).sessions.map((session) => session.id)).toEqual([5]);
    expect(TemplateSessions.read(db, { folderId: 1 }).sessions.every((session) => session.id !== 6)).toBe(true);
  });
  test('top exercise is first saved exercise, with the best eligible set across repeated entries in each session', () => {
    const report = TemplateSessions.read(db, { templateId: 1 });
    expect(report.topExercise).toEqual({ id: 1, name: 'Synthetic press' });
    expect(report.sessions.map((session) => session.bestEstimatedOneRepMaxKilograms)).toEqual([60, 70]);
    expect(TemplateSessions.read(db, { folderId: 1 }).topExercise).toBeNull();
  });
  test('missing or never-performed scopes and finished sessions with no sets are supported', () => {
    expect(TemplateSessions.read(db, { folderId: 99 })).toEqual({ sessions: [], workouts: [], topExercise: null });
    expect(TemplateSessions.read(db, { templateId: 99 }).sessions).toEqual([]);
    expect(TemplateSessions.read(db, { templateId: 5 }).sessions).toEqual([]);
    db.exec(`DELETE FROM workoutSet WHERE workoutExerciseId = 1 OR workoutExerciseId = 7 OR workoutExerciseId = 8`);
    expect(TemplateSessions.read(db, { templateId: 1 }).sessions[1]).toMatchObject({
      workingSetCount: 0,
      volumeKilograms: 0,
      bestEstimatedOneRepMaxKilograms: null,
    });
  });
  test('unknown/invalid timing is excluded from the mean, zero duration is retained, and ties use id', () => {
    db.exec(`UPDATE workout SET endedAt = 'invalid' WHERE id = 1`);
    expect(TemplateSessions.read(db, { templateId: 1 }).workouts[0]?.averageDurationSeconds).toBeNull();
    db.exec(`UPDATE workout SET endedAt = '2023-01-01' WHERE id = 1`);
    expect(TemplateSessions.read(db, { templateId: 1 }).sessions[1]?.durationSeconds).toBeNull();
    db.exec(`UPDATE workout SET startedAt = '2024-01-01T17:00:00Z', endedAt = '2024-01-01T17:00:00Z' WHERE id = 1`);
    const report = TemplateSessions.read(db, { templateId: 1 });
    expect(report.sessions.map((session) => session.id)).toEqual([2, 1]);
    expect(report.workouts[0]?.averageDurationSeconds).toBe(0);
  });
  test('membership follows current plan assignments; deleting a workout preserves its History rows', () => {
    db.exec(`UPDATE template SET folderId = 2 WHERE id = 1`);
    expect(TemplateSessions.read(db, { folderId: 1 }).sessions.map((session) => session.id)).toEqual([3]);
    expect(TemplateSessions.read(db, { folderId: 2 }).sessions.map((session) => session.id)).toEqual([4, 2, 1]);
    db.exec(`DELETE FROM template WHERE id = 1`);
    expect(TemplateSessions.read(db, { folderId: 2 }).sessions.map((session) => session.id)).toEqual([4]);
    expect(db.value<number>(`SELECT COUNT(*) FROM workout`)).toBe(6);
  });
});
