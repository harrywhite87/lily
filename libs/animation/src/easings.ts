/** Symmetric easing functions — same shape forward and backward. */

/** No easing, linear interpolation. */
export function easeLinear(t: number): number {
  return t;
}

/** Smooth start and end (Hermite). */
export function easeSmoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Even smoother start and end (Ken Perlin's improvement). */
export function easeSmootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Sinusoidal ease-in-out: symmetric by nature. */
export function easeSineInOut(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Quadratic ease-in-out. */
export function easeQuadInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Cubic ease-in-out. */
export function easeCubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type EasingFn = (t: number) => number;
