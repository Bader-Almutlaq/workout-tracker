import type { Equipment } from './Equipment';

/** A convenient, non-exhaustive alphabetical list of machine manufacturers. */
export const MACHINE_BRANDS: readonly string[] = Object.freeze([
  'Arsenal Strength',
  'Atlantis',
  'Atlas',
  'BH Fitness',
  'Cybex',
  'Freemotion',
  'Gym80',
  'Hammer Strength',
  'Hoist',
  'Keiser',
  'Life Fitness',
  'Matrix',
  'Nautilus',
  'Newtech',
  'Panatta',
  'Precor',
  'Prime',
  'Star Trac',
  'Technogym',
]);

/** Invalid machine manufacturer input, suitable for display to the owner. */
export class MachineBrandError extends Error {
  readonly kind = 'tooLong';

  constructor() {
    super('Machine names must be 40 characters or fewer.');
    this.name = 'MachineBrandError';
  }
}

/** Whether equipment can have a machine manufacturer. */
export function usesMachineBrand(equipment: Equipment | null): boolean {
  return (
    equipment === 'machine' || equipment === 'plate-loaded' || equipment === 'cable' || equipment === 'smith-machine'
  );
}

/** Normalizes whitespace and known manufacturer spelling; blank input becomes null. */
export function normalizeMachineBrand(text: string): string | null {
  const name = text.trim().replace(/\s+/g, ' ');
  if (name.length === 0) return null;
  // Heuristic: cap custom names to keep controls and labels readable on a phone.
  const maximumLength = 40;
  if (name.length > maximumLength) throw new MachineBrandError();
  return MACHINE_BRANDS.find((brand) => brand.toLowerCase() === name.toLowerCase()) ?? name;
}
