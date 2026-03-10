import type {
  PlasmaToroidDirectionMode,
  PlasmaToroidTuning,
  PlasmaToroidVector3,
  PlasmaToroidWaveChannel,
} from './plasmaToroidTuning';

export const TAU = Math.PI * 2;

type UniformName =
  | 'uMajorRadius'
  | 'uMinorRadius'
  | 'uHaloSpread'
  | 'uOrbitThetaSpeed'
  | 'uOrbitPhiSpeed'
  | 'uOrbitThetaDirectionMode'
  | 'uThetaDriftAmp'
  | 'uThetaDriftFreqTheta'
  | 'uThetaDriftFreqPhi'
  | 'uThetaDriftSpeed'
  | 'uPhiDriftAmp'
  | 'uPhiDriftFreqTheta'
  | 'uPhiDriftFreqPhi'
  | 'uPhiDriftSpeed'
  | 'uRingWobbleAmp'
  | 'uRingWobbleFreqTheta'
  | 'uRingWobbleFreqPhi'
  | 'uRingWobbleSpeed'
  | 'uRadialWobbleAmp'
  | 'uRadialWobbleFreqTheta'
  | 'uRadialWobbleFreqPhi'
  | 'uRadialWobbleSpeed'
  | 'uBinormalWobbleAmp'
  | 'uBinormalWobbleFreqTheta'
  | 'uBinormalWobbleFreqPhi'
  | 'uBinormalWobbleSpeed'
  | 'uTangentWobbleAmp'
  | 'uTangentWobbleFreqTheta'
  | 'uTangentWobbleFreqPhi'
  | 'uTangentWobbleSpeed'
  | 'uWarpEnabled'
  | 'uWarpAmpX'
  | 'uWarpAmpY'
  | 'uWarpAmpZ'
  | 'uWarpFreqTheta'
  | 'uWarpFreqPhi'
  | 'uWarpSpeed'
  | 'uDensityBase'
  | 'uDensityAmp1'
  | 'uDensityFreqTheta1'
  | 'uDensityFreqPhi1'
  | 'uDensitySpeed1'
  | 'uDensityAmp2'
  | 'uDensityFreqTheta2'
  | 'uDensityFreqPhi2'
  | 'uDensitySpeed2'
  | 'uPointSize'
  | 'uPointSizeVariance'
  | 'uAlpha'
  | 'uSoftness';

export type PlasmaToroidUniformConfig = Record<UniformName, number>;

export interface ToroidParticleSample {
  theta0: number;
  phi0: number;
  speedTheta: number;
  speedPhi: number;
  thetaDirectionSeed?: number;
  time: number;
  phase: number;
  radialJitter: number;
  band: number;
}

export interface ToroidFieldSample {
  theta: number;
  phi: number;
  majorRadius: number;
  density: number;
  radialOffset: number;
  binormalOffset: number;
  tangentOffset: number;
  warpOffset: PlasmaToroidVector3;
  position: PlasmaToroidVector3;
}

const PHASE_MULTIPLIERS = {
  phiDrift: 1.17,
  ring: 0.73,
  binormal: 1.31,
  tangent: 0.61,
  density2: 1.91,
  warpX: 0.71,
  warpY: 1.17,
  warpZ: 1.53,
} as const;

