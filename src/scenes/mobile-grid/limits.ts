/**
 * Bounds for the wall's numeric settings, shared by the panel sliders and the
 * query-param parser so a deep link can't ask for 400 iframes.
 */
export const COLUMN_RANGE = { min: 1, max: 6 }
export const ROW_RANGE = { min: 1, max: 6 }
/** In phone widths, so the spacing holds whatever size the wall is scaled to. */
export const GAP_RANGE = { min: 0, max: 0.5 }
export const ROTATION_RANGE = { min: -90, max: 90 }
export const SPEED_RANGE = { min: 0, max: 4 }
