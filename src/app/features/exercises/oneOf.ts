/**
 * The member of `allowed` equal to `value`, or `undefined` when there is none. Turns the string a
 * picker hands back into the typed vocabulary value without a cast.
 */
export function oneOf<Value extends string>(allowed: readonly Value[], value: string): Value | undefined {
  return allowed.find((candidate) => candidate === value);
}
