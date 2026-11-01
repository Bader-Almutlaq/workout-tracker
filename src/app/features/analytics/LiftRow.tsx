import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { LiftSparkline } from './LiftSparkline';
import styles from './Analytics.module.css';

/** A navigable strength row with a sparkline and signed change. */
export function LiftRow({
  to,
  name,
  detail,
  points,
  value,
  change,
  changeText,
}: {
  readonly to: string;
  readonly name: string;
  readonly detail?: ReactNode;
  readonly points: readonly { readonly value: number; readonly deload: boolean }[];
  readonly value: string;
  readonly change: number | null;
  readonly changeText?: string | undefined;
}) {
  return (
    <Link className={styles.lift} to={to}>
      <span>
        {name}
        {detail}
      </span>
      <LiftSparkline points={points} />
      <span>
        {value}
        <small className={change === null || change === 0 ? styles.neutral : change > 0 ? styles.good : styles.bad}>
          {changeText ?? (change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`)}
        </small>
      </span>
    </Link>
  );
}
