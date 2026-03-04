import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sampleSurfacePoints } from './geometry';
import type { ParticleCloudProps } from './types';

/* ───────── shaders ───────── */

const VERT = /* glsl */ `
precision highp float;

attribute float aSeed;
attribute float aAngle;

uniform float uTime;
uniform float uPointSize;
uniform float uDrift;
uniform float uPulse;
uniform float uSwarmAngle;
uniform float uSwarmFocus;
uniform float uOrbitSpeed;

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
  vec3 pos = position;

  // Gentle drift from noise field
  vec3 n = vec3(
    noise(pos * 1.2 + vec3(uTime * 0.2 + aSeed * 10.0)),
    noise(pos * 1.2 + vec3(uTime * 0.2 + aSeed * 10.0 + 19.0)),
    noise(pos * 1.2 + vec3(uTime * 0.2 + aSeed * 10.0 + 47.0))
  ) - 0.5;

  pos += n * uDrift;

  // ── Orbital motion ──
  // Offset each particle's angle by time-based orbit
  float orbitAngle = aAngle + uTime * uOrbitSpeed;

  // ── Swarm contraction ──
  // Compute angular distance between this particle and the swarm center
  float delta = orbitAngle - uSwarmAngle;
  // Wrap to [-PI, PI]
  delta = mod(delta + 3.14159265, 6.28318530) - 3.14159265;
  float absDelta = abs(delta);

  // Proximity factor: 1.0 at swarm center, 0.0 at opposite side
  float proximity = smoothstep(3.14159265, 0.0, absDelta);

  // Contract particle angle toward swarm center
  float contraction = uSwarmFocus * proximity * delta * 0.6;
  // Rebuild XZ position from contracted angle
  float ringRadius = length(vec2(pos.x, pos.z));
  float newAngle = orbitAngle - contraction;
  pos.x = ringRadius * cos(newAngle);
  pos.z = ringRadius * sin(newAngle);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Size attenuates with distance, boosted near swarm
  float sizeBoost = 1.0 + proximity * uSwarmFocus * 0.8;
  float size = uPointSize * sizeBoost * (1.0 / max(0.001, -mv.z));
  gl_PointSize = clamp(size, 0.5, 64.0);

  // Pulsing alpha + swarm brightness boost
  float pulse = 0.6 + 0.4 * sin(uTime * uPulse + aSeed * 6.28);
  float alphaBoost = 1.0 + proximity * uSwarmFocus * 0.5;
  vAlpha = pulse * alphaBoost;
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

  // Soft circle
  float a = smoothstep(0.5, 0.0, d);
  float alpha = a * vAlpha * uOpacity;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(uColor, alpha);
}
`;

/* ───────── uniform type ───────── */

type Uniforms = {
  uTime: { value: number };
  uPointSize: { value: number };
  uDrift: { value: number };
  uPulse: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
  uSwarmAngle: { value: number };
  uSwarmFocus: { value: number };
  uOrbitSpeed: { value: number };
};

/* ───────── component ───────── */

/**
 * Renders a cloud of particles distributed on the surface of a geometry.
 *
 * Particles gently drift with noise-based turbulence and pulse in opacity.
 * This is a static cloud — no morphing or transitions. Use `ParticlesMorph`
 * when you need to animate between two shapes.
 *
 * Multiple `<ParticleCloud />` components can be composed in the same scene.
 */
export const ParticleCloud = forwardRef<THREE.Points, ParticleCloudProps>(
  function ParticleCloud(
    {
      geometry,
      name,
      count = 30_000,
      pointSize = 2.0,
      drift = 0.15,
      pulse = 1.0,
      color = '#ffffff',
      opacity = 0.8,
      position,
      rotation,
      scale,
      swarmSpeed = 0,
      swarmFocus = 0.6,
      orbitSpeed = 0,
    },
    ref,
  ) {
    const pointsRef = useRef<THREE.Points | null>(null);

    const { geo, uniforms, material } = useMemo(() => {
      const positions = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      const angle = new Float32Array(count);

      sampleSurfacePoints(geometry, count, positions);
      for (let i = 0; i < count; i++) {
        seed[i] = Math.random();
        // Compute angle on the ring (atan2 of x,z)
        const i3 = i * 3;
        angle[i] = Math.atan2(positions[i3 + 2], positions[i3]);
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      g.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1));

      const u: Uniforms = {
        uTime: { value: 0 },
        uPointSize: { value: pointSize },
        uDrift: { value: drift },
        uPulse: { value: pulse },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uSwarmAngle: { value: 0 },
        uSwarmFocus: { value: swarmSpeed > 0 ? swarmFocus : 0 },
        uOrbitSpeed: { value: orbitSpeed },
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
    }, [geometry, count, pointSize, drift, pulse, color, opacity, swarmSpeed, swarmFocus, orbitSpeed]);

    // Keep uniforms in sync
    useEffect(() => {
      uniforms.uPointSize.value = pointSize;
      uniforms.uDrift.value = drift;
      uniforms.uPulse.value = pulse;
      uniforms.uColor.value.set(color);
      uniforms.uOpacity.value = opacity;
      uniforms.uSwarmFocus.value = swarmSpeed > 0 ? swarmFocus : 0;
      uniforms.uOrbitSpeed.value = orbitSpeed;
    }, [uniforms, pointSize, drift, pulse, color, opacity, swarmSpeed, swarmFocus]);

    useEffect(() => {
      return () => {
        geo.dispose();
        material.dispose();
      };
    }, [geo, material]);

    useFrame((_, delta) => {
      uniforms.uTime.value += delta;
      if (swarmSpeed > 0) {
        uniforms.uSwarmAngle.value += swarmSpeed * delta;
      }
    });

    useImperativeHandle(ref, () => pointsRef.current as THREE.Points, []);

    return (
      <points
        ref={pointsRef}
        name={name}
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
