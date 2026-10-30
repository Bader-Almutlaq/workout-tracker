/** A TemplateFolder record as stored in SQLite; positions are zero-based and dates are UTC ISO strings. */
export interface TemplateFolder {
  readonly id: number;
  readonly name: string;
  readonly position: number;
}

/** Raw SQLite row for TemplateFolder. */
export type TemplateFolderRow = TemplateFolder;

/** Converts a raw row into a TemplateFolder. */
export function fromTemplateFolderRow(row: TemplateFolderRow): TemplateFolder {
  return { ...row };
}
