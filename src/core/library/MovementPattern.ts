/**
 * Every joint action an exercise can train. Used for filtering and, later, for pattern balance
 * (for example horizontal push against horizontal pull, report section 12).
 *
 * - `chest-fly`: chest flys and crossovers (shoulder horizontal adduction).
 * - `shoulder-abduction`: lateral and Y raises.
 * - `shoulder-flexion`: front raises.
 * - `rear-delt-fly`: reverse flys, face pulls and rear-delt rows.
 * - `shoulder-extension`: pullovers and straight-arm pulldowns.
 */
export const MOVEMENT_PATTERNS = [
  'horizontal-push',
  'vertical-push',
  'horizontal-pull',
  'vertical-pull',
  'chest-fly',
  'shoulder-abduction',
  'shoulder-flexion',
  'rear-delt-fly',
  'shoulder-extension',
  'shoulder-rotation',
  'shrug',
  'squat',
  'lunge',
  'hinge',
  'hip-thrust',
  'knee-extension',
  'knee-flexion',
  'hip-abduction',
  'hip-adduction',
  'calf-raise',
  'elbow-flexion',
  'elbow-extension',
  'wrist-flexion',
  'wrist-extension',
  'grip',
  'spinal-flexion',
  'spinal-extension',
  'rotation',
  'anti-movement',
  'carry',
  'olympic',
  'neck',
] as const;

/** A movement pattern slug; one of `MOVEMENT_PATTERNS`. */
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

/** Name of each movement pattern shown in filters. */
export const MOVEMENT_PATTERN_DISPLAY_NAMES: Readonly<Record<MovementPattern, string>> = {
  'horizontal-push': 'Horizontal push',
  'vertical-push': 'Vertical push',
  'horizontal-pull': 'Horizontal pull',
  'vertical-pull': 'Vertical pull',
  'chest-fly': 'Chest fly',
  'shoulder-abduction': 'Lateral raise',
  'shoulder-flexion': 'Front raise',
  'rear-delt-fly': 'Rear delt',
  'shoulder-extension': 'Pullover',
  'shoulder-rotation': 'Shoulder rotation',
  shrug: 'Shrug',
  squat: 'Squat',
  lunge: 'Lunge',
  hinge: 'Hinge',
  'hip-thrust': 'Hip thrust',
  'knee-extension': 'Knee extension',
  'knee-flexion': 'Knee flexion',
  'hip-abduction': 'Hip abduction',
  'hip-adduction': 'Hip adduction',
  'calf-raise': 'Calf raise',
  'elbow-flexion': 'Curl',
  'elbow-extension': 'Triceps extension',
  'wrist-flexion': 'Wrist flexion',
  'wrist-extension': 'Wrist extension',
  grip: 'Grip',
  'spinal-flexion': 'Spinal flexion',
  'spinal-extension': 'Spinal extension',
  rotation: 'Rotation',
  'anti-movement': 'Anti-movement',
  carry: 'Carry',
  olympic: 'Olympic lift',
  neck: 'Neck',
};
