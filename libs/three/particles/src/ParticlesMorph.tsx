import {
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sampleSurfacePoints } from './geometry';
import type { ParticlesMorphProps, ParticleMorphHandle } from './types';

/* ───────── shaders ───────── */

const VERT = /* glsl */ `
precision highp float;

attribute vec3 aStart;
attribute vec3 aEnd;
attribute float aSeed;

uniform float uTime;
uniform float uProgress;
uniform float uPointSize;
uniform float uTurbulence;
uniform vec3 uFromOffset;
uniform vec3 uToOffset;

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

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);

  // turbulence peaks in the middle (0 at ends)
  float mid = sin(p * 3.14159265);

  // base morph
  vec3 pos = mix(aStart + uFromOffset, aEnd + uToOffset, p);

  // turbulence direction from noise
  vec3 n = vec3(
    noise(pos * 1.35 + vec3(uTime * 0.35 + aSeed * 10.0)),
    noise(pos * 1.35 + vec3(uTime * 0.35 + aSeed * 10.0 + 19.0)),
    noise(pos * 1.35 + vec3(uTime * 0.35 + aSeed * 10.0 + 47.0))
  ) - 0.5;

  vec3 dir = n * 2.0;
  float len = max(length(dir), 1e-3);
  dir /= len;

  // turbulence offset scaled by mid
  pos += dir * uTurbulence * mid;

  // subtle swirl for organic feel
  float swirl = (aSeed - 0.5) * 2.2 * mid;
  pos.xy = rot(swirl) * pos.xy;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // size attenuates with distance
  float size = uPointSize * (1.0 / max(0.001, -mv.z));
  gl_PointSize = clamp(size, 0.5, 64.0);

  vAlpha = 0.15 + 0.85 * mid;
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

  // soft circle
  float a = smoothstep(0.5, 0.0, d);
  float alpha = a * vAlpha * uOpacity;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(uColor, alpha);
}
`;

/* ───────── uniform type ───────── */

type Uniforms = {
  uTime: { value: number };
  uProgress: { value: number };
  uPointSize: { value: number };
  uTurbulence: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
  uFromOffset: { value: THREE.Vector3 };
  uToOffset: { value: THREE.Vector3 };
};

/* ───────── component ───────── */

/**
 * GPU particle morph between two geometries.
 *
 * Supports both controlled mode (via `progress` prop or imperative handle)
 * and auto-play mode (smooth ping-pong animation).
 *
 * Use `ref` to access the imperative `ParticleMorphHandle` for
 * programmatic transitions.
 */
export const ParticlesMorph = forwardRef<
  ParticleMorphHandle,
  ParticlesMorphProps
>(function ParticlesMorph(
  {
    from,
    to,
    count = 50_000,
    progress,
    autoPlay,
    pointSize = 2.25,
    turbulence = 1.0,
    color = '#ffffff',
    opacity = 1.0,
    speed = 0.6,
    fromOffset,
    toOffset,
  },
  ref,
) {
  const pointsRef = useRef<THREE.Points | null>(null);

  // Determine if auto-play: explicit prop > fallback to true when progress is undefined
  const shouldAutoPlay =
    autoPlay !== undefined ? autoPlay : progress === undefined;

  const { geometry, uniforms, material } = useMemo(() => {
    const start = new Float32Array(count * 3);
    const end = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    sampleSurfacePoints(from, count, start);
    sampleSurfacePoints(to, count, end);

    for (let i = 0; i < count; i++) seed[i] = Math.random();

    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(start), 3),
    );
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    const u: Uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPointSize: { value: pointSize },
      uTurbulence: { value: turbulence },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uFromOffset: { value: new THREE.Vector3() },
      uToOffset: { value: new THREE.Vector3() },
    };

    const m = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: g, uniforms: u, material: m };
  }, [from, to, count, pointSize, turbulence, color, opacity]);

  // Keep uniforms in sync with props
  useEffect(() => {
    uniforms.uPointSize.value = pointSize;
    uniforms.uTurbulence.value = turbulence;
    uniforms.uColor.value.set(color);
    uniforms.uOpacity.value = opacity;
  }, [uniforms, pointSize, turbulence, color, opacity]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      transition: async (req) => {
        const durationMs = req.durationMs ?? 1000;
        const easing =
          req.easing ?? ((t: number) => t * t * (3 - 2 * t)); // smoothstep

        return new Promise<void>((resolve) => {
          const startTime = performance.now();

          const animate = () => {
            const elapsed = performance.now() - startTime;
            const raw = Math.min(elapsed / durationMs, 1);
            uniforms.uProgress.value = easing(raw);

            if (raw < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(animate);
        });
      },

      setProgress: (p: number) => {
        uniforms.uProgress.value = THREE.MathUtils.clamp(p, 0, 1);
      },
    }),
    [uniforms],
  );

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;

    // Sync offset uniforms from refs
    if (fromOffset) uniforms.uFromOffset.value.copy(fromOffset.current);
    if (toOffset) uniforms.uToOffset.value.copy(toOffset.current);

    if (typeof progress === 'number') {
      uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1);
    } else if (shouldAutoPlay) {
      // Ping-pong with smoothstep easing
      const t = state.clock.elapsedTime * speed;
      const pingPong = 0.5 + 0.5 * Math.sin(t);
      const eased = pingPong * pingPong * (3 - 2 * pingPong);
      uniforms.uProgress.value = eased;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </points>
  );
});
