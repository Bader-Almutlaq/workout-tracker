/** A question the owner must answer before something destructive happens. */
export type Confirmation =
  | { readonly kind: 'discard' }
  | { readonly kind: 'finish'; readonly plannedSets: number }
  | { readonly kind: 'removeExercise'; readonly entryId: number; readonly name: string };

/** The words of a confirmation dialog. */
export interface ConfirmationText {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
}

/** The title, explanation and confirm button label for `confirmation`. */
export function confirmationText(confirmation: Confirmation): ConfirmationText {
  switch (confirmation.kind) {
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
