import { EQUIPMENT, type Equipment } from './Equipment';
import { ExerciseLibraryError } from './ExerciseLibraryError';
import { EXERCISE_TRACKINGS, type ExerciseTracking } from './ExerciseTracking';
import { MECHANICS, type Mechanic } from './Mechanic';
import { MOVEMENT_PATTERNS, type MovementPattern } from './MovementPattern';
import { MUSCLES, type Muscle } from './Muscle';

/** One movement, such as "Lateral Raise", and its equipment variants. */
export interface LibraryFamily {
  /** Name without equipment, e.g. "Bench Press - Close Grip". */
  readonly movement: string;
  /** The joint action the movement trains. */
  readonly pattern: MovementPattern;
  /** One joint or several. */
  readonly mechanic: Mechanic;
  /** Prime movers; every variant inherits them unless it overrides them. */
  readonly primary: readonly Muscle[];
  /** Synergists, or `undefined` for none. */
  readonly secondary: readonly Muscle[] | undefined;
  /** Other names and slang for every variant, or `undefined` for none. */
  readonly aliases: readonly string[] | undefined;
  /**
   * True when the exercise loads the target muscle hardest at long lengths
   * (report, "long-muscle-length emphasis"; Maeo 2022, Wolf 2023). `undefined` means false.
   */
  readonly lengthened: boolean | undefined;
  /** Overrides the tracking inferred from equipment. */
  readonly tracking: ExerciseTracking | undefined;
  /** The equipment variants; each becomes one exercise. */
  readonly variants: readonly LibraryVariant[];
}

/**
 * An equipment variant. In JSON either a bare equipment slug (`"dumbbell"`) or an object that
 * overrides family fields; both parse to this shape.
 */
export interface LibraryVariant {
  /** What this variant is performed with. */
  readonly equipment: Equipment;
  /** Full display name, replacing the generated "Movement (Equipment)". */
  readonly name: string | undefined;
  /** Replaces the family's primary muscles. */
  readonly primary: readonly Muscle[] | undefined;
  /** Replaces the family's secondary muscles. */
  readonly secondary: readonly Muscle[] | undefined;
  /** Added to the family's aliases. */
  readonly aliases: readonly string[] | undefined;
  /** Replaces the family's `lengthened`. */
  readonly lengthened: boolean | undefined;
  /** Source instruction steps; absent for exercises without a source match. */
  readonly instructions: readonly string[] | undefined;
  /** Pinned source image paths, never arbitrary URLs. */
  readonly imageKeys: readonly string[] | undefined;
  /** Replaces the family's tracking. */
  readonly tracking: ExerciseTracking | undefined;
}

/**
 * The on-disk format of `library.json`: movement families, each listing the equipment it can be
 * done with.
 *
 * A family states the muscles and pattern once; each variant inherits them and may override any
 * field. `ExerciseLibrary` expands families into `LibraryExercise` values. Edit the source
 * mapping and regenerate the JSON; bump its version so installed apps re-seed.
 */
export interface LibraryFile {
  /** Increment on every change to the file. Seeding is skipped when the stored version matches. */
  readonly version: number;
  /** Every movement family, in file order. */
  readonly families: readonly LibraryFamily[];
}

function fail(path: string, problem: string): never {
  throw new ExerciseLibraryError('malformed', `The exercise library is malformed at ${path}: ${problem}.`);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, path: string): Readonly<Record<string, unknown>> {
  return isRecord(value) ? value : fail(path, 'expected an object');
}

function readString(value: unknown, path: string): string {
  return typeof value === 'string' ? value : fail(path, 'expected text');
}

function readInteger(value: unknown, path: string): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fail(path, 'expected a whole number');
}

function readBoolean(value: unknown, path: string): boolean {
  return typeof value === 'boolean' ? value : fail(path, 'expected true or false');
}

function readArray(value: unknown, path: string): readonly unknown[] {
  return Array.isArray(value) ? value : fail(path, 'expected a list');
}

