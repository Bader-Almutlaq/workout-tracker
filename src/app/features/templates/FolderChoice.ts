/** A folder as a choice in a picker. */
export interface FolderChoice {
  readonly id: number;
  readonly name: string;
}

/** The value of the "no folder" option in a folder picker. */
export const NO_FOLDER_VALUE = '';

/** The picker options for `folders`, with ids as the strings a `<select>` works in. */
export function folderOptions(folders: readonly FolderChoice[]): { value: string; label: string }[] {
  return folders.map((folder) => ({ value: String(folder.id), label: folder.name }));
}

/** The folder id a picker value stands for, `null` for no folder. */
export function folderIdOf(value: string): number | null {
  return value === NO_FOLDER_VALUE ? null : Number(value);
}

/** The picker value for a folder id (`null` for no folder). */
export function folderValueOf(folderId: number | null): string {
  return folderId === null ? NO_FOLDER_VALUE : String(folderId);
}
