import { Animation } from './Animation';
import type { EasingFn } from './easings';

/**
 * Compose multiple animations that share the same progress input.
 * Useful for driving camera position (x, y, z) from a single progress value.
 */
export class AnimationGroup {
  private animations: Map<string, Animation> = new Map();

  add(key: string, from: number, to: number, easing?: EasingFn): this {
    this.animations.set(key, new Animation(from, to, easing));
    return this;
  }

  /**
   * Evaluate all animations at the given progress.
   * Returns a record of key → interpolated value.
   */
  evaluate(t: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, anim] of this.animations) {
      result[key] = anim.evaluate(t);
    }
    return result;
  }
}