const ZERO_VECTOR: PlasmaToroidVector3 = { x: 0, y: 0, z: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function sampleWaveChannel(
  channel: PlasmaToroidWaveChannel,
  theta: number,
  phi: number,
  time: number,
  phaseOffset = 0,
) {
  return channel.amplitude * Math.sin(
    theta * channel.thetaFrequency +
      phi * channel.phiFrequency +
      time * channel.speed +
      phaseOffset,
  );
}

export function getPlasmaToroidUniformConfig(
  tuning: PlasmaToroidTuning,
): PlasmaToroidUniformConfig {
  return {
    uMajorRadius: tuning.geometry.majorRadius,
    uMinorRadius: tuning.geometry.minorRadius,
    uHaloSpread: tuning.geometry.haloSpread,
    uOrbitThetaSpeed: tuning.orbit.aroundRingSpeed,
    uOrbitPhiSpeed: tuning.orbit.aroundTubeSpeed,
    uOrbitThetaDirectionMode: directionModeToUniform(tuning.orbit.aroundRingDirection),
    uThetaDriftAmp: tuning.flow.thetaDrift.amplitude,
    uThetaDriftFreqTheta: tuning.flow.thetaDrift.thetaFrequency,
    uThetaDriftFreqPhi: tuning.flow.thetaDrift.phiFrequency,
    uThetaDriftSpeed: tuning.flow.thetaDrift.speed,
    uPhiDriftAmp: tuning.flow.phiDrift.amplitude,
    uPhiDriftFreqTheta: tuning.flow.phiDrift.thetaFrequency,
    uPhiDriftFreqPhi: tuning.flow.phiDrift.phiFrequency,
    uPhiDriftSpeed: tuning.flow.phiDrift.speed,
    uRingWobbleAmp: tuning.wobble.ring.amplitude,
    uRingWobbleFreqTheta: tuning.wobble.ring.thetaFrequency,
    uRingWobbleFreqPhi: tuning.wobble.ring.phiFrequency,
    uRingWobbleSpeed: tuning.wobble.ring.speed,
    uRadialWobbleAmp: tuning.wobble.radial.amplitude,
    uRadialWobbleFreqTheta: tuning.wobble.radial.thetaFrequency,
    uRadialWobbleFreqPhi: tuning.wobble.radial.phiFrequency,
    uRadialWobbleSpeed: tuning.wobble.radial.speed,
    uBinormalWobbleAmp: tuning.wobble.binormal.amplitude,
    uBinormalWobbleFreqTheta: tuning.wobble.binormal.thetaFrequency,
    uBinormalWobbleFreqPhi: tuning.wobble.binormal.phiFrequency,
    uBinormalWobbleSpeed: tuning.wobble.binormal.speed,
    uTangentWobbleAmp: tuning.wobble.tangent.amplitude,
    uTangentWobbleFreqTheta: tuning.wobble.tangent.thetaFrequency,
    uTangentWobbleFreqPhi: tuning.wobble.tangent.phiFrequency,
    uTangentWobbleSpeed: tuning.wobble.tangent.speed,
    uWarpEnabled: tuning.warp.enabled ? 1 : 0,
    uWarpAmpX: tuning.warp.amount.x,
    uWarpAmpY: tuning.warp.amount.y,
    uWarpAmpZ: tuning.warp.amount.z,
    uWarpFreqTheta: tuning.warp.thetaFrequency,
    uWarpFreqPhi: tuning.warp.phiFrequency,
    uWarpSpeed: tuning.warp.speed,
    uDensityBase: tuning.density.base,
    uDensityAmp1: tuning.density.layer1.amplitude,
    uDensityFreqTheta1: tuning.density.layer1.thetaFrequency,
    uDensityFreqPhi1: tuning.density.layer1.phiFrequency,
    uDensitySpeed1: tuning.density.layer1.speed,
    uDensityAmp2: tuning.density.layer2.amplitude,
    uDensityFreqTheta2: tuning.density.layer2.thetaFrequency,
    uDensityFreqPhi2: tuning.density.layer2.phiFrequency,
    uDensitySpeed2: tuning.density.layer2.speed,
    uPointSize: tuning.render.pointSize,
    uPointSizeVariance: tuning.render.pointSizeVariance,
    uAlpha: tuning.render.alpha,
    uSoftness: tuning.render.softness,
  };
}

export function resolveRingDirection(
  mode: PlasmaToroidDirectionMode,
  seed = 0,
) {
  if (mode === 'forward') {
    return 1;
  }

  if (mode === 'reverse') {
    return -1;
  }

  return seed < 0.85 ? 1 : -1;
}

function directionModeToUniform(mode: PlasmaToroidDirectionMode) {
  return mode === 'forward' ? 1 : mode === 'reverse' ? -1 : 0;
}

export function sampleToroidField(
  tuning: PlasmaToroidTuning,
  sample: ToroidParticleSample,
): ToroidFieldSample {
  const ringDirection = resolveRingDirection(
    tuning.orbit.aroundRingDirection,
    sample.thetaDirectionSeed,
  );

  let theta =
    sample.theta0 +
    sample.time * sample.speedTheta * tuning.orbit.aroundRingSpeed * ringDirection;
  let phi = sample.phi0 + sample.time * sample.speedPhi * tuning.orbit.aroundTubeSpeed;

  theta += sampleWaveChannel(
    tuning.flow.thetaDrift,
    theta,
    phi,
    sample.time,
    sample.phase,
  );

  phi += sampleWaveChannel(
    tuning.flow.phiDrift,
    theta,
    phi,
    sample.time,
    sample.phase * PHASE_MULTIPLIERS.phiDrift,
  );

  const ringOffset = sampleWaveChannel(
    tuning.wobble.ring,
    theta,
    phi,
    sample.time,
    sample.phase * PHASE_MULTIPLIERS.ring,
  );

  const haloOffset =
    sample.radialJitter *
    (0.05 + mix(0, tuning.geometry.haloSpread, sample.band));

  const radialOffset =
    sampleWaveChannel(
      tuning.wobble.radial,
      theta,
      phi,
      sample.time,
      sample.phase,
    ) + haloOffset;

  const binormalOffset = sampleWaveChannel(
    tuning.wobble.binormal,
    theta,
    phi,
    sample.time,
    sample.phase * PHASE_MULTIPLIERS.binormal,
  );

  const tangentOffset = sampleWaveChannel(
    tuning.wobble.tangent,
    theta,
    phi,
    sample.time,
    sample.phase * PHASE_MULTIPLIERS.tangent,
  );

  const density = clamp(
    tuning.density.base +
      sampleWaveChannel(
        tuning.density.layer1,
        theta,
        phi,
        sample.time,
      ) +
      sampleWaveChannel(
        tuning.density.layer2,
        theta,
        phi,
        sample.time,
        sample.phase * PHASE_MULTIPLIERS.density2,
      ),
    0,
    1,
  );

  const warpOffset = tuning.warp.enabled
    ? {
        x:
          Math.sin(
            theta * tuning.warp.thetaFrequency +
              phi * tuning.warp.phiFrequency +
              sample.time * tuning.warp.speed +
              sample.phase * PHASE_MULTIPLIERS.warpX,
          ) * tuning.warp.amount.x,
        y:
          Math.sin(
            theta * (tuning.warp.thetaFrequency + 0.9) -
              phi * (tuning.warp.phiFrequency + 0.35) -
              sample.time * (tuning.warp.speed * 1.17) +
              sample.phase * PHASE_MULTIPLIERS.warpY,
          ) * tuning.warp.amount.y,
        z:
          Math.sin(
            theta * (tuning.warp.thetaFrequency - 0.55) +
              phi * (tuning.warp.phiFrequency + 0.7) +
              sample.time * (tuning.warp.speed * 0.91) +
              sample.phase * PHASE_MULTIPLIERS.warpZ,
          ) * tuning.warp.amount.z,
      }
    : ZERO_VECTOR;

  const majorRadius = tuning.geometry.majorRadius + ringOffset;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const center = {
    x: cosTheta * majorRadius,
    y: 0,
    z: sinTheta * majorRadius,
  };

  const tubeDirection = {
    x: cosTheta * cosPhi,
    y: sinPhi,
    z: sinTheta * cosPhi,
  };

  const tangent = {
    x: -sinTheta,
    y: 0,
    z: cosTheta,
  };

  return {
    theta,
    phi,
    majorRadius,
    density,
    radialOffset,
    binormalOffset,
    tangentOffset,
    warpOffset,
    position: {
      x:
        center.x +
        tubeDirection.x * (tuning.geometry.minorRadius + radialOffset) +
        tangent.x * tangentOffset +
        warpOffset.x,
      y:
        center.y +
        tubeDirection.y * (tuning.geometry.minorRadius + radialOffset) +
        binormalOffset +
        warpOffset.y,
      z:
        center.z +
        tubeDirection.z * (tuning.geometry.minorRadius + radialOffset) +
        tangent.z * tangentOffset +
        warpOffset.z,
    },
  };
}
