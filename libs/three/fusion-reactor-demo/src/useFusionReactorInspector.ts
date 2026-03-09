import { useDebugControls } from '@lilypad/debug';
import type { FlatValues } from '@lilypad/debug';

/* ─────────────────── tuning type ─────────────────── */

export interface FusionReactorTuning {
  particleCount: number;
  ringFraction: number;
  ringRadius: number;
  ringTube: number;
  noiseStrength: number;
  animSpeed: number;
  pointSizeMin: number;
  pointSizeMax: number;
  autoRotateSpeed: number;
  hotspotDist: number;
}

export const DEFAULT_FUSION_REACTOR_TUNING: FusionReactorTuning = {
  particleCount: 25_000,
  ringFraction: 0.70,
  ringRadius: 3.0,
  ringTube: 0.35,
  noiseStrength: 0.35,
  animSpeed: 0.15,
  pointSizeMin: 0.5,
  pointSizeMax: 2.0,
  autoRotateSpeed: 0.4,
  hotspotDist: 5.5,
};

/* ─────────────────── hook ─────────────────── */

export function useFusionReactorInspector(
  initial: FusionReactorTuning = DEFAULT_FUSION_REACTOR_TUNING,
): FusionReactorTuning {
  const values = useDebugControls('Fusion Reactor', {
    particleCount: { value: initial.particleCount, min: 1000, max: 200_000, step: 1000 },
    ringFraction:  { value: initial.ringFraction,  min: 0.1,  max: 0.95,   step: 0.05 },
    ringRadius:    { value: initial.ringRadius,    min: 1.0,  max: 8.0,    step: 0.1 },
    ringTube:      { value: initial.ringTube,      min: 0.05, max: 2.0,    step: 0.05 },
    noiseStrength: { value: initial.noiseStrength, min: 0,    max: 2.0,    step: 0.01 },
    animSpeed:     { value: initial.animSpeed,     min: 0.01, max: 1.0,    step: 0.01 },
    pointSizeMin:  { value: initial.pointSizeMin,  min: 0.01, max: 10.0,   step: 0.01 },
    pointSizeMax:  { value: initial.pointSizeMax,  min: 0.01, max: 20.0,   step: 0.01 },
    autoRotateSpeed: { value: initial.autoRotateSpeed, min: 0, max: 5.0,   step: 0.1 },
    hotspotDist:   { value: initial.hotspotDist,   min: 3.0,  max: 12.0,   step: 0.1 },
  });

  return valuesToTuning(values);
}

function valuesToTuning(v: FlatValues): FusionReactorTuning {
  return {
    particleCount:   v.particleCount as number,
    ringFraction:    v.ringFraction  as number,
    ringRadius:      v.ringRadius    as number,
    ringTube:        v.ringTube      as number,
    noiseStrength:   v.noiseStrength as number,
    animSpeed:       v.animSpeed     as number,
    pointSizeMin:    v.pointSizeMin  as number,
    pointSizeMax:    v.pointSizeMax  as number,
    autoRotateSpeed: v.autoRotateSpeed as number,
    hotspotDist:     v.hotspotDist   as number,
  };
}
