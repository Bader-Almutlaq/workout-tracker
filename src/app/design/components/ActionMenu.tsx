import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ActionMenu.module.css';
import { ActionMenuRow, type ActionMenuItem } from './ActionMenuRow';

/**
 * A button that opens a short list of actions beside it, such as an exercise's "…" menu. Pressing
 * anywhere else closes it. `children` is the button's content; `label` is what screen readers say.
 * `align` is the edge of the button the list lines up with.
 */
export function ActionMenu({
  label,
  items,
  align = 'end',
  children,
}: {
  readonly label: string;
  readonly items: readonly ActionMenuItem[];
  readonly align?: 'start' | 'end';
  readonly children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const close = () => setIsOpen(false);

  // A press anywhere outside the menu closes it. (A full-screen backdrop can't be used: inside the
  // blurred top bar a fixed element is sized to the bar, not the screen.)
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && menu.current?.contains(event.target) === true) return;
      setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [isOpen]);

  return (
    <div ref={menu} className={styles.menu}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </button>
      {isOpen && (
        <div className={styles.panel} role="menu" data-align={align}>
          {items.map((item) => (
            <ActionMenuRow key={item.label} item={item} onChosen={close} />
          ))}
        </div>
      )}
    </div>
  );
}
