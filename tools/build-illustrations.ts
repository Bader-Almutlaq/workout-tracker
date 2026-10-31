import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExerciseLibrary } from '../src/core/library/ExerciseLibrary';

/** A source entry's stable, zero-padded image identifier. */
export interface IllustrationSource {
  readonly id_num: string;
}

/** A reviewed decision for one source illustration. */
export type IllustrationDecision =
  { readonly action: 'match'; readonly libraryKey: string } | { readonly action: 'skip'; readonly reason: string };

/** Generates the bundled lookup after checking source coverage and library keys. */
export function buildIllustrations(
  source: readonly IllustrationSource[],
  decisions: Readonly<Record<string, IllustrationDecision>>,
  libraryKeys: readonly string[],
): string {
  const keys = new Set(libraryKeys);
  const seen = new Set<string>();
  const matches = new Map<string, string>();
  for (const entry of source.toSorted((a, b) => (a.id_num < b.id_num ? -1 : a.id_num > b.id_num ? 1 : 0))) {
    if (!/^\d{4}$/.test(entry.id_num)) throw new Error(`Invalid source id: ${entry.id_num}`);
    if (seen.has(entry.id_num)) {
      if (decisions[entry.id_num]?.action !== 'skip')
        throw new Error(`Duplicate source id must be skipped: ${entry.id_num}`);
      continue;
    }
    seen.add(entry.id_num);
    const decision = decisions[entry.id_num];
    if (decision === undefined) throw new Error(`Missing decision: ${entry.id_num}`);
    if (decision.action === 'skip') {
      if (!decision.reason.trim()) throw new Error(`Missing skip reason: ${entry.id_num}`);
      continue;
    }
    if (decision.action !== 'match' || !keys.has(decision.libraryKey))
      throw new Error(`Invalid match: ${entry.id_num}`);
    if (matches.has(decision.libraryKey)) throw new Error(`Duplicate library key: ${decision.libraryKey}`);
    matches.set(decision.libraryKey, entry.id_num);
  }
  for (const id of Object.keys(decisions)) if (!seen.has(id)) throw new Error(`Stale decision: ${id}`);
  return `${JSON.stringify(Object.fromEntries([...matches].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))), null, 2)}\n`;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // The committed inputs are validated by buildIllustrations before output is written.
  const source = JSON.parse(readFileSync('data/sources/everkinetic/exercises.json', 'utf8')) as IllustrationSource[];
  // Each decision is checked against the source and expanded library.
  const decisions = JSON.parse(readFileSync('data/sources/illustration-mapping.json', 'utf8')) as Record<
    string,
    IllustrationDecision
  >;
  writeFileSync(
    'src/core/library/illustrations.json',
    buildIllustrations(
      source,
      decisions,
      ExerciseLibrary.bundled().exercises.map((exercise) => exercise.key),
    ),
  );
}
