/**
 * The text being typed into one cell on the number pad. It only edits text: turning the text into a
 * weight, rep count or RPE, and saving it, is the editor's job. The first key pressed replaces the
 * value the cell started with (typing "140" over "135" gives 140, not 135140), then keys append as
 * usual. Port of `NumberDraft` in the native app.
 */
export interface NumberDraft {
  /** What the cell shows while it is being edited. Always uses "." as the decimal point. */
  readonly text: string;
  /** What the cell held when the pad opened on it. */
  readonly original: string;
  /** True until the first key, which replaces the original text instead of adding to it. */
  readonly replacesOnNextKey: boolean;
}

/** Most characters a cell accepts, so a stuck key can't build an absurd number. */
export const MAXIMUM_DRAFT_LENGTH = 7;

/** Drafts show at most two decimals ("2.5", "61.23"), the precision weights are displayed with. */
const DRAFT_DECIMALS = 2;

const draftFormat = new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: DRAFT_DECIMALS });

/** The draft text for `value`: no grouping separators, at most two decimals ("135", "2.5"). */
export function draftTextFor(value: number): string {
  return draftFormat.format(value);
}

/** Starts a draft showing `text`, e.g. "135". Pass "" for an empty cell. */
export function startDraft(text: string): NumberDraft {
  return { text, original: text, replacesOnNextKey: true };
}

/** Whether the text differs from what the cell started with; unchanged drafts are not saved. */
export function draftHasChanged(draft: NumberDraft): boolean {
  return draft.text !== draft.original;
}

/** The typed number, or `null` when the text is empty. */
export function draftValue(draft: NumberDraft): number | null {
  return draft.text === '' ? null : Number(draft.text);
}

function startTyping(draft: NumberDraft): NumberDraft {
  return draft.replacesOnNextKey ? { ...draft, text: '', replacesOnNextKey: false } : draft;
}

/** Types one digit (0 to 9). */
export function appendDigit(draft: NumberDraft, digit: number): NumberDraft {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return draft;
  const typing = startTyping(draft);
  if (typing.text.length >= MAXIMUM_DRAFT_LENGTH) return typing;
  return { ...typing, text: typing.text === '0' ? String(digit) : typing.text + String(digit) };
}

/** Types the decimal point; ignored when the text already has one. */
export function appendDecimalPoint(draft: NumberDraft): NumberDraft {
  const typing = startTyping(draft);
  if (typing.text.includes('.') || typing.text.length >= MAXIMUM_DRAFT_LENGTH) return typing;
  return { ...typing, text: typing.text === '' ? '0.' : `${typing.text}.` };
}

/** Removes the last character. */
export function deleteLast(draft: NumberDraft): NumberDraft {
  return { ...draft, text: draft.text.slice(0, -1), replacesOnNextKey: false };
}

/** Moves the value by `delta`, keeping it between `minimum` and `maximum`. An empty draft counts as 0. */
export function stepDraft(draft: NumberDraft, delta: number, minimum: number, maximum: number): NumberDraft {
  const stepped = Math.min(Math.max((draftValue(draft) ?? 0) + delta, minimum), maximum);
  return { ...draft, text: draftTextFor(stepped), replacesOnNextKey: false };
}
