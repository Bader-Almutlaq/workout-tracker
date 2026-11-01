import { Delete, Keyboard, Minus, Plus } from 'lucide-react';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import styles from './NumberPad.module.css';
import { PadButton } from './PadButton';
import { digitKey, type PadKey } from './PadKey';
import { PadUnitToggle } from './PadUnitToggle';

/**
 * The keypad docked above the tab bar while a weight, reps or RPE cell is edited. It replaces the
 * system keyboard, which would hide the sets and has no − / + or Next.
 *
 *     1  2  3  −
 *     4  5  6  +
 *     7  8  9  Next
 *     .  0  ⌫  Done
 *
 * `unit` is given only for weight cells, where it shows the kg/lb toggle. A failed save appears in
 * a banner above the pad. An empty space of the pad's height stays in the page so the last rows can
 * scroll clear of it.
 */
export function NumberPad({
  title,
  allowsDecimal,
  unit,
  errorMessage,
  onDismissError,
  onKey,
  onStep,
  onNext,
  onDone,
  onUnitChange,
  onRpe,
  onQuickRpe,
  isRpe = false,
}: {
  readonly title: string;
  readonly onRpe?: () => void;
  readonly onQuickRpe?: (value: number) => void;
  readonly isRpe?: boolean;
  /** Reps and seconds are whole numbers. */
  readonly allowsDecimal: boolean;
  readonly unit: WeightUnit | undefined;
  readonly errorMessage: string | undefined;
  readonly onDismissError: () => void;
  readonly onKey: (key: PadKey) => void;
  readonly onStep: (direction: 1 | -1) => void;
  readonly onNext: () => void;
  readonly onDone: () => void;
  readonly onUnitChange: (unit: WeightUnit) => void;
}) {
  const digit = (value: number) => (
    <PadButton label={String(value)} onPress={() => onKey(digitKey(value))}>
      {value}
    </PadButton>
  );

  return (
    <div className={styles.dock} data-rpe={isRpe}>
      <div className={styles.spacer} />
      <div className={styles.pad} role="group" aria-label="Number pad">
        {errorMessage !== undefined && (
          <div className={styles.error}>
            <ErrorBanner message={errorMessage} onDismiss={onDismissError} />
          </div>
        )}
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {unit !== undefined && <PadUnitToggle unit={unit} onChange={onUnitChange} />}
        </div>
        {isRpe && onQuickRpe !== undefined && (
          <div className={styles.quickPicks}>
            {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
              <button key={value} type="button" onClick={() => onQuickRpe(value)}>
                {value}
              </button>
            ))}
          </div>
        )}
        <div className={styles.keys}>
          {digit(1)}
          {digit(2)}
          {digit(3)}
          <PadButton label="Hide pad" onPress={onDone}>
            <Keyboard size={22} aria-hidden />
          </PadButton>
          {digit(4)}
          {digit(5)}
          {digit(6)}
          <PadButton
            label="RPE"
            tone={isRpe ? 'primary' : 'accent'}
            isDisabled={onRpe === undefined}
            onPress={() => onRpe?.()}
          >
            RPE
          </PadButton>
          {digit(7)}
          {digit(8)}
          {digit(9)}
          <div className={styles.steps}>
            <PadButton label="Decrease" onPress={() => onStep(-1)}>
              <Minus size={22} aria-hidden />
            </PadButton>
            <PadButton label="Increase" onPress={() => onStep(1)}>
              <Plus size={22} aria-hidden />
            </PadButton>
          </div>
          <PadButton label="Decimal point" isDisabled={!allowsDecimal} onPress={() => onKey({ kind: 'decimalPoint' })}>
            .
          </PadButton>
          {digit(0)}
          <PadButton label="Delete" onPress={() => onKey({ kind: 'backspace' })}>
            <Delete size={22} aria-hidden />
          </PadButton>
          <PadButton label="Next field" tone="primary" onPress={onNext}>
            Next
          </PadButton>
        </div>
      </div>
    </div>
  );
}
