import { describe, expect, test } from 'vitest';
import type { SetKind } from '../../../core/models/SetKind';
import type { TemplateSetDraft } from '../../../core/templates/TemplateDraft';
import { setRunsText } from './setRunsText';

function set(kind: SetKind, low: number | null = null, high: number | null = null, rpe: number | null = null) {
  const result: TemplateSetDraft = { kind, targetRepsLow: low, targetRepsHigh: high, targetRpe: rpe };
  return result;
}

describe('set runs text', () => {
  test('Sets without targets are only counted', () => {
    expect(setRunsText([set('working')])).toBe('1 set');
    expect(setRunsText([set('working'), set('working'), set('working')])).toBe('3 sets');
  });

  test('Neighbouring sets that are alike become one run with their targets', () => {
    const working = set('working', 8, 12, 8);
    expect(setRunsText([working, working, working])).toBe('3 × 8–12 @ RPE 8');
  });

  test('Kinds are named, and a different target starts a new run', () => {
    expect(
      setRunsText([set('warmup'), set('working', 8, 10), set('working', 6, 8), set('failure'), set('drop', 10)]),
    ).toBe('1 warm-up set · 8–10 · 6–8 · 1 failure set · 10 (drop)');
  });

  test('A run of one shows just its target', () => {
    expect(setRunsText([set('working', 8, 12, 8)])).toBe('8–12 @ RPE 8');
  });

  test('Alike sets that are not neighbours stay separate runs', () => {
    expect(setRunsText([set('working'), set('warmup'), set('working')])).toBe('1 set · 1 warm-up set · 1 set');
  });
});
