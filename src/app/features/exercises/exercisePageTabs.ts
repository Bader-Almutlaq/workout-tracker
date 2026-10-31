/** URL values and labels for the exercise page's mutually exclusive sections. */
export const exercisePageTabs = Object.freeze([
  { value: 'summary', label: 'Summary' },
  { value: 'history', label: 'History' },
  { value: 'charts', label: 'Charts' },
  { value: 'records', label: 'Records' },
  { value: 'how-to', label: 'How-to' },
] as const);

/** Exercise page section, persisted in the tab query parameter. */
export type ExercisePageTab = (typeof exercisePageTabs)[number]['value'];

/** Unknown or absent tab values open Summary, without interpreting any other URL parameters. */
export function exercisePageTab(params: URLSearchParams): ExercisePageTab {
  return exercisePageTabs.find((tab) => tab.value === params.get('tab'))?.value ?? 'summary';
}

/** A copied query string preserves browse/return context when navigating between sections. */
export function exercisePageTabParams(params: URLSearchParams, tab: ExercisePageTab): URLSearchParams {
  const next = new URLSearchParams(params);
  next.set('tab', tab);
  return next;
}