/** Reads one of a closed set of slugs. `label` names the vocabulary in the message ("muscle"). */
function readOneOf<Value extends string>(values: readonly Value[], label: string, value: unknown, path: string): Value {
  const text = readString(value, path);
  const match = values.find((candidate) => candidate === text);
  return match ?? fail(path, `"${text}" is not a known ${label}`);
}

/** Reads `record[key]` through `read`, or `undefined` when the key is absent. */
function optional<Value>(
  record: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  read: (value: unknown, path: string) => Value,
): Value | undefined {
  return record[key] === undefined ? undefined : read(record[key], `${path}.${key}`);
}

/** Reads `record[key]` through `read`, failing when the key is absent. */
function required<Value>(
  record: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  read: (value: unknown, path: string) => Value,
): Value {
  return record[key] === undefined ? fail(path, `"${key}" is missing`) : read(record[key], `${path}.${key}`);
}

function readList<Value>(read: (value: unknown, path: string) => Value): (value: unknown, path: string) => Value[] {
  return (value, path) => readArray(value, path).map((item, index) => read(item, `${path}[${String(index)}]`));
}

const readMuscle = (value: unknown, path: string): Muscle => readOneOf(MUSCLES, 'muscle', value, path);
const readEquipment = (value: unknown, path: string): Equipment => readOneOf(EQUIPMENT, 'equipment', value, path);
const readMuscleList = readList(readMuscle);
const readStringList = readList(readString);

function parseVariant(value: unknown, path: string): LibraryVariant {
  if (typeof value === 'string') {
    return {
      equipment: readEquipment(value, path),
      instructions: undefined,
      imageKeys: undefined,
      name: undefined,
      primary: undefined,
      secondary: undefined,
      aliases: undefined,
      lengthened: undefined,
      tracking: undefined,
    };
  }
  const record = readRecord(value, path);
  return {
    equipment: required(record, 'equipment', path, readEquipment),
    instructions: optional(record, 'instructions', path, readStringList),
    imageKeys: optional(record, 'imageKeys', path, readStringList),
    name: optional(record, 'name', path, readString),
    primary: optional(record, 'primary', path, readMuscleList),
    secondary: optional(record, 'secondary', path, readMuscleList),
    aliases: optional(record, 'aliases', path, readStringList),
    lengthened: optional(record, 'lengthened', path, readBoolean),
    tracking: optional(record, 'tracking', path, (item, itemPath) =>
      readOneOf(EXERCISE_TRACKINGS, 'tracking kind', item, itemPath),
    ),
  };
}

function parseFamily(value: unknown, path: string): LibraryFamily {
  const record = readRecord(value, path);
  return {
    movement: required(record, 'movement', path, readString),
    pattern: required(record, 'pattern', path, (item, itemPath) =>
      readOneOf(MOVEMENT_PATTERNS, 'movement pattern', item, itemPath),
    ),
    mechanic: required(record, 'mechanic', path, (item, itemPath) => readOneOf(MECHANICS, 'mechanic', item, itemPath)),
    primary: required(record, 'primary', path, readMuscleList),
    secondary: optional(record, 'secondary', path, readMuscleList),
    aliases: optional(record, 'aliases', path, readStringList),
    lengthened: optional(record, 'lengthened', path, readBoolean),
    tracking: optional(record, 'tracking', path, (item, itemPath) =>
      readOneOf(EXERCISE_TRACKINGS, 'tracking kind', item, itemPath),
    ),
    variants: required(record, 'variants', path, readList(parseVariant)),
  };
}

/**
 * Checks parsed JSON against the library file format and returns it as a `LibraryFile`.
 * Unknown extra keys are ignored.
 *
 * @throws ExerciseLibraryError with kind `malformed`, naming the path of the first bad value
 *   (for example `families[3].primary[0]`) and what is wrong with it.
 */
export function parseLibraryFile(json: unknown): LibraryFile {
  const record = readRecord(json, 'library.json');
  return {
    version: required(record, 'version', 'library.json', readInteger),
    families: required(record, 'families', 'library.json', readList(parseFamily)),
  };
}
