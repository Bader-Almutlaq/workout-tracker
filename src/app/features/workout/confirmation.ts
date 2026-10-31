/** A question the owner must answer before something destructive happens. */
export type Confirmation =
  | { readonly kind: 'discard' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'short'; readonly minutes: number }
  | { readonly kind: 'leftRunning'; readonly time: string; readonly endedAt: string }
  | { readonly kind: 'finish'; readonly plannedSets: number }
  | { readonly kind: 'removeExercise'; readonly entryId: number; readonly name: string };

/** The words of a confirmation dialog. */
export interface ConfirmationText {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
}

/** "under a minute", "1 minute", "3 minutes". */
function durationText(minutes: number): string {
  if (minutes < 1) return 'under a minute';
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

/** The title, explanation and confirm button label for `confirmation`. */
export function confirmationText(confirmation: Confirmation): ConfirmationText {
  switch (confirmation.kind) {
    case 'empty':
      return {
        title: "Nothing was logged, so this workout won't be saved.",
        message: '',
        confirmLabel: 'Discard workout',
      };
    case 'short':
      return {
        title: `This workout lasted ${durationText(confirmation.minutes)}. Save it?`,
        message: '',
        confirmLabel: 'Save',
      };
    case 'leftRunning':
      return {
        title: `Your last set was at ${confirmation.time}. End the workout then?`,
        message: '',
        confirmLabel: `End at ${confirmation.time}`,
      };
    case 'discard':
      return {
        title: 'Discard this workout?',
        message: 'Nothing logged in it will be kept.',
        confirmLabel: 'Discard workout',
      };
    case 'finish':
      return {
        title: 'Finish workout?',
        message:
          confirmation.plannedSets === 1
            ? '1 set wasn’t completed and will be discarded.'
            : `${confirmation.plannedSets} sets weren’t completed and will be discarded.`,
        confirmLabel: 'Finish',
      };
    case 'removeExercise':
      return {
        title: `Remove ${confirmation.name}?`,
        message: 'Its completed sets will be deleted from this workout.',
        confirmLabel: 'Remove exercise',
      };
  }
}
