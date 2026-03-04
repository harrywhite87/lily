import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { SwarmProps } from './types';

/* ───────── shaders ───────── */

const VERT = /* glsl */ `
precision highp float;

attribute float aSeed;
attribute float aU;     // initial angle around the ring (0..2π)
attribute float aV;     // angle within the tube cross-section (0..2π)
attribute float aSpeed; // orbit speed (rad/s)

uniform float uTime;
uniform float uRingRadius;
uniform float uTubeRadius;
uniform float uPointSize;
uniform float uDrift;
uniform float uPulse;
uniform float uDensityWaves;
uniform float uDensityStrength;

varying float vAlpha;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);

  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

void main() {
  // Advance the ring angle over time — each particle at its own speed
  float u = aU + uTime * aSpeed;
  float v = aV;

  // Torus parametric equations — ring lies flat in XZ plane, Y is up
  float outerR = uRingRadius + uTubeRadius * cos(v);
  vec3 pos = vec3(
    outerR * cos(u),
    uTubeRadius * sin(v),
    outerR * sin(u)
  );

  // Organic drift via noise
  vec3 noiseCoord = vec3(pos.x * 0.4, pos.z * 0.4, uTime * 0.15 + aSeed * 10.0);
  vec3 n = vec3(
    noise(noiseCoord),
    noise(noiseCoord + vec3(0.0, 0.0, 19.0)),
    noise(noiseCoord + vec3(0.0, 0.0, 47.0))
  ) - 0.5;
  pos += n * uDrift;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Size attenuates with distance
  float size = uPointSize * (1.0 / max(0.001, -mv.z));
  gl_PointSize = clamp(size, 0.5, 64.0);

  // Base pulse
  float pulse = 0.6 + 0.4 * sin(uTime * uPulse + aSeed * 6.28318);

  // Density modulation: N bright bands evenly around the ring.
  // At band peaks: densityMod = 1.0. At troughs: densityMod = 1.0 - densityStrength.
  float densityMod = (uDensityWaves > 0.0)
    ? (1.0 - uDensityStrength) + uDensityStrength * 0.5 * (1.0 + cos(uDensityWaves * u))
    : 1.0;

  vAlpha = pulse * densityMod;
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float a = smoothstep(0.5, 0.0, d);
  float alpha = a * vAlpha * uOpacity;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(uColor, alpha);
}
`;

/* ───────── helpers ───────── */

/**
 * Rejection-sample an angle biased toward `waves` peaks using
 * f(u) ∝ 1 + strength * cos(waves * u).
 * Falls back to uniform when waves === 0 or strength === 0.
 */
function sampleBiasedAngle(waves: number, strength: number): number {
  if (waves === 0 || strength === 0) return Math.random() * Math.PI * 2;
  const maxDensity = 1 + strength;
  for (;;) {
    const u = Math.random() * Math.PI * 2;
    const density = 1 + strength * Math.cos(waves * u);
    if (Math.random() * maxDensity <= density) return u;
  }
}

/* ───────── uniform type ───────── */

type Uniforms = {
  uTime: { value: number };
  uRingRadius: { value: number };
  uTubeRadius: { value: number };
  uPointSize: { value: number };
  uDrift: { value: number };
  uPulse: { value: number };
  uDensityWaves: { value: number };
  uDensityStrength: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
};

/* ───────── component ───────── */

/**
 * Renders a swarm of particles flowing through a torus (donut) path.
 *
 * The ring lies flat in the XZ plane (horizontal orbit around the Y axis).
 * Each particle orbits at its own individual speed, creating a natural
 * flocking/bunching effect as faster particles overtake slower ones.
 *
 * Use `densityWaves` to create N evenly-spaced dense bands around the ring,
 * and `densityStrength` to control how pronounced the variation is.
 */
export const Swarm = forwardRef<THREE.Points, SwarmProps>(
  function Swarm(
    {
      ringRadius = 3.0,
      tubeRadius = 0.5,
      count = 10_000,
      pointSize = 20,
      speedRange = [0.15, 0.6],
      drift = 0.12,
      pulse = 1.0,
      color = '#ffffff',
      opacity = 0.8,
      densityWaves = 0,
      densityStrength = 0.6,
      position,
      rotation,
      scale,
    },
    ref,
  ) {
    const pointsRef = useRef<THREE.Points | null>(null);

    // Destructure to avoid array-reference churn in useMemo deps
    const [minSpeed, maxSpeed] = speedRange;

    const { geo, uniforms, material } = useMemo(() => {
      const seeds = new Float32Array(count);
      const uAngles = new Float32Array(count);
      const vAngles = new Float32Array(count);
      const speeds = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        seeds[i] = Math.random();
        // Biased initial distribution — more particles start near the density peaks
        uAngles[i] = sampleBiasedAngle(densityWaves, densityStrength * 0.8);
        vAngles[i] = Math.random() * Math.PI * 2;
        speeds[i] = minSpeed + Math.random() * (maxSpeed - minSpeed);
      }

      // Placeholder positions — shader computes actual torus positions.
      // A non-empty position attribute is required so Three.js knows vertex count.
      const positions = new Float32Array(count * 3);

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      g.setAttribute('aU', new THREE.BufferAttribute(uAngles, 1));
      g.setAttribute('aV', new THREE.BufferAttribute(vAngles, 1));
      g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

      const u: Uniforms = {
        uTime: { value: 0 },
        uRingRadius: { value: ringRadius },
        uTubeRadius: { value: tubeRadius },
        uPointSize: { value: pointSize },
        uDrift: { value: drift },
        uPulse: { value: pulse },
        uDensityWaves: { value: densityWaves },
        uDensityStrength: { value: densityStrength },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      };

      const m = new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      return { geo: g, uniforms: u, material: m };
    }, [count, ringRadius, tubeRadius, pointSize, drift, pulse, color, opacity, densityWaves, densityStrength, minSpeed, maxSpeed]);

    // Keep non-structural uniforms in sync without rebuilding geometry
    useEffect(() => {
      uniforms.uRingRadius.value = ringRadius;
      uniforms.uTubeRadius.value = tubeRadius;
      uniforms.uPointSize.value = pointSize;
      uniforms.uDrift.value = drift;
      uniforms.uPulse.value = pulse;
      uniforms.uDensityWaves.value = densityWaves;
      uniforms.uDensityStrength.value = densityStrength;
      uniforms.uColor.value.set(color);
      uniforms.uOpacity.value = opacity;
    }, [uniforms, ringRadius, tubeRadius, pointSize, drift, pulse, densityWaves, densityStrength, color, opacity]);

    useEffect(() => {
      return () => {
        geo.dispose();
        material.dispose();
      };
    }, [geo, material]);

    useFrame((_, delta) => {
      uniforms.uTime.value += delta;
    });

    useImperativeHandle(ref, () => pointsRef.current as THREE.Points, []);

    return (
      <points
        ref={pointsRef}
        geometry={geo}
        frustumCulled={false}
        position={position}
        rotation={rotation}
        scale={scale}
      >
        <primitive object={material} attach="material" />
      </points>
    );
  },
);
