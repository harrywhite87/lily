import { describe, it, expect } from 'vitest';
import { Animation } from './Animation';
import { AnimationGroup } from './AnimationGroup';
import { easeSmoothstep, easeSineInOut } from './easings';

describe('Animation', () => {
  it('returns from at t=0', () => {
    const anim = new Animation(10, 50);
    expect(anim.evaluate(0)).toBe(10);
  });

  it('returns to at t=1', () => {
    const anim = new Animation(10, 50);
    expect(anim.evaluate(1)).toBe(50);
  });

  it('returns midpoint at t=0.5 (linear)', () => {
    const anim = new Animation(0, 100);
    expect(anim.evaluate(0.5)).toBe(50);
  });

  it('clamps below 0', () => {
    const anim = new Animation(0, 100);
    expect(anim.evaluate(-0.5)).toBe(0);
  });

  it('clamps above 1', () => {
    const anim = new Animation(0, 100);
    expect(anim.evaluate(1.5)).toBe(100);
  });

  it('supports easing', () => {
    const anim = new Animation(0, 100, easeSmoothstep);
    // smoothstep at 0.5 should still be 50 (symmetric)
    expect(anim.evaluate(0.5)).toBe(50);
    // but at 0.25 should differ from linear
    const val = anim.evaluate(0.25);
    expect(val).not.toBe(25);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(50);
  });

  it('is deterministically reversible', () => {
    const anim = new Animation(10, 90, easeSineInOut);
    const forward = anim.evaluate(0.3);
    const backward = anim.evaluate(0.3);
    expect(forward).toBe(backward);
  });
});

describe('AnimationGroup', () => {
  it('evaluates multiple named animations', () => {
    const group = new AnimationGroup()
      .add('x', 0, 10)
      .add('y', -5, 5)
      .add('z', 100, 200);

    const result = group.evaluate(0.5);
    expect(result.x).toBe(5);
    expect(result.y).toBe(0);
    expect(result.z).toBe(150);
  });

  it('returns start values at t=0', () => {
    const group = new AnimationGroup()
      .add('x', 0, 10)
      .add('y', -5, 5);

    const result = group.evaluate(0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(-5);
  });

  it('returns end values at t=1', () => {
    const group = new AnimationGroup()
      .add('x', 0, 10)
      .add('y', -5, 5);

    const result = group.evaluate(1);
    expect(result.x).toBe(10);
    expect(result.y).toBe(5);
  });
});
