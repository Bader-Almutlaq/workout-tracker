import type { SetKind } from '../../../core/models/SetKind';
import type { TemplateSetDraft } from '../../../core/templates/TemplateDraft';
import { targetText } from './targetText';

const KIND_NOUNS: Readonly<Record<SetKind, string>> = {
  working: 'set',
  warmup: 'warm-up set',
  drop: 'drop set',
  failure: 'failure set',
};

const KIND_TAGS: Readonly<Record<SetKind, string>> = {
  working: '',
  warmup: ' (warm-up)',
  drop: ' (drop)',
  failure: ' (failure)',
};

function runText(kind: SetKind, target: string, count: number): string {
  if (target === '') return `${count} ${KIND_NOUNS[kind]}${count === 1 ? '' : 's'}`;
  return `${count === 1 ? '' : `${count} × `}${target}${KIND_TAGS[kind]}`;
}

/**
 * An exercise's sets in a line, with neighbours that are alike joined into one run:
 * "1 warm-up set · 3 × 8–12 @ RPE 8 · 1 failure set". Sets without targets are only counted, and a
 * run of one shows just its target ("8–12 @ RPE 8").
 */
export function setRunsText(sets: readonly TemplateSetDraft[], isTimed = false): string {
  const runs: { kind: SetKind; target: string; count: number }[] = [];
  for (const set of sets) {
    const target = targetText(set, isTimed);
    const last = runs.at(-1);
    if (last !== undefined && last.kind === set.kind && last.target === target) last.count += 1;
    else runs.push({ kind: set.kind, target, count: 1 });
  }
  return runs.map((run) => runText(run.kind, run.target, run.count)).join(' · ');
}
