/**
 * Bounds for the sphere's numeric settings, shared by the panel sliders and the
 * query-param parser so a deep link can't ask for 400 iframes.
 */
export const COUNT_RANGE = { min: 3, max: 36 }
/** Screen size, as a multiple of the even spacing the screen count works out at. */
export const SIZE_RANGE = { min: 0.5, max: 1.5 }
/** Idle turn about the sphere's own axis, in degrees per second. */
export const SPIN_RANGE = { min: 0, max: 60 }
/** Sphere scale, against the size it is fitted to the viewport at. */
export const ZOOM_RANGE = { min: 0.6, max: 1.8 }
/** Sphere centre, in half-viewports either side of the middle of the frame. */
export const OFFSET_RANGE = { min: -1, max: 1 }
