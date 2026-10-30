import { database } from '../../data/database';
import { loggingQueue } from '../workout/loggingQueue';

/*
 * Every write from the template list goes through the logging queue, like the logging screen's
 * writes: taps are applied in the order they were made, and a failure shows in the same banner.
 */

/** Starts a workout from the template. Resolves when it has started (or failed). */
export function startTemplateWorkout(templateId: number): Promise<unknown> {
  return loggingQueue.enqueue(() => database.startFromTemplate(templateId));
}

/** Copies the template next to the original. */
export function duplicateTemplate(templateId: number): void {
  void loggingQueue.enqueue(() => database.duplicateTemplate(templateId));
}

/** Moves a template to a zero-based position in its current folder. */
export function reorderTemplate(templateId: number, position: number): void {
  void loggingQueue.enqueue(() => database.reorderTemplate(templateId, position));
}

/** Deletes the template. */
export function deleteTemplate(templateId: number): void {
  void loggingQueue.enqueue(() => database.deleteTemplate(templateId));
}

/** Moves the template to the end of a folder (`null` for no folder). */
export function moveTemplate(templateId: number, folderId: number | null): void {
  void loggingQueue.enqueue(() => database.moveTemplate(templateId, folderId));
}

/** Adds a folder after the others. */
export function createFolder(name: string): void {
  void loggingQueue.enqueue(() => database.createTemplateFolder(name));
}

/** Renames a folder. */
export function renameFolder(folderId: number, name: string): void {
  void loggingQueue.enqueue(() => database.renameTemplateFolder(folderId, name));
}

/** Moves a folder to a zero-based position among the folders. */
export function moveFolder(folderId: number, position: number): void {
  void loggingQueue.enqueue(() => database.reorderTemplateFolder(folderId, position));
}

/** Deletes a folder, keeping its templates. */
export function deleteFolder(folderId: number): void {
  void loggingQueue.enqueue(() => database.deleteTemplateFolder(folderId));
}
