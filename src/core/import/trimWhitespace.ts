/**
 * Space-separator characters (Unicode category Zs) and tab: Foundation's
 * `CharacterSet.whitespaces`, which the native importer trimmed with. Unlike `String.trim`, it
 * leaves line breaks and the byte-order mark alone.
 */
const WHITESPACE_AT_EDGES = /^[\p{Zs}\t]+|[\p{Zs}\t]+$/gu;

/** `text` without leading and trailing spaces and tabs (not line breaks). */
export function trimWhitespace(text: string): string {
  return text.replace(WHITESPACE_AT_EDGES, '');
}
