// Prints what importing a Strong export would do, without touching any database.
// Usage: npx tsx tools/import-report.ts [export folder or strong_workouts.csv]   (default: export_data)
//
// For checking the importer against the owner's real file, which tests must never read (see
// AGENTS.md). This is the only code that reads `export_data/`.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CsvTable } from '../src/core/import/CsvTable';
import { ImportError } from '../src/core/import/ImportError';
import { makeStrongImportPlan } from '../src/core/import/StrongImportPlan';
import {
  isStrongMeasurementsFile,
  parseStrongMeasurementsFile,
  type PlannedMeasurement,
} from '../src/core/import/StrongMeasurementsFile';
import type { StrongRow } from '../src/core/import/StrongRow';
import { parseStrongWorkoutsFile } from '../src/core/import/StrongWorkoutsFile';
import { displayValue } from '../src/core/units/Weight';

const DEFAULT_EXPORT_FOLDER = 'export_data';
const EXIT_USAGE = 2;
const EXIT_UNREADABLE = 1;

/** Kilograms as the native report printed them: up to two decimals, with thousands separators. */
const kilogramFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  roundingMode: 'halfEven',
});
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

function formatKilograms(value: number): string {
  return kilogramFormat.format(displayValue(value, 'kg'));
}

function formatDate(isoTimestamp: string | null): string {
  return isoTimestamp === null ? '-' : dateFormat.format(new Date(isoTimestamp));
}

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

function csvFilesIn(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path)
    .filter((name) => name.endsWith('.csv'))
    .sort()
    .map((name) => join(path, name));
}

function main(): void {
  const [path = DEFAULT_EXPORT_FOLDER, ...extra] = process.argv.slice(2);
  if (extra.length > 0 || path.startsWith('-')) {
    process.stderr.write('Usage: npx tsx tools/import-report.ts [export folder or strong_workouts.csv]\n');
    process.exit(EXIT_USAGE);
  }

  if (!existsSync(path)) {
    process.stderr.write(`${path} does not exist. Pass the export folder: npx tsx tools/import-report.ts <folder>\n`);
    process.exit(EXIT_UNREADABLE);
  }

  const rows: StrongRow[] = [];
  const measurements: PlannedMeasurement[] = [];
  for (const file of csvFilesIn(path)) {
    const text = readFileSync(file, 'utf8');
    try {
      if (isStrongMeasurementsFile(CsvTable.parse(text))) {
        measurements.push(...parseStrongMeasurementsFile(text));
      } else {
        rows.push(...parseStrongWorkoutsFile(text));
      }
    } catch (error) {
      if (!(error instanceof ImportError)) throw error;
      process.stderr.write(`${basename(file)}: ${error.message}\n`);
      process.exit(EXIT_UNREADABLE);
    }
  }

  const plan = makeStrongImportPlan(rows, measurements);
  const { totals } = plan;

  print(`Rows read:        ${rows.length}`);
  print(`Workouts:         ${totals.workouts}`);
  print(`Sets:             ${totals.sets} (${totals.workSets} excluding warm-ups)`);
  print(`Volume:           ${formatKilograms(totals.volumeKilograms)} kg`);
  print(`Dates:            ${formatDate(totals.firstDate)} → ${formatDate(totals.lastDate)}`);
  print(
    `Measurements:     ${measurements.length} across ${new Set(measurements.map((measurement) => measurement.site)).size} sites`,
  );
  print(`Rest-timer rows:  ${totals.skippedRestTimerRows} skipped`);
  print('');
  print('Exercises written in pounds (kg votes / lb votes):');
  for (const exercise of plan.exercises) {
    if (exercise.columnUnit === 'lb')
      print(`  ${exercise.name}: ${exercise.verdict.kilogramVotes}/${exercise.verdict.poundVotes}`);
  }
  print('Exercises in kg with any lb votes:');
  for (const exercise of plan.exercises) {
    if (exercise.columnUnit === 'kg' && exercise.verdict.poundVotes > 0) {
      print(`  ${exercise.name}: ${exercise.verdict.kilogramVotes}/${exercise.verdict.poundVotes}`);
    }
  }

  print('');
  print(`Suspicious sets: ${plan.findings.length}`);
  for (const finding of plan.findings) {
    const context = plan.setsByLine.get(finding.id);
    if (context === undefined) continue;
    const suggestion = finding.suggestion === null ? '' : ` → maybe ${formatKilograms(finding.suggestion)}`;
    print(
      `  line ${finding.id} ${formatDate(context.workoutStartedAt)} ${context.exerciseName}: ${formatKilograms(context.set.weightKilograms)} kg × ${context.set.reps} — ${finding.issue}, typical ${formatKilograms(finding.typical)}${suggestion}`,
    );
  }
}

main();
