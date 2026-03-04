/** Clamp value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation between a and b by factor t ∈ [0,1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Hermite smoothstep from edge0 to edge1. Returns 0 below edge0, 1 above edge1. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Remap a value from [inMin, inMax] to [outMin, outMax].
 * The result is NOT clamped — use clamp() if bounds are needed.
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number = 0,
  outMax: number = 1,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Compute section-local progress for a segment within global progress p.
 * Returns 0 before segStart, 1 after segEnd, and linearly interpolated between.
 */
export function sectionProgress(p: number, segStart: number, segEnd: number): number {
  return clamp((p - segStart) / (segEnd - segStart), 0, 1);
}
