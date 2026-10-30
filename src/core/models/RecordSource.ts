/**
 * Every place a row can come from, as stored in the `source` columns.
 * - `app`: logged in this app.
 * - `strong`: imported from a Strong export.
 * - `custom`: created by the owner (exercises only).
 * - `library`: the built-in exercise library (exercises only).
 */
export const RECORD_SOURCES = ['app', 'strong', 'custom', 'library'] as const;

/** Where a row came from. Stored in the `source` columns. */
export type RecordSource = (typeof RECORD_SOURCES)[number];
