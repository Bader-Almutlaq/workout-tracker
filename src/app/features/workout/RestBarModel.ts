import type { RestState } from '../../../core/logging/RestTimer';

/** What the rest bar shows and what its buttons do. */
export interface RestBarModel {
  readonly state: RestState;
  /** The exercise's rest target in seconds. */
  readonly targetSeconds: number;
  readonly canShorten: boolean;
  readonly canLengthen: boolean;
  readonly shorten: () => void;
  readonly lengthen: () => void;
  /** Hides the bar until the next set is completed. */
  readonly dismiss: () => void;
}
