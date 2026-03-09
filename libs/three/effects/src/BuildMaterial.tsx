import { useRef, useMemo, useEffect } from 'react';
import { useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial, useGLTF } from '@react-three/drei';
import { useModel } from '@lilypad/three-model-runtime';
import { useMaterialTextures } from '@lilypad/three-assets';
import * as THREE from 'three';

/* ─── GLSL Shaders ─────────────────────────────────────────── */

const buildVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const buildFragmentShader = /* glsl */ `
  uniform float uTime;

  // Rust PBR textures (extracted from materials.glb)
  uniform sampler2D uRustMap;
  uniform sampler2D uRustNormalMap;
  uniform sampler2D uRustRoughnessMap;
  uniform sampler2D uRustMetalnessMap;
  uniform float uRustTexScale;
  uniform int uHasRustTextures;

  // Fallback procedural colors (used when textures not loaded yet)
  uniform vec3 uRustColor;
  uniform vec3 uRustDarkColor;
  uniform vec3 uSteelColor;
  uniform vec3 uPrimerColor;
  uniform float uRustScale;
  uniform float uRustRoughness;
  uniform float uPrimerMix;
  uniform float uSteelMix;

  // Structural lines
  uniform float uRibSpacing;
  uniform float uRibOffset;
  uniform float uRibThickness;
  uniform float uSeamSpacing;
  uniform float uSeamOffset;
  uniform float uSeamThickness;
  uniform float uSeamWobble;
  uniform vec3 uLineColor;
  uniform float uLineOpacity;

  // Weld dots / rivets
  uniform float uRivetSpacing;
  uniform float uRivetSize;
  uniform vec3 uRivetColor;

  // Chalk marks
  uniform vec3 uChalkColor;
  uniform float uChalkOpacity;

  // Fresnel
  uniform vec3 uFresnelColor;
  uniform float uFresnelPower;
  uniform float uFresnelIntensity;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  /* ── Noise functions ── */

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      v += a * noise2d(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 wp = vWorldPosition.xz;
    vec3 wp3 = vWorldPosition;

    // ── 1. Base color: PBR rust textures or procedural fallback ──
    vec3 baseColor;
    vec2 texCoord = wp * uRustTexScale;

    if (uHasRustTextures == 1) {
      // Sample the real Rust.002 PBR textures
      baseColor = texture2D(uRustMap, texCoord).rgb;
      // Apply sRGB → linear approximation for correct color
      baseColor = pow(baseColor, vec3(2.2));
    } else {
      // Fallback: simple procedural rust
      float rustNoise = fbm(wp * uRustScale * 0.6, 5);
      float rustTone = smoothstep(0.25, 0.75, rustNoise);
      baseColor = mix(uRustDarkColor, uRustColor, rustTone);
    }

    // Primer showing through in patches
    float primerMask = smoothstep(0.58, 0.68, fbm(wp * uRustScale * 0.8 + 7.3, 4));
    baseColor = mix(baseColor, uPrimerColor, primerMask * uPrimerMix);

    // Bare steel showing through (scratches/wear)
    float scratchNoise = fbm(vec2(wp3.x * uRustScale * 8.0, wp3.y * uRustScale * 1.5) + 77.0, 4);
    float scratchMask = smoothstep(0.72, 0.78, scratchNoise);
    baseColor = mix(baseColor, uSteelColor, scratchMask * uSteelMix);

    // ── 2. Structural rib lines (circumferential frames) ──
    float ribCoord = (vWorldPosition.x + uRibOffset) * uRibSpacing;
    float ribLine = abs(fract(ribCoord - 0.5) - 0.5);
    float ribMask = 1.0 - smoothstep(0.0, uRibThickness, ribLine);

    // ── 3. Horizontal seam lines (weld seams) ──
    float wobble = sin(vWorldPosition.x * 12.0 + uTime * 0.1) * uSeamWobble;
    float seamCoord = (vWorldPosition.y + uSeamOffset + wobble) * uSeamSpacing;
    float seamLine = abs(fract(seamCoord - 0.5) - 0.5);
    float seamMask = 1.0 - smoothstep(0.0, uSeamThickness, seamLine);

    // Make seams slightly incomplete / broken up
    float seamBreak = step(0.35, noise2d(vec2(vWorldPosition.x * 4.0, vWorldPosition.z * 0.5)));
    seamMask *= seamBreak;

    // Combine structural lines
    float lineMask = max(ribMask, seamMask) * uLineOpacity;

    // ── 4. Rivet / weld dots along rib lines ──
    float rivetX = fract(vWorldPosition.x * uRivetSpacing);
    float rivetZ = fract(ribCoord - 0.5);
    float rivetDist = length(vec2(rivetX - 0.5, rivetZ) * vec2(1.0, uRibSpacing));
    float rivetMask = 1.0 - smoothstep(0.0, uRivetSize, rivetDist);

    // ── 5. Chalk / marker construction marks ──
    float chalkNoise = noise2d(wp * 0.8 + 200.0);
    float chalkLine = abs(fract(vWorldPosition.x * 0.7 + chalkNoise * 0.3) - 0.5);
    float chalkMask = (1.0 - smoothstep(0.0, 0.015, chalkLine)) * step(0.82, chalkNoise) * uChalkOpacity;

    // ── 6. Fresnel edge glow ──
    float fresnel = pow(1.0 - max(dot(vWorldNormal, vViewDir), 0.0), uFresnelPower);
    fresnel *= uFresnelIntensity;

    // ── Compose ──
    vec3 color = baseColor;
    color = mix(color, uLineColor, lineMask);
    color = mix(color, uRivetColor, rivetMask * 0.7);
    color += uChalkColor * chalkMask;
    color += uFresnelColor * fresnel;

    // Ambient occlusion from texture or procedural
    float ao;
    if (uHasRustTextures == 1) {
      // Use roughness map for subtle AO variation
      float roughSample = texture2D(uRustRoughnessMap, texCoord).r;
      ao = 0.85 + 0.15 * roughSample;
    } else {
      ao = 0.8 + 0.2 * fbm(wp * uRustScale * 1.5 + 55.0, 3);
    }
    color *= ao;

    float alpha = 0.92 + fresnel * 0.08;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Material definition ──────────────────────────────────── */

const BuildShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    // Rust PBR textures
    uRustMap: new THREE.Texture(),
    uRustNormalMap: new THREE.Texture(),
    uRustRoughnessMap: new THREE.Texture(),
    uRustMetalnessMap: new THREE.Texture(),
    uRustTexScale: 0.5,
    uHasRustTextures: 0,
    // Fallback colors
    uRustColor: new THREE.Color('#b5651d'),
    uRustDarkColor: new THREE.Color('#3a1a00'),
    uSteelColor: new THREE.Color('#6b7b8d'),
    uPrimerColor: new THREE.Color('#8b3a3a'),
    uRustScale: 1.8,
    uRustRoughness: 0.6,
    uPrimerMix: 0.25,
    uSteelMix: 0.4,
    // Structure lines
    uRibSpacing: 3.0,
    uRibOffset: 0.0,
    uRibThickness: 0.012,
    uSeamSpacing: 2.0,
    uSeamOffset: 0.0,
    uSeamThickness: 0.008,
    uSeamWobble: 0.003,
    uLineColor: new THREE.Color('#d4d4d4'),
    uLineOpacity: 0.6,
    // Rivets
    uRivetSpacing: 6.0,
    uRivetSize: 0.02,
    uRivetColor: new THREE.Color('#888888'),
    // Chalk
    uChalkColor: new THREE.Color('#ffffff'),
    uChalkOpacity: 0.4,
    // Fresnel
    uFresnelColor: new THREE.Color('#ffa54f'),
    uFresnelPower: 2.0,
    uFresnelIntensity: 0.4,
  },
  buildVertexShader,
  buildFragmentShader,
);

extend({ BuildShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    buildShaderMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uRustMap?: THREE.Texture;
      uRustNormalMap?: THREE.Texture;
      uRustRoughnessMap?: THREE.Texture;
      uRustMetalnessMap?: THREE.Texture;
      uRustTexScale?: number;
      uHasRustTextures?: number;
      uRustColor?: THREE.Color;
      uRustDarkColor?: THREE.Color;
      uSteelColor?: THREE.Color;
      uPrimerColor?: THREE.Color;
      uRustScale?: number;
      uRustRoughness?: number;
      uPrimerMix?: number;
      uSteelMix?: number;
      uRibSpacing?: number;
      uRibOffset?: number;
      uRibThickness?: number;
      uSeamSpacing?: number;
      uSeamOffset?: number;
      uSeamThickness?: number;
      uSeamWobble?: number;
      uLineColor?: THREE.Color;
      uLineOpacity?: number;
      uRivetSpacing?: number;
      uRivetSize?: number;
      uRivetColor?: THREE.Color;
      uChalkColor?: THREE.Color;
      uChalkOpacity?: number;
      uFresnelColor?: THREE.Color;
      uFresnelPower?: number;
      uFresnelIntensity?: number;
    };
  }
}

/* ─── Overrides (for debug controls) ─────────────────────── */

export interface BuildOverrides {
  rustTexScale?: number;
  rustScale?: number;
  rustRoughness?: number;
  primerMix?: number;
  steelMix?: number;
  ribSpacing?: number;
  ribOffset?: number;
  ribThickness?: number;
  seamSpacing?: number;
  seamOffset?: number;
  seamThickness?: number;
  seamWobble?: number;
  lineOpacity?: number;
  rivetSpacing?: number;
  rivetSize?: number;
  chalkOpacity?: number;
  fresnelPower?: number;
  fresnelIntensity?: number;
}

/* ─── Component ────────────────────────────────────────────── */

interface BuildSubmarineProps {
  overrides?: BuildOverrides;
}

export function BuildSubmarine({ overrides }: BuildSubmarineProps) {
  const { modelUrl } = useModel();
  const { scene } = useGLTF(modelUrl);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const rustTextures = useMaterialTextures('Rust.002');

  const cloned = useMemo(() => scene.clone(), [scene]);

  // Push rust textures into material when they load
  useEffect(() => {
    if (!materialRef.current) return;
    const mat = materialRef.current;

    if (rustTextures.map) {
      mat.uniforms.uRustMap.value = rustTextures.map;
      mat.uniforms.uHasRustTextures.value = 1;
    }
    if (rustTextures.normalMap) {
      mat.uniforms.uRustNormalMap.value = rustTextures.normalMap;
    }
    if (rustTextures.roughnessMap) {
      mat.uniforms.uRustRoughnessMap.value = rustTextures.roughnessMap;
    }
    if (rustTextures.metalnessMap) {
      mat.uniforms.uRustMetalnessMap.value = rustTextures.metalnessMap;
    }

    mat.needsUpdate = true;
  }, [rustTextures]);

  // Update uniforms each frame
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = clock.getElapsedTime();

    if (overrides) {
      if (overrides.rustTexScale !== undefined) mat.uniforms.uRustTexScale.value = overrides.rustTexScale;
      if (overrides.rustScale !== undefined) mat.uniforms.uRustScale.value = overrides.rustScale;
      if (overrides.rustRoughness !== undefined) mat.uniforms.uRustRoughness.value = overrides.rustRoughness;
      if (overrides.primerMix !== undefined) mat.uniforms.uPrimerMix.value = overrides.primerMix;
      if (overrides.steelMix !== undefined) mat.uniforms.uSteelMix.value = overrides.steelMix;
      if (overrides.ribSpacing !== undefined) mat.uniforms.uRibSpacing.value = overrides.ribSpacing;
      if (overrides.ribOffset !== undefined) mat.uniforms.uRibOffset.value = overrides.ribOffset;
      if (overrides.ribThickness !== undefined) mat.uniforms.uRibThickness.value = overrides.ribThickness;
      if (overrides.seamSpacing !== undefined) mat.uniforms.uSeamSpacing.value = overrides.seamSpacing;
      if (overrides.seamOffset !== undefined) mat.uniforms.uSeamOffset.value = overrides.seamOffset;
      if (overrides.seamThickness !== undefined) mat.uniforms.uSeamThickness.value = overrides.seamThickness;
      if (overrides.seamWobble !== undefined) mat.uniforms.uSeamWobble.value = overrides.seamWobble;
      if (overrides.lineOpacity !== undefined) mat.uniforms.uLineOpacity.value = overrides.lineOpacity;
      if (overrides.rivetSpacing !== undefined) mat.uniforms.uRivetSpacing.value = overrides.rivetSpacing;
      if (overrides.rivetSize !== undefined) mat.uniforms.uRivetSize.value = overrides.rivetSize;
      if (overrides.chalkOpacity !== undefined) mat.uniforms.uChalkOpacity.value = overrides.chalkOpacity;
      if (overrides.fresnelPower !== undefined) mat.uniforms.uFresnelPower.value = overrides.fresnelPower;
      if (overrides.fresnelIntensity !== undefined) mat.uniforms.uFresnelIntensity.value = overrides.fresnelIntensity;
    }
  });

  // Apply material to all meshes
  useFrame(() => {
    if (!materialRef.current) return;
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material !== materialRef.current) {
        child.material = materialRef.current;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
      {/* Hidden mesh to host the material ref */}
      <mesh visible={false}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <buildShaderMaterial
          ref={materialRef}
          transparent
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}
