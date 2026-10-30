import type { Equipment } from '../../../core/library/Equipment';
import type { ExerciseSearchFilter } from '../../../core/library/ExerciseSearch';
import type { Muscle } from '../../../core/library/Muscle';

/** What the owner typed and chose on the Exercises list. */
export interface ExerciseBrowseState {
  readonly query: string;
  readonly muscle: Muscle | undefined;
  readonly equipment: Equipment | undefined;
  readonly customOnly: boolean;
}

/** Nothing typed and nothing chosen. */
export const EMPTY_BROWSE_STATE: ExerciseBrowseState = {
  query: '',
  muscle: undefined,
  equipment: undefined,
  customOnly: false,
};

/** The state the list had when the owner last left it, so coming back from an exercise shows the same list. */
let remembered: ExerciseBrowseState = EMPTY_BROWSE_STATE;

/** The list state to start from: what the owner left, or nothing on the first visit of a session. */
export function rememberedBrowseState(): ExerciseBrowseState {
  return remembered;
}

/** Records the list state for `rememberedBrowseState`. It lasts until the app is closed. */
export function rememberBrowseState(state: ExerciseBrowseState): void {
  remembered = state;
}

/** The search filter for `state`, leaving out what isn't chosen. */
export function searchFilterOf(state: ExerciseBrowseState): ExerciseSearchFilter {
  return {
    ...(state.muscle === undefined ? {} : { muscle: state.muscle }),
    ...(state.equipment === undefined ? {} : { equipment: state.equipment }),
    ...(state.customOnly ? { customOnly: true } : {}),
  };
}

/** Whether the list should show ranked results (something typed or chosen) rather than Recent and A–Z. */
export function isSearching(state: ExerciseBrowseState): boolean {
  return state.query.trim() !== '' || state.muscle !== undefined || state.equipment !== undefined || state.customOnly;
}
