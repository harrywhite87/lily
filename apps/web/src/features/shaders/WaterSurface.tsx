import { useMemo, useRef, type RefObject } from 'react';
import { useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { useScrollProgress } from '@lilypad/scroll';
import * as THREE from 'three';

export interface WaterOverrides {
  waveScale?: number;
  waveDepth?: number;
  waveDrag?: number;
  waveSpeed?: number;
  reflectionStrength?: number;
  scatterStrength?: number;
  sunIntensity?: number;
  exposure?: number;
  timeOfDay?: number;
  animateSun?: boolean;
  sunCycleSpeed?: number;
  normalEpsilon?: number;
  normalSmooth?: number;
  fogNear?: number;
  fogFar?: number;
  fogStrength?: number;
}

export const WATER_OVERRIDE_DEFAULTS: Required<WaterOverrides> = {
  waveScale: 0.38,
  waveDepth: 1.1,
  waveDrag: 1.0,
  waveSpeed: 1.0,
  reflectionStrength: 1.18,
  scatterStrength: 1.0,
  sunIntensity: 0.95,
  exposure: 2.0,
  timeOfDay: 0.0,
  animateSun: false,
  sunCycleSpeed: 0.03,
  normalEpsilon: 0.06,
  normalSmooth: 0.8,
  fogNear: 8.0,
  fogFar: 56.0,
  fogStrength: 0.38,
};

export const WATER_DRAG_MULT = 0.38;
const ITER_WAVES_VERTEX = 18;
const ITER_WAVES_NORMAL = 28;

export function resolveWaterOverrides(overrides?: WaterOverrides): Required<WaterOverrides> {
  return {
    ...WATER_OVERRIDE_DEFAULTS,
    ...(overrides ?? {}),
  };
}

function sampleWave(
  posX: number,
  posZ: number,
  dirX: number,
  dirZ: number,
  frequency: number,
  timeShift: number,
) {
  const x = (dirX * posX + dirZ * posZ) * frequency + timeShift;
  const wave = Math.exp(Math.sin(x) - 1.0);
  const deriv = -wave * Math.cos(x);
  return { wave, deriv };
}

export function sampleWaterWaves(
  x: number,
  z: number,
  time: number,
  wave: WaterOverrides,
  iterations = ITER_WAVES_NORMAL,
) {
  const cfg = resolveWaterOverrides(wave);
  let posX = x * cfg.waveScale;
  let posZ = z * cfg.waveScale;
  const drag = WATER_DRAG_MULT * cfg.waveDrag;
  const wavePhaseShift = Math.hypot(posX, posZ) * 0.1;
  const scaledTime = time * cfg.waveSpeed;

  let iter = 0.0;
  let frequency = 1.0;
  let timeMultiplier = 2.0;
  let weight = 1.0;
  let sumOfValues = 0.0;
  let sumOfWeights = 0.0;

  for (let i = 0; i < iterations; i += 1) {
    const dirX = Math.sin(iter);
    const dirZ = Math.cos(iter);
    const res = sampleWave(
      posX,
      posZ,
      dirX,
      dirZ,
      frequency,
      scaledTime * timeMultiplier + wavePhaseShift,
    );

    posX += dirX * res.deriv * weight * drag;
    posZ += dirZ * res.deriv * weight * drag;

    sumOfValues += res.wave * weight;
    sumOfWeights += weight;

    weight = THREE.MathUtils.lerp(weight, 0.0, 0.2);
    frequency *= 1.18;
    timeMultiplier *= 1.07;
    iter += 1232.399963;
  }

  return sumOfValues / Math.max(sumOfWeights, 1e-6);
}

export function sampleWaterHeight(x: number, z: number, time: number, wave: WaterOverrides) {
  const cfg = resolveWaterOverrides(wave);
  return sampleWaterWaves(x, z, time, cfg, ITER_WAVES_NORMAL) * cfg.waveDepth - cfg.waveDepth;
}

export function sampleWaterNormal(
  x: number,
  z: number,
  time: number,
  wave: WaterOverrides,
  epsilon = WATER_OVERRIDE_DEFAULTS.normalEpsilon,
  target = new THREE.Vector3(),
) {
  const cfg = resolveWaterOverrides(wave);
  const e = Math.max(epsilon, 0.001);
  const h = sampleWaterHeight(x, z, time, cfg);
  const hx = sampleWaterHeight(x + e, z, time, cfg);
  const hz = sampleWaterHeight(x, z + e, time, cfg);

  target.set(-(hx - h) / e, 1.0, -(hz - h) / e);
  return target.normalize();
}

const waterVertexShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uWaveScale;
uniform float uWaveDepth;
uniform float uWaveDrag;
uniform float uWaveSpeed;

varying vec3 vWorldPos;

#define DRAG_MULT 0.38
const int ITER_WAVES_VERTEX = 18;

vec2 wavedx(vec2 position, vec2 direction, float frequency, float timeshift) {
  float x = dot(direction, position) * frequency + timeshift;
  float wave = exp(sin(x) - 1.0);
  float dx = wave * cos(x);
  return vec2(wave, -dx);
}

float getwaves(vec2 position, int iterations, float time) {
  float wavePhaseShift = length(position) * 0.1;
  float iter = 0.0;
  float frequency = 1.0;
  float timeMultiplier = 2.0;
  float weight = 1.0;
  float sumOfValues = 0.0;
  float sumOfWeights = 0.0;

  for (int i = 0; i < 64; i++) {
    if (i >= iterations) {
      break;
    }

    vec2 p = vec2(sin(iter), cos(iter));
    vec2 res = wavedx(position, p, frequency, time * timeMultiplier + wavePhaseShift);

    position += p * res.y * weight * (DRAG_MULT * uWaveDrag);
    sumOfValues += res.x * weight;
    sumOfWeights += weight;

    weight = mix(weight, 0.0, 0.2);
    frequency *= 1.18;
    timeMultiplier *= 1.07;
    iter += 1232.399963;
  }

  return sumOfValues / max(sumOfWeights, 1e-6);
}

float waveHeight(vec2 xz, float time, float depth) {
  return getwaves(xz * uWaveScale, ITER_WAVES_VERTEX, time * uWaveSpeed) * depth - depth;
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  world.y = waveHeight(world.xz, uTime, uWaveDepth);
  vWorldPos = world.xyz;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const waterFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uProgressArea3;
uniform float uWaveScale;
uniform float uWaveDepth;
uniform float uWaveDrag;
uniform float uWaveSpeed;
uniform float uReflectionStrength;
uniform float uScatterStrength;
uniform float uSunIntensity;
uniform float uExposure;
uniform float uTimeOfDay;
uniform float uAnimateSun;
uniform float uSunCycleSpeed;
uniform float uNormalEpsilon;
uniform float uNormalSmooth;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogStrength;
uniform vec3 uFogColor;
uniform float uOpacity;

varying vec3 vWorldPos;

#define DRAG_MULT 0.38
const int ITER_WAVES_NORMAL = 28;

vec2 wavedx(vec2 position, vec2 direction, float frequency, float timeshift) {
  float x = dot(direction, position) * frequency + timeshift;
  float wave = exp(sin(x) - 1.0);
  float dx = wave * cos(x);
  return vec2(wave, -dx);
}

float getwaves(vec2 position, int iterations, float time) {
  float wavePhaseShift = length(position) * 0.1;
  float iter = 0.0;
  float frequency = 1.0;
  float timeMultiplier = 2.0;
  float weight = 1.0;
  float sumOfValues = 0.0;
  float sumOfWeights = 0.0;

  for (int i = 0; i < 64; i++) {
    if (i >= iterations) {
      break;
    }

    vec2 p = vec2(sin(iter), cos(iter));
    vec2 res = wavedx(position, p, frequency, time * timeMultiplier + wavePhaseShift);

    position += p * res.y * weight * (DRAG_MULT * uWaveDrag);
    sumOfValues += res.x * weight;
    sumOfWeights += weight;

    weight = mix(weight, 0.0, 0.2);
    frequency *= 1.18;
    timeMultiplier *= 1.07;
    iter += 1232.399963;
  }

  return sumOfValues / max(sumOfWeights, 1e-6);
}

float waveHeight(vec2 xz, float time, float depth) {
  return getwaves(xz * uWaveScale, ITER_WAVES_NORMAL, time * uWaveSpeed) * depth - depth;
}

vec3 waveNormal(vec2 xz, float time, float depth, float e) {
  float h = waveHeight(xz, time, depth);
  float hx = waveHeight(xz + vec2(e, 0.0), time, depth);
  float hz = waveHeight(xz + vec2(0.0, e), time, depth);

  vec3 p = vec3(xz.x, h, xz.y);
  vec3 px = vec3(xz.x + e, hx, xz.y);
  vec3 pz = vec3(xz.x, hz, xz.y + e);

  vec3 tx = px - p;
  vec3 tz = pz - p;

  return normalize(cross(tz, tx));
}

vec3 getSunDirection(float time) {
  float phase = fract(uTimeOfDay + uAnimateSun * time * uSunCycleSpeed);
  float sunY = 0.5 + sin(phase * 6.28318530718 + 2.6) * 0.45;
  return normalize(vec3(-0.0773502691896258, sunY, 0.5773502691896258));
}

vec3 extra_cheap_atmosphere(vec3 raydir, vec3 sundir) {
  float special_trick = 1.0 / (raydir.y + 0.1);
  float special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
  float raysundt = pow(abs(dot(sundir, raydir)), 2.0);
  float sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
  float mymie = sundt * special_trick * 0.2;
  vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
  vec3 bluesky = vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
  vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick - 6.0 * sundir.y * sundir.y));
  bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
  return bluesky2 * (1.0 + pow(1.0 - raydir.y, 3.0)) + mymie;
}

