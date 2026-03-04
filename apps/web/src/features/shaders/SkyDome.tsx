import { useRef } from 'react';
import { useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const skyVertexShader = /* glsl */ `
precision highp float;

varying vec3 vDir;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = normalize(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const skyFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uExposure;
uniform float uSunIntensity;
uniform float uTimeOfDay;
uniform float uAnimateSun;
uniform float uSunCycleSpeed;

varying vec3 vDir;

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
  vec3 dir = normalize(vDir);
  vec3 C = getAtmosphere(dir, uTime) + vec3(getSun(dir, uTime) * uSunIntensity);
  gl_FragColor = vec4(aces_tonemap(C * uExposure), 1.0);
}
`;

const SkyDomeMaterial = shaderMaterial(
  {
    uTime: 0,
    uExposure: 2.0,
    uSunIntensity: 0.95,
    uTimeOfDay: 0.0,
    uAnimateSun: 0.0,
    uSunCycleSpeed: 0.03,
  },
  skyVertexShader,
  skyFragmentShader,
);

extend({ SkyDomeMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    skyDomeMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uExposure?: number;
      uSunIntensity?: number;
      uTimeOfDay?: number;
      uAnimateSun?: number;
      uSunCycleSpeed?: number;
    };
  }
}

interface SkyDomeProps {
  exposure?: number;
  sunIntensity?: number;
  timeOfDay?: number;
  animateSun?: boolean;
  sunCycleSpeed?: number;
  radius?: number;
}

export function SkyDome({
  exposure = 2.0,
  sunIntensity = 0.95,
  timeOfDay = 0.0,
  animateSun = false,
  sunCycleSpeed = 0.03,
  radius = 2000,
}: SkyDomeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ clock, camera }) => {
    if (!materialRef.current || !meshRef.current) {
      return;
    }
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uExposure.value = exposure;
    materialRef.current.uniforms.uSunIntensity.value = sunIntensity;
    materialRef.current.uniforms.uTimeOfDay.value = timeOfDay;
    materialRef.current.uniforms.uAnimateSun.value = animateSun ? 1.0 : 0.0;
    materialRef.current.uniforms.uSunCycleSpeed.value = sunCycleSpeed;
    meshRef.current.position.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <sphereGeometry args={[radius, 64, 64]} />
      <skyDomeMaterial ref={materialRef} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}
