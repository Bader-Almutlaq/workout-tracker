import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ExerciseLibrary } from '../src/core/library/ExerciseLibrary';
import { ExerciseLibraryError } from '../src/core/library/ExerciseLibraryError';
import { parseLibraryFile, type LibraryFamily, type LibraryVariant } from '../src/core/library/LibraryFile';
import type { Equipment } from '../src/core/library/Equipment';
import type { Muscle } from '../src/core/library/Muscle';
import type { MovementPattern } from '../src/core/library/MovementPattern';
import type { ExerciseTracking } from '../src/core/library/ExerciseTracking';
import type { Mechanic } from '../src/core/library/Mechanic';

/** Fields consumed from the pinned, public-domain free-exercise-db JSON. */
export interface SourceExercise {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly equipment: string | null;
  readonly mechanic: string | null;
  readonly primaryMuscles: readonly string[];
  readonly secondaryMuscles: readonly string[];
  readonly instructions: readonly string[];
  readonly images: readonly string[];
}

/** A reviewed source decision. Matches name an exact family/variant; new variants state their movement pattern. */
export interface LibraryDecision {
  readonly action: 'match' | 'new' | 'skip';
  readonly reason?: string;
  readonly movement?: string;
  readonly equipment?: Equipment;
  readonly name?: string;
  readonly pattern?: MovementPattern;
  readonly mechanic?: Mechanic;
  readonly tracking?: ExerciseTracking;
  readonly primary?: readonly Muscle[];
  readonly secondary?: readonly Muscle[];
  readonly resistanceException?: boolean;
}

/** Frozen pre-expansion families plus source-id decisions; the converter never reads its own output. */
export interface LibraryMapping {
  readonly version: number;
  readonly baseFamilies: readonly unknown[];
  readonly sources: Readonly<Record<string, LibraryDecision>>;
}

/** Heuristic: the brief's admitted categories and equipment translations; ambiguous equipment requires review. */
const SOURCE_RULES = Object.freeze({
  categories: ['strength', 'powerlifting', 'olympic weightlifting', 'strongman'],
  equipment: new Map<string, Equipment>([
    ['body only', 'bodyweight'],
    ['kettlebells', 'kettlebell'],
    ['e-z curl bar', 'ez-bar'],
    ['bands', 'band'],
    ['barbell', 'barbell'],
    ['dumbbell', 'dumbbell'],
    ['cable', 'cable'],
    ['machine', 'machine'],
  ]),
  muscles: new Map<string, Muscle>([
    ['abdominals', 'abs'],
    ['quadriceps', 'quads'],
    ['middle back', 'upper-back'],
    ['traps', 'upper-traps'],
    ['abductors', 'hip-abductors'],
    ['lower back', 'lower-back'],
    ['chest', 'chest'],
    ['lats', 'lats'],
    ['biceps', 'biceps'],
    ['triceps', 'triceps'],
    ['glutes', 'glutes'],
    ['adductors', 'adductors'],
    ['hamstrings', 'hamstrings'],
    ['calves', 'calves'],
    ['neck', 'neck'],
  ]),
});

function fail(message: string): never {
  throw new ExerciseLibraryError('malformed', message);
}

function muscle(source: string, name: string): Muscle {
  const words = name.toLowerCase();
  if (source === 'shoulders') {
    if (/rear|reverse.*fly|face.pull|back.fly/.test(words)) return 'rear-delt';
    if (/lateral|side/.test(words)) return 'side-delt';
    return 'front-delt';
  }
  if (source === 'forearms')
    return /reverse|extension|palms.down/.test(words) ? 'forearm-extensors' : 'forearm-flexors';
  return SOURCE_RULES.muscles.get(source) ?? fail(`Unknown source muscle: ${source}`);
}

/** Heuristic: only clear synergists from T-047; retain all existing primary tags. */
function smallMuscles(name: string): Muscle[] {
  const words = name.toLowerCase();
  const result: Muscle[] = [];
  if (/push[ -]?up|landmine.*press|incline.*press/.test(words)) result.push('serratus');
  if (/(hammer|reverse).*curl/.test(words) && !/wrist/.test(words)) result.push('brachialis', 'brachioradialis');
  if (/y[ -]?raise|prone.*raise|raise.*prone/.test(words)) result.push('lower-traps');
  return result;
}

function withSmallMuscles(family: LibraryFamily): LibraryFamily {
  return {
    ...family,
    variants: family.variants.map((variant) => {
      const primary = variant.primary ?? family.primary;
      const name = variant.name ?? ExerciseLibrary.exerciseName(family.movement, variant.equipment);
      return {
        ...variant,
        secondary: [...new Set([...(variant.secondary ?? family.secondary ?? []), ...smallMuscles(name)])].filter(
          (item) => !primary.includes(item),
        ),
      };
    }),
  };
}

