import { useRef, useEffect } from 'react';
import { useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { useScrollProgress } from '@lilypad/scroll';
import { useMaterialTextures } from '@lilypad/three-assets';
import * as THREE from 'three';

const causticsVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const causticsFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgressArea4;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uBaseIntensity;
  uniform float uContrast;
  uniform float uShimmer;
  uniform float uFlowAmount;
  uniform float uEdgeFade;
  uniform float uSandAmount;
  uniform float uSandScale;
  uniform vec3 uTint;
  uniform vec3 uDeepTint;
  uniform vec3 uSandColor;
  uniform vec3 uSandShadowColor;

  // Sand PBR textures (extracted from materials.glb)
  uniform sampler2D uSandMap;
  uniform sampler2D uSandNormalMap;
  uniform sampler2D uSandRoughnessMap;
  uniform float uSandTexScale;
  uniform int uHasSandTextures;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  vec4 mod289(vec4 x) {
    return x - floor(x / 289.0) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289((x * 34.0 + 1.0) * x);
  }

  vec4 snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v - i + dot(i, vec3(C.x));

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + C.y;
    vec3 x3 = x0 - 0.5;

    vec4 p =
      permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    vec4 j = p - 49.0 * floor(p / 49.0);
    vec4 x_ = floor(j / 7.0);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m3 = m2 * m;
    vec4 m4 = m2 * m2;

    vec3 grad =
      -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
      -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
      -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
      -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;

    vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
    return 42.0 * vec4(grad, dot(m4, px));
  }

  float water_caustics(vec3 pos) {
    vec4 n = snoise(pos);
    pos -= 0.07 * n.xyz;
    pos *= 1.62;
    n = snoise(pos);
    pos -= 0.07 * n.xyz;
    n = snoise(pos);
    pos -= 0.07 * n.xyz;
    n = snoise(pos);
    return n.w;
  }

  mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float flowField(vec2 p, float t) {
    const int MAX_ITER = 5;
    float acc = 0.0;
    float amp = 1.0;
    vec2 q = p;

    for (int i = 0; i < MAX_ITER; i++) {
      q += vec2(
        sin(q.y * 1.9 + t * (0.35 + float(i) * 0.07)),
        cos(q.x * 1.6 - t * (0.42 + float(i) * 0.08))
      ) * (0.12 * uFlowAmount);
      float wave = sin(q.x + q.y) + cos(q.x - q.y);
      acc += abs(wave) * amp;
      q = rot(1.07) * q * 1.43 + vec2(0.17, -0.11);
      amp *= 0.58;
    }

    return acc;
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.7, 1.2, -1.2, 1.7);
    for (int i = 0; i < 4; i++) {
      v += a * noise2d(p);
      p = m * p * 1.18;
      a *= 0.52;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * uSpeed;

    vec2 warpedUv = uv;
    float warpNoise = snoise(vec3(uv * 1.6, t * 0.45)).w;
    warpedUv += vec2(warpNoise, -warpNoise) * (0.12 * uFlowAmount);

    vec3 pos = vec3(warpedUv * (uScale * 3.0), t * 0.75);
    float w0 = water_caustics(pos);
    float w1 = water_caustics(pos + vec3(1.0));
    float baseField = mix(w0, w1, 0.5);

    float flow = flowField(warpedUv * (uScale * 2.2), t);
    float shimmer = snoise(vec3(warpedUv * 4.3, t * 0.85)).w * uShimmer;

    float intensity = exp(baseField * 4.0 - 1.0);
    intensity *= (0.72 + flow * 0.25);
    intensity *= (0.9 + shimmer * 0.35);

    intensity = pow(max(intensity, 0.0), uContrast);
    intensity *= uBaseIntensity;

    float centerMask = 1.0 - smoothstep(0.72, 1.05 + uEdgeFade, length(uv));
    intensity *= centerMask;

    float progress = smoothstep(0.0, 0.15, uProgressArea4);
    intensity *= progress;

    // ── Sand base: PBR texture or procedural fallback ──
    vec3 sandColor;

    if (uHasSandTextures == 1) {
      // Static sand texture — the seabed doesn't move, only caustics dance over it
      vec2 sandTexCoord = uv * uSandTexScale;
      sandColor = texture2D(uSandMap, sandTexCoord).rgb;
      // sRGB → linear
      sandColor = pow(sandColor, vec3(2.2));

      // Add subtle depth variation from roughness map
      float roughSample = texture2D(uSandRoughnessMap, sandTexCoord).r;
      sandColor *= (0.85 + roughSample * 0.3);
    } else {
      // Procedural fallback (drift is intentional here for visual interest)
      vec2 sandDriftCoord = warpedUv * uSandScale + vec2(t * 0.08, -t * 0.05);
      float sandNoise = fbm(sandDriftCoord);
      float sandBands = 0.5 + 0.5 * sin((warpedUv.x * 5.0 + warpedUv.y * 9.0) + sandNoise * 2.4);
      float sandMix = clamp(0.25 + sandNoise * 0.65 + sandBands * 0.15, 0.0, 1.0);
      sandColor = mix(uSandShadowColor, uSandColor, sandMix);
    }

    vec3 color = mix(uDeepTint, uTint, clamp(intensity * 0.9, 0.0, 1.0));
    color *= intensity;
    color += sandColor * (uSandAmount * progress);

    float alpha = clamp(uSandAmount * 0.42 + intensity * 0.78, 0.0, 0.9) * progress;
    gl_FragColor = vec4(color, alpha);
  }
