/**
 * Gym abbreviations and run-together spellings that search expands before matching, so "rdl"
 * finds "Romanian Deadlift" and "pullup" finds "Pull Up".
 *
 * Applied by `SearchText.tokens` to queries, exercise names and aliases alike, so both sides of a
 * comparison are always normalised the same way.
 */
export const GymSlang = {
  /**
   * Maps one lowercase token to the lowercase words it stands for. Values pass through
   * singularisation afterwards, so plural forms need not be listed twice.
   *
   * "lat" is deliberately absent: it means the muscle in "lat pulldown" but is also short for
   * "lateral" in "lat raise", so expanding it would break one of the two.
   *
   * A `Map`, not an object, so a query such as "constructor" can't find an inherited property.
   */
  expansions: new Map<string, readonly string[]>([
    ['db', ['dumbbell']],
    ['dbs', ['dumbbell']],
    ['bb', ['barbell']],
    ['kb', ['kettlebell']],
    ['ez', ['ez']],
    ['rdl', ['romanian', 'deadlift']],
    ['rdls', ['romanian', 'deadlift']],
    ['sldl', ['stiff', 'leg', 'deadlift']],
    ['ohp', ['overhead', 'press']],
    ['bss', ['bulgarian', 'split', 'squat']],
    ['rfess', ['bulgarian', 'split', 'squat']],
    ['ssb', ['safety', 'bar']],
    ['cgbp', ['close', 'grip', 'bench', 'press']],
    ['dl', ['deadlift']],
    ['bp', ['bench', 'press']],
    ['tri', ['tricep']],
    ['tris', ['tricep']],
    ['bi', ['bicep']],
    ['bis', ['bicep']],
    ['pullup', ['pull', 'up']],
    ['pullups', ['pull', 'up']],
    ['chinup', ['chin', 'up']],
    ['chinups', ['chin', 'up']],
    ['pushup', ['push', 'up']],
    ['pushups', ['push', 'up']],
    ['situp', ['sit', 'up']],
    ['situps', ['sit', 'up']],
    ['hspu', ['handstand', 'push', 'up']],
    ['ghr', ['glute', 'ham', 'raise']],
    ['sl', ['single', 'leg']],
    ['ext', ['extension']],
    ['delt', ['delt']],
    ['delts', ['delt']],
  ]),
} as const;
