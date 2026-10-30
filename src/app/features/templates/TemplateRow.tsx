import { ArrowDown, ArrowUp, Copy, Ellipsis, FolderInput, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { TemplateSummary } from '../../../core/queries/TemplateCatalog';
import { ActionMenu } from '../../design/components/ActionMenu';
import { lastDoneText } from './lastDoneText';
import type { TemplateListActions } from './TemplateListActions';
import styles from './TemplateRow.module.css';

/** Heuristic: a deliberate hold, long enough to avoid opening the menu while scrolling. */
const LONG_PRESS_MILLISECONDS = 500;

/**
 * One template in the list: its name, its exercises on one line (cut off with "…" when long) and
 * when it was last started. Tapping it previews it; the "…" menu duplicates, moves or deletes it.
 */
export function TemplateRow({
  template,
  index,
  count,
  now,
  actions,
}: {
  readonly template: TemplateSummary;
  readonly index: number;
  readonly count: number;
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  const lastDone = lastDoneText(template.lastStartedAt, now);
  const menu = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const cancelHold = () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => () => cancelHold(), []);
  const openMenu = () => {
    held.current = true;
    menu.current?.querySelector('button')?.click();
  };
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.main}
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch') return;
          held.current = false;
          cancelHold();
          timer.current = setTimeout(openMenu, LONG_PRESS_MILLISECONDS);
        }}
        onPointerMove={cancelHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(event) => {
          event.preventDefault();
          cancelHold();
          if (!held.current) openMenu();
        }}
        onClick={() => {
          if (held.current) held.current = false;
          else actions.preview(template);
        }}
      >
        <span className={styles.name}>{template.name}</span>
        <span className={styles.exercises}>{template.exerciseNames.join(', ')}</span>
        {lastDone !== undefined && <span className={styles.lastDone}>{lastDone}</span>}
      </button>
      <div ref={menu} className={styles.menu}>
        <ActionMenu
          label={`Options for ${template.name}`}
          items={[
            {
              label: 'Move up',
              icon: ArrowUp,
              isDisabled: index === 0,
              onSelect: () => actions.reorder(template, index - 1),
            },
            {
              label: 'Move down',
              icon: ArrowDown,
              isDisabled: index === count - 1,
              onSelect: () => actions.reorder(template, index + 1),
            },
            { label: 'Duplicate', icon: Copy, onSelect: () => actions.duplicate(template) },
            { label: 'Move to folder', icon: FolderInput, onSelect: () => actions.requestMove(template) },
            { label: 'Delete', icon: Trash2, isDestructive: true, onSelect: () => actions.requestDelete(template) },
          ]}
        >
          <Ellipsis size={20} strokeWidth={2} aria-hidden />
        </ActionMenu>
      </div>
    </div>
  );
}
