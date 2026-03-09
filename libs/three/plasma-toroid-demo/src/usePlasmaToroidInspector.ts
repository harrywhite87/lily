import { useDebugControls } from '@lilypad/debug';
import type { FlatValues } from '@lilypad/debug';

/* ─────────────────── tuning type ─────────────────── */

export interface PlasmaToroidTuning {
  particleCount: number;
  majorRadius: number;
  minorRadius: number;

  majorNoiseAmp1: number;
  majorNoiseAmp2: number;

  tubeNoiseAmp1: number;
  tubeNoiseAmp2: number;
  tubeNoiseAmp3: number;

  densityBase: number;
  densityAmp1: number;
  densityAmp2: number;

  pointSize: number;
  pointSizeVariance: number;
  alpha: number;
  softness: number;
  haloSpread: number;

  autoRotateSpeed: number;
}

export const DEFAULT_PLASMA_TOROID_TUNING: PlasmaToroidTuning = {
  particleCount: 40_000,
  majorRadius: 1.4,
  minorRadius: 0.32,

  majorNoiseAmp1: 0.05,
  majorNoiseAmp2: 0.025,

  tubeNoiseAmp1: 0.06,
  tubeNoiseAmp2: 0.035,
  tubeNoiseAmp3: 0.02,

  densityBase: 0.58,
  densityAmp1: 0.24,
  densityAmp2: 0.16,

  pointSize: 6.0,
  pointSizeVariance: 0.45,
  alpha: 0.8,
  softness: 1.0,
  haloSpread: 0.07,

  autoRotateSpeed: 0.4,
};

/* ─────────────────── hook ─────────────────── */

export function usePlasmaToroidInspector(
  initial: PlasmaToroidTuning = DEFAULT_PLASMA_TOROID_TUNING,
): PlasmaToroidTuning {
  const values = useDebugControls('Plasma Toroid', {
    particleCount:   { value: initial.particleCount,   min: 5000,  max: 120_000, step: 5000 },
    majorRadius:     { value: initial.majorRadius,     min: 0.5,   max: 4.0,     step: 0.05 },
    minorRadius:     { value: initial.minorRadius,     min: 0.05,  max: 1.5,     step: 0.01 },

    majorNoiseAmp1:  { value: initial.majorNoiseAmp1,  min: 0,     max: 0.3,     step: 0.005 },
    majorNoiseAmp2:  { value: initial.majorNoiseAmp2,  min: 0,     max: 0.2,     step: 0.005 },

    tubeNoiseAmp1:   { value: initial.tubeNoiseAmp1,   min: 0,     max: 0.3,     step: 0.005 },
    tubeNoiseAmp2:   { value: initial.tubeNoiseAmp2,   min: 0,     max: 0.2,     step: 0.005 },
    tubeNoiseAmp3:   { value: initial.tubeNoiseAmp3,   min: 0,     max: 0.15,    step: 0.005 },

    densityBase:     { value: initial.densityBase,     min: 0.1,   max: 1.0,     step: 0.01 },
    densityAmp1:     { value: initial.densityAmp1,     min: 0,     max: 0.5,     step: 0.01 },
    densityAmp2:     { value: initial.densityAmp2,     min: 0,     max: 0.4,     step: 0.01 },

    pointSize:       { value: initial.pointSize,       min: 1.0,   max: 20.0,    step: 0.5 },
    pointSizeVariance: { value: initial.pointSizeVariance, min: 0, max: 1.0,     step: 0.05 },
    alpha:           { value: initial.alpha,            min: 0.05,  max: 1.0,     step: 0.05 },
    softness:        { value: initial.softness,        min: 0.1,   max: 2.0,     step: 0.05 },
    haloSpread:      { value: initial.haloSpread,      min: 0,     max: 0.3,     step: 0.005 },

    autoRotateSpeed: { value: initial.autoRotateSpeed, min: 0,     max: 3.0,     step: 0.1 },
  });

  return valuesToTuning(values);
}

function valuesToTuning(v: FlatValues): PlasmaToroidTuning {
  return {
    particleCount:   v.particleCount   as number,
    majorRadius:     v.majorRadius     as number,
    minorRadius:     v.minorRadius     as number,

    majorNoiseAmp1:  v.majorNoiseAmp1  as number,
    majorNoiseAmp2:  v.majorNoiseAmp2  as number,

    tubeNoiseAmp1:   v.tubeNoiseAmp1   as number,
    tubeNoiseAmp2:   v.tubeNoiseAmp2   as number,
    tubeNoiseAmp3:   v.tubeNoiseAmp3   as number,

    densityBase:     v.densityBase     as number,
    densityAmp1:     v.densityAmp1     as number,
    densityAmp2:     v.densityAmp2     as number,

    pointSize:       v.pointSize       as number,
    pointSizeVariance: v.pointSizeVariance as number,
    alpha:           v.alpha           as number,
    softness:        v.softness        as number,
    haloSpread:      v.haloSpread      as number,

    autoRotateSpeed: v.autoRotateSpeed as number,
  };
}
