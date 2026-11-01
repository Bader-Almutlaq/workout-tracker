/** Heuristic: keep menu edges at least eight pixels from the viewport. */
const MENU_MARGIN = 8;

/** Calculates the menu's viewport position, preferring below the trigger when it fits. */
export function actionMenuPlacement(
  trigger: { left: number; right: number; top: number; bottom: number },
  panel: { width: number; height: number },
  viewport: { width: number; bottom: number },
  align: 'start' | 'end',
): { left: number; top: number } {
  const desiredLeft = align === 'start' ? trigger.left : trigger.right - panel.width;
  const left = Math.max(MENU_MARGIN, Math.min(desiredLeft, viewport.width - panel.width - MENU_MARGIN));
  const top =
    trigger.bottom + panel.height <= viewport.bottom - MENU_MARGIN
      ? trigger.bottom
      : Math.max(MENU_MARGIN, trigger.top - panel.height);
  return { left, top };
}
