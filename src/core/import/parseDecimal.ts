/** Plain decimal notation with an optional sign and exponent: "12", "-3.5", ".5", "5.", "1e3". */
const DECIMAL = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Reads `text` as a finite decimal number, or returns `undefined` if it isn't one.
 *
 * Stricter than `Number(text)`, which also accepts "", hex ("0x10") and "Infinity": none of those
 * is a weight, and an import must refuse them rather than store them.
 */
export function parseDecimal(text: string): number | undefined {
  if (!DECIMAL.test(text)) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}