/**
 * Builds canonical JSON from frozen families and reviewed decisions, without mutation or network access.
 * Every source id needs a decision. Existing names, primary muscles and metadata survive unchanged;
 * source details attach to the exact variant, with the first source id winning duplicate detail matches.
 */
export function buildLibrary(source: readonly SourceExercise[], mapping: LibraryMapping): string {
  const base = parseLibraryFile({ version: mapping.version, families: mapping.baseFamilies });
  const families = base.families.map(withSmallMuscles);
  const seen = new Set<string>();
  for (const entry of source.toSorted((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))) {
    if (seen.has(entry.id)) fail(`Duplicate source id: ${entry.id}`);
    seen.add(entry.id);
    const decision = mapping.sources[entry.id] ?? fail(`Missing decision: ${entry.id}`);
    if (decision.action === 'skip') continue;
    const excluded =
      !SOURCE_RULES.categories.includes(entry.category) ||
      /foam roll|medicine ball|exercise ball/.test(entry.equipment ?? '') ||
      /jump|plyo|sprint/.test(entry.name.toLowerCase());
    if (excluded && !decision.resistanceException) fail(`Excluded source needs a resistance exception: ${entry.id}`);
    const equipment =
      decision.equipment ??
      SOURCE_RULES.equipment.get(entry.equipment ?? '') ??
      fail(`Equipment needs review: ${entry.id}`);
    const movement = decision.movement ?? fail(`Movement needs review: ${entry.id}`);
    let index = families.findIndex((family) => family.movement === movement);
    if (index < 0) {
      if (decision.action === 'match') fail(`Missing match family: ${entry.id}`);
      const primary = decision.primary ?? [...new Set(entry.primaryMuscles.map((item) => muscle(item, entry.name)))];
      const secondary =
        decision.secondary ??
        [...new Set(entry.secondaryMuscles.map((item) => muscle(item, entry.name)))].filter(
          (item) => !primary.includes(item),
        );
      families.push({
        movement,
        pattern: decision.pattern ?? fail(`Pattern needs review: ${entry.id}`),
        mechanic: decision.mechanic ?? (entry.mechanic === 'isolation' ? 'isolation' : 'compound'),
        primary,
        secondary,
        aliases: undefined,
        lengthened: undefined,
        tracking: undefined,
        variants: [],
      });
      index = families.length - 1;
    }
    const family = families[index] ?? fail(`Missing family: ${entry.id}`);
    const name = decision.name ?? ExerciseLibrary.exerciseName(movement, equipment);
    const variantIndex = family.variants.findIndex(
      (variant) => (variant.name ?? ExerciseLibrary.exerciseName(movement, variant.equipment)) === name,
    );
    if (variantIndex < 0 && decision.action === 'match') fail(`Missing match variant: ${entry.id}`);
    const existing = family.variants[variantIndex];
    const primary = existing?.primary ?? family.primary;
    const variant: LibraryVariant = {
      ...(existing ?? {
        equipment,
        name: decision.name,
        primary: undefined,
        secondary: undefined,
        aliases: undefined,
        lengthened: undefined,
        tracking: decision.tracking,
        instructions: undefined,
        imageKeys: undefined,
      }),
      aliases: [...new Set([...(existing?.aliases ?? []), entry.name])],
      secondary: [...new Set([...(existing?.secondary ?? family.secondary ?? []), ...smallMuscles(name)])].filter(
        (item) => !primary.includes(item),
      ),
      instructions: existing?.instructions ?? [...entry.instructions],
      imageKeys: existing?.imageKeys ?? [...entry.images],
    };
    const variants = [...family.variants];
    if (variantIndex < 0) variants.push(variant);
    else variants[variantIndex] = variant;
    families[index] = { ...family, variants };
  }
  for (const id of Object.keys(mapping.sources)) if (!seen.has(id)) fail(`Stale source decision: ${id}`);
  const result = `${JSON.stringify({ version: mapping.version, families }, null, 2)}\n`;
  ExerciseLibrary.fromJson(result);
  return result;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Inputs are the committed source and reviewed mapping. buildLibrary validates their resulting library before writing.
  const source = JSON.parse(readFileSync('data/sources/free-exercise-db/exercises.json', 'utf8')) as SourceExercise[];
  // The hand-reviewed mapping is checked by exact match lookups and the library parser in buildLibrary.
  const mapping = JSON.parse(readFileSync('data/sources/library-mapping.json', 'utf8')) as LibraryMapping;
  writeFileSync('src/core/library/library.json', buildLibrary(source, mapping));
}
