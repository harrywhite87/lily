import { clamp, lerp } from '@lilypad/shared';
import { easeLinear, type EasingFn } from './easings';

/**
 * A declarative, progress-driven animation primitive.
 * Evaluates a value between `from` and `to` based on normalized progress,
 * with optional easing. Fully deterministic and reversible.
 */
export class Animation {
  constructor(
    public readonly from: number,
    public readonly to: number,
    public readonly easing: EasingFn = easeLinear,
  ) {}

  /**
   * Evaluate the animation at a given progress t ∈ [0, 1].
   * Values outside [0, 1] are clamped.
   */
  evaluate(t: number): number {
    const clamped = clamp(t, 0, 1);
    const eased = this.easing(clamped);
    return lerp(this.from, this.to, eased);
  }
}
