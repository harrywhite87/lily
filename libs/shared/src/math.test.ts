import { describe, it, expect } from 'vitest';
import { clamp, lerp, smoothstep, remap, sectionProgress } from './math';

describe('clamp', () => {
  it('returns min when value is below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('returns max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });
  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });
  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe('smoothstep', () => {
  it('returns 0 below edge0', () => {
    expect(smoothstep(0.2, 0.8, 0.1)).toBe(0);
  });
  it('returns 1 above edge1', () => {
    expect(smoothstep(0.2, 0.8, 0.9)).toBe(1);
  });
  it('returns 0.5 at midpoint', () => {
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });
  it('is symmetric', () => {
    const a = smoothstep(0, 1, 0.25);
    const b = smoothstep(0, 1, 0.75);
    expect(a + b).toBeCloseTo(1, 10);
  });
});

describe('remap', () => {
  it('maps inMin to outMin', () => {
    expect(remap(0, 0, 10, 100, 200)).toBe(100);
  });
  it('maps inMax to outMax', () => {
    expect(remap(10, 0, 10, 100, 200)).toBe(200);
  });
  it('maps midpoint correctly', () => {
    expect(remap(5, 0, 10, 100, 200)).toBe(150);
  });
  it('defaults to [0,1] output range', () => {
    expect(remap(5, 0, 10)).toBe(0.5);
  });
});

describe('sectionProgress', () => {
  it('returns 0 before segment start', () => {
    expect(sectionProgress(0.1, 0.3, 0.6)).toBe(0);
  });
  it('returns 1 after segment end', () => {
    expect(sectionProgress(0.8, 0.3, 0.6)).toBe(1);
  });
  it('returns 0.5 at segment midpoint', () => {
    expect(sectionProgress(0.45, 0.3, 0.6)).toBeCloseTo(0.5, 10);
  });
  it('returns 0 at exact segment start', () => {
    expect(sectionProgress(0.3, 0.3, 0.6)).toBe(0);
  });
  it('returns 1 at exact segment end', () => {
    expect(sectionProgress(0.6, 0.3, 0.6)).toBe(1);
  });
});
