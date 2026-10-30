/** Every side a set can have trained, as stored in `workoutSet.side`. */
export const SET_SIDES = ['both', 'left', 'right'] as const;

/** Which side a set trained, for one-sided exercises. Stored in `workoutSet.side`. */
export type SetSide = (typeof SET_SIDES)[number];