vec3 getAtmosphere(vec3 dir, float time) {
  return extra_cheap_atmosphere(dir, getSunDirection(time)) * 0.5;
}

float getSun(vec3 dir, float time) {
  return pow(max(0.0, dot(dir, getSunDirection(time))), 720.0) * 210.0;
}

mat3 m1 = mat3(
  0.59719, 0.07600, 0.02840,
  0.35458, 0.90834, 0.13383,
  0.04823, 0.01566, 0.83777
);
mat3 m2 = mat3(
  1.60475, -0.10208, -0.00327,
  -0.53108, 1.10813, -0.07276,
  -0.07367, -0.00605, 1.07602
);

vec3 aces_tonemap(vec3 color) {
  vec3 v = m1 * color;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}

void main() {
  vec3 cam = cameraPosition;
  vec3 V = normalize(cam - vWorldPos);
  vec3 N = waveNormal(vWorldPos.xz, uTime, uWaveDepth, max(uNormalEpsilon, 0.001));

  float dist = length(cam - vWorldPos);
  float smoothAmt = clamp(uNormalSmooth, 0.0, 1.0) * min(1.0, sqrt(dist * 0.01) * 1.1);
  N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothAmt));

  float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - max(0.0, dot(N, V)), 5.0);

  vec3 R = normalize(reflect(-V, N));
  R.y = abs(R.y);

  vec3 reflection = getAtmosphere(R, uTime) + vec3(getSun(R, uTime) * uSunIntensity);

  float depthFactor = 0.2 + (vWorldPos.y + uWaveDepth) / max(uWaveDepth, 1e-6);
  vec3 scattering = vec3(0.0293, 0.0698, 0.1717) * 0.1 * uScatterStrength * clamp(depthFactor, 0.0, 1.0);

  vec3 C = fresnel * reflection * uReflectionStrength + scattering;
  float fogFactor = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 1e-4), 0.0, 1.0);

  // Match water fog to sky color to avoid a dark horizon seam at high fog strengths.
  vec3 fogDir = normalize(-V);
  fogDir.y = abs(fogDir.y);
  vec3 fogSky = getAtmosphere(fogDir, uTime) + vec3(getSun(fogDir, uTime) * uSunIntensity);
  vec3 fogTarget = mix(fogSky, uFogColor, 0.08);

  C = mix(C, fogTarget, fogFactor * uFogStrength);
  C = aces_tonemap(C * uExposure);

  float alpha = smoothstep(0.0, 0.3, uProgressArea3) * uOpacity;
  gl_FragColor = vec4(C, alpha);
}
`;

const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgressArea3: 0,
    uWaveScale: WATER_OVERRIDE_DEFAULTS.waveScale,
    uWaveDepth: WATER_OVERRIDE_DEFAULTS.waveDepth,
    uWaveDrag: WATER_OVERRIDE_DEFAULTS.waveDrag,
    uWaveSpeed: WATER_OVERRIDE_DEFAULTS.waveSpeed,
    uReflectionStrength: WATER_OVERRIDE_DEFAULTS.reflectionStrength,
    uScatterStrength: WATER_OVERRIDE_DEFAULTS.scatterStrength,
    uSunIntensity: WATER_OVERRIDE_DEFAULTS.sunIntensity,
    uExposure: WATER_OVERRIDE_DEFAULTS.exposure,
    uTimeOfDay: WATER_OVERRIDE_DEFAULTS.timeOfDay,
    uAnimateSun: WATER_OVERRIDE_DEFAULTS.animateSun ? 1.0 : 0.0,
    uSunCycleSpeed: WATER_OVERRIDE_DEFAULTS.sunCycleSpeed,
    uNormalEpsilon: WATER_OVERRIDE_DEFAULTS.normalEpsilon,
    uNormalSmooth: WATER_OVERRIDE_DEFAULTS.normalSmooth,
    uFogNear: WATER_OVERRIDE_DEFAULTS.fogNear,
    uFogFar: WATER_OVERRIDE_DEFAULTS.fogFar,
    uFogStrength: WATER_OVERRIDE_DEFAULTS.fogStrength,
    uFogColor: new THREE.Color('#8fb8cf'),
    uOpacity: 0.9,
  },
  waterVertexShader,
  waterFragmentShader,
);

extend({ WaterMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    waterMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uProgressArea3?: number;
      uWaveScale?: number;
      uWaveDepth?: number;
      uWaveDrag?: number;
      uWaveSpeed?: number;
      uReflectionStrength?: number;
      uScatterStrength?: number;
      uSunIntensity?: number;
      uExposure?: number;
      uTimeOfDay?: number;
      uAnimateSun?: number;
      uSunCycleSpeed?: number;
      uNormalEpsilon?: number;
      uNormalSmooth?: number;
      uFogNear?: number;
      uFogFar?: number;
      uFogStrength?: number;
      uFogColor?: THREE.Color;
      uOpacity?: number;
    };
  }
}

interface WaterSurfaceProps {
  standalone?: boolean;
  overrides?: WaterOverrides;
}

function applyMaterialConfig(
  materialRef: RefObject<THREE.ShaderMaterial>,
  cfg: Required<WaterOverrides>,
  progress: number,
  standalone: boolean,
  time: number,
) {
  const mat = materialRef.current;
  if (!mat) {
    return;
  }

  mat.uniforms.uTime.value = time;
  mat.uniforms.uProgressArea3.value = progress;
  mat.uniforms.uWaveScale.value = cfg.waveScale;
  mat.uniforms.uWaveDepth.value = cfg.waveDepth;
  mat.uniforms.uWaveDrag.value = cfg.waveDrag;
  mat.uniforms.uWaveSpeed.value = cfg.waveSpeed;
  mat.uniforms.uReflectionStrength.value = cfg.reflectionStrength;
  mat.uniforms.uScatterStrength.value = cfg.scatterStrength;
  mat.uniforms.uSunIntensity.value = cfg.sunIntensity;
  mat.uniforms.uExposure.value = cfg.exposure;
  mat.uniforms.uTimeOfDay.value = cfg.timeOfDay;
  mat.uniforms.uAnimateSun.value = cfg.animateSun ? 1.0 : 0.0;
  mat.uniforms.uSunCycleSpeed.value = cfg.sunCycleSpeed;
  mat.uniforms.uNormalEpsilon.value = cfg.normalEpsilon;
  mat.uniforms.uNormalSmooth.value = cfg.normalSmooth;
  mat.uniforms.uFogNear.value = cfg.fogNear;
  mat.uniforms.uFogFar.value = cfg.fogFar;
  mat.uniforms.uFogStrength.value = cfg.fogStrength;
  mat.uniforms.uOpacity.value = standalone ? 1.0 : 0.9;
}

export function WaterSurface({ standalone = false, overrides }: WaterSurfaceProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const scrollProgress = standalone ? null : useScrollProgress();
  const c = standalone ? 1.0 : scrollProgress!.c;

  const geometry = useMemo(() => {
    if (standalone) {
      return new THREE.PlaneGeometry(700, 700, 320, 320);
    }
    return new THREE.PlaneGeometry(28, 22, 220, 180);
  }, [standalone]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const fallback = standalone
      ? WATER_OVERRIDE_DEFAULTS
      : {
          ...WATER_OVERRIDE_DEFAULTS,
          waveDepth: 0.86 + c * 0.36,
          reflectionStrength: 0.95 + c * 0.23,
          scatterStrength: 0.8 + c * 0.2,
          sunIntensity: 0.75 + c * 0.2,
          exposure: 1.8 + c * 0.22,
        };
    applyMaterialConfig(materialRef, resolveWaterOverrides(overrides ?? fallback), c, standalone, time);
  });

  const meshPos: [number, number, number] = standalone ? [0, 0, 0] : [7.5, -1.5, -2.0];

  return (
    <mesh
      position={meshPos}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={geometry}
      frustumCulled={false}
    >
      <waterMaterial ref={materialRef} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}
