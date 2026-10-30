/** A key that types into the cell. */
export type PadKey =
  | { readonly kind: 'digit'; readonly digit: number }
  | { readonly kind: 'decimalPoint' }
  | { readonly kind: 'backspace' };

/** The key for one digit. */
export function digitKey(digit: number): PadKey {
  return { kind: 'digit', digit };
}