`;

const CausticsMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgressArea4: 0,
    uScale: 1.95,
    uSpeed: 0.18,
    uBaseIntensity: 1.15,
    uContrast: 1.28,
    uShimmer: 0.45,
    uFlowAmount: 1.0,
    uEdgeFade: 0.2,
    uSandAmount: 0.32,
    uSandScale: 5.6,
    uTint: new THREE.Color('#e7f8ff'),
    uDeepTint: new THREE.Color('#7ab8cb'),
    uSandColor: new THREE.Color('#d4bd8e'),
    uSandShadowColor: new THREE.Color('#8f7a58'),
    // Sand PBR textures
    uSandMap: new THREE.Texture(),
    uSandNormalMap: new THREE.Texture(),
    uSandRoughnessMap: new THREE.Texture(),
    uSandTexScale: 1.0,
    uHasSandTextures: 0,
  },
  causticsVertexShader,
  causticsFragmentShader,
);

extend({ CausticsMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    causticsMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uProgressArea4?: number;
      uScale?: number;
      uSpeed?: number;
      uBaseIntensity?: number;
      uContrast?: number;
      uShimmer?: number;
      uFlowAmount?: number;
      uEdgeFade?: number;
      uSandAmount?: number;
      uSandScale?: number;
      uTint?: THREE.Color;
      uDeepTint?: THREE.Color;
      uSandColor?: THREE.Color;
      uSandShadowColor?: THREE.Color;
      uSandMap?: THREE.Texture;
      uSandNormalMap?: THREE.Texture;
      uSandRoughnessMap?: THREE.Texture;
      uSandTexScale?: number;
      uHasSandTextures?: number;
    };
  }
}

export interface CausticsOverrides {
  scale?: number;
  speed?: number;
  baseIntensity?: number;
  contrast?: number;
  shimmer?: number;
  flowAmount?: number;
  edgeFade?: number;
  sandAmount?: number;
  sandScale?: number;
  sandTexScale?: number;
}

/* ─── Component ────────────────────────────────────────────── */

interface CausticsProps {
  /** When true, renders at full intensity without requiring scroll context. */
  standalone?: boolean;
  /** Optional uniform overrides (used by debug controls in standalone mode). */
  overrides?: CausticsOverrides;
}

export function Caustics({ standalone = false, overrides }: CausticsProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const scrollProgress = standalone ? null : useScrollProgress();
  const d = standalone ? 1.0 : scrollProgress!.d;
  const sandTextures = useMaterialTextures('Sand.001');

  // Push sand textures into material when they load
  useEffect(() => {
    if (!materialRef.current) return;
    const mat = materialRef.current;

    if (sandTextures.map) {
      mat.uniforms.uSandMap.value = sandTextures.map;
      mat.uniforms.uHasSandTextures.value = 1;
    }
    if (sandTextures.normalMap) {
      mat.uniforms.uSandNormalMap.value = sandTextures.normalMap;
    }
    if (sandTextures.roughnessMap) {
      mat.uniforms.uSandRoughnessMap.value = sandTextures.roughnessMap;
    }

    mat.needsUpdate = true;
  }, [sandTextures]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uProgressArea4.value = d;

    if (overrides) {
      mat.uniforms.uBaseIntensity.value = overrides.baseIntensity ?? 1.5;
      mat.uniforms.uContrast.value = overrides.contrast ?? 1.42;
      mat.uniforms.uShimmer.value = overrides.shimmer ?? 0.54;
      mat.uniforms.uFlowAmount.value = overrides.flowAmount ?? 1.2;
      mat.uniforms.uScale.value = overrides.scale ?? 2.2;
      mat.uniforms.uSandAmount.value = overrides.sandAmount ?? 0.42;
      mat.uniforms.uSpeed.value = overrides.speed ?? 0.18;
      mat.uniforms.uEdgeFade.value = overrides.edgeFade ?? 0.2;
      mat.uniforms.uSandScale.value = overrides.sandScale ?? 5.6;
      if (overrides.sandTexScale !== undefined) {
        mat.uniforms.uSandTexScale.value = overrides.sandTexScale;
      }
    } else {
      mat.uniforms.uBaseIntensity.value = standalone ? 1.5 : 0.95 + d * 0.55;
      mat.uniforms.uContrast.value = standalone ? 1.42 : 1.12 + d * 0.3;
      mat.uniforms.uShimmer.value = standalone ? 0.54 : 0.34 + d * 0.2;
      mat.uniforms.uFlowAmount.value = standalone ? 1.2 : 0.9 + d * 0.3;
      mat.uniforms.uScale.value = standalone ? 2.2 : 1.75 + d * 0.45;
      mat.uniforms.uSandAmount.value = standalone ? 0.42 : 0.22 + d * 0.2;
    }
  });

  const pos: [number, number, number] = standalone ? [0, 0, 0] : [10, -6, -3];
  const rot: [number, number, number] = standalone
    ? [-Math.PI / 2, 0, 0]
    : [-Math.PI / 2.5, 0, 0];
  const size = standalone ? 40 : 20;

  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={[size, size, 1, 1]} />
      <causticsMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
