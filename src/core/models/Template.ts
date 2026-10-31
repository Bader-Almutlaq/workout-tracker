/** A Template record as stored in SQLite; positions are zero-based and dates are UTC ISO strings. */
export interface Template {
  readonly id: number;
  readonly name: string;
  readonly folderId: number | null;
  /** ISO weekday, Monday = 1, or null when unscheduled. */
  readonly weekday: number | null;
  readonly position: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastStartedAt: string | null;
}

/** Raw SQLite row for Template. */
export type TemplateRow = Template;

/** Converts a raw row into a Template. */
export function fromTemplateRow(row: TemplateRow): Template {
  return { ...row };
}
