import { describe, expect, it } from 'vitest';
import { sampleToroidField } from './plasmaToroidField';
import { DEFAULT_PLASMA_TOROID_TUNING } from './plasmaToroidTuning';

const baseSample = {
  theta0: 0.61,
  phi0: 1.12,
  speedTheta: 0.8,
  speedPhi: -0.35,
  thetaDirectionSeed: 0.2,
  time: 1.7,
  phase: 0.93,
  radialJitter: 0,
  band: 0,
};

describe('sampleToroidField', () => {
  it('scales base orbit speed around the ring and tube', () => {
    const baseTuning = {
      ...DEFAULT_PLASMA_TOROID_TUNING,
      orbit: {
        aroundRingDirection: 'forward' as const,
        aroundRingSpeed: 1,
        aroundTubeSpeed: 1,
      },
      flow: {
        thetaDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.thetaDrift, amplitude: 0 },
        phiDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.phiDrift, amplitude: 0 },
      },
    };

    const frozenOrbit = sampleToroidField(
      {
        ...baseTuning,
        orbit: {
          ...baseTuning.orbit,
          aroundRingSpeed: 0,
          aroundTubeSpeed: 0,
        },
      },
      baseSample,
    );

    const movingOrbit = sampleToroidField(baseTuning, baseSample);

    expect(frozenOrbit.theta).toBeCloseTo(baseSample.theta0, 10);
    expect(frozenOrbit.phi).toBeCloseTo(baseSample.phi0, 10);
    expect(movingOrbit.theta).not.toBeCloseTo(baseSample.theta0, 3);
    expect(movingOrbit.phi).not.toBeCloseTo(baseSample.phi0, 3);
  });

  it('supports forward, reverse, and mixed ring direction modes', () => {
    const tuning = {
      ...DEFAULT_PLASMA_TOROID_TUNING,
      orbit: {
        aroundRingDirection: 'forward' as const,
        aroundRingSpeed: 1,
        aroundTubeSpeed: 1,
      },
      flow: {
        thetaDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.thetaDrift, amplitude: 0 },
        phiDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.phiDrift, amplitude: 0 },
      },
    };

    const forward = sampleToroidField(tuning, baseSample);
    const reverse = sampleToroidField(
      {
        ...tuning,
        orbit: {
          ...tuning.orbit,
          aroundRingDirection: 'reverse',
        },
      },
      baseSample,
    );
    const mixedReverse = sampleToroidField(
      {
        ...tuning,
        orbit: {
          ...tuning.orbit,
          aroundRingDirection: 'mixed',
        },
      },
      {
        ...baseSample,
        thetaDirectionSeed: 0.95,
      },
    );

    expect(forward.theta).toBeGreaterThan(baseSample.theta0);
    expect(reverse.theta).toBeLessThan(baseSample.theta0);
    expect(mixedReverse.theta).toBeLessThan(baseSample.theta0);
  });

  it('keeps channels isolated when only radial wobble is enabled', () => {
    const tuning = {
      ...DEFAULT_PLASMA_TOROID_TUNING,
      wobble: {
        ring: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.ring, amplitude: 0 },
        radial: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.radial, amplitude: 0.12 },
        binormal: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.binormal, amplitude: 0 },
        tangent: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.tangent, amplitude: 0 },
      },
      warp: {
        ...DEFAULT_PLASMA_TOROID_TUNING.warp,
        enabled: false,
        amount: { x: 0, y: 0, z: 0 },
      },
      flow: {
        thetaDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.thetaDrift, amplitude: 0 },
        phiDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.phiDrift, amplitude: 0 },
      },
    };

    const result = sampleToroidField(tuning, baseSample);
    expect(Math.abs(result.radialOffset)).toBeGreaterThan(0.001);
    expect(result.binormalOffset).toBeCloseTo(0, 10);
    expect(result.tangentOffset).toBeCloseTo(0, 10);
    expect(result.warpOffset.x).toBeCloseTo(0, 10);
    expect(result.warpOffset.y).toBeCloseTo(0, 10);
    expect(result.warpOffset.z).toBeCloseTo(0, 10);
  });

  it('adds binormal and tangent motion independently', () => {
    const tuning = {
      ...DEFAULT_PLASMA_TOROID_TUNING,
      wobble: {
        ring: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.ring, amplitude: 0 },
        radial: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.radial, amplitude: 0 },
        binormal: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.binormal, amplitude: 0.08 },
        tangent: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.tangent, amplitude: 0.07 },
      },
      warp: {
        ...DEFAULT_PLASMA_TOROID_TUNING.warp,
        enabled: false,
        amount: { x: 0, y: 0, z: 0 },
      },
      flow: {
        thetaDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.thetaDrift, amplitude: 0 },
        phiDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.phiDrift, amplitude: 0 },
      },
    };

    const result = sampleToroidField(tuning, baseSample);
    expect(result.radialOffset).toBeCloseTo(0, 10);
    expect(Math.abs(result.binormalOffset)).toBeGreaterThan(0.001);
    expect(Math.abs(result.tangentOffset)).toBeGreaterThan(0.001);
  });

  it('enables per-axis xyz warp without changing local wobble channels', () => {
    const tuning = {
      ...DEFAULT_PLASMA_TOROID_TUNING,
      wobble: {
        ring: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.ring, amplitude: 0 },
        radial: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.radial, amplitude: 0 },
        binormal: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.binormal, amplitude: 0 },
        tangent: { ...DEFAULT_PLASMA_TOROID_TUNING.wobble.tangent, amplitude: 0 },
      },
      warp: {
        ...DEFAULT_PLASMA_TOROID_TUNING.warp,
        enabled: true,
        amount: { x: 0.07, y: 0.05, z: 0.09 },
      },
      flow: {
        thetaDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.thetaDrift, amplitude: 0 },
        phiDrift: { ...DEFAULT_PLASMA_TOROID_TUNING.flow.phiDrift, amplitude: 0 },
      },
    };

    const result = sampleToroidField(tuning, baseSample);
    expect(result.radialOffset).toBeCloseTo(0, 10);
    expect(result.binormalOffset).toBeCloseTo(0, 10);
    expect(result.tangentOffset).toBeCloseTo(0, 10);
    expect(Math.abs(result.warpOffset.x)).toBeGreaterThan(0.001);
    expect(Math.abs(result.warpOffset.y)).toBeGreaterThan(0.001);
    expect(Math.abs(result.warpOffset.z)).toBeGreaterThan(0.001);
  });
});
