/// <reference types="vite/client" />
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import {
  useFusionReactorInspector,
  DEFAULT_FUSION_REACTOR_TUNING,
  type FusionReactorTuning,
} from './useFusionReactorInspector';
import styles from './FusionReactorDemoPage.module.scss';

/* ─────────────────── constants ─────────────────── */

const TENDRIL_COUNT = 6;
const PATH_RESOLUTION = 256;

/* ─────────────────── GLSL shaders ─────────────────── */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uTendrilPaths;
  uniform float uNoiseStrength;
  uniform float uAnimSpeed;
  uniform float uRingRadius;
  uniform float uRingTube;
  uniform float uPointSizeMin;
  uniform float uPointSizeMax;

  attribute float aRole;
  attribute float aProgress;
  attribute float aSpeed;
  attribute vec3 aSeed;

  varying float vRole;
  varying float vSpeed;
  varying float vGlow;

  /* ── simplex helpers (3D) ── */
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x  = x_ * ns.x + ns.yyyy;
    vec4 y  = y_ * ns.x + ns.yyyy;
    vec4 h  = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  /* ── curl noise ── */
  vec3 curlNoise(vec3 p) {
    float e = 0.1;
    float n1, n2;
    vec3 curl;
    n1 = snoise(p + vec3(0.0, e, 0.0));
    n2 = snoise(p - vec3(0.0, e, 0.0));
    float a = (n1 - n2) / (2.0 * e);
    n1 = snoise(p + vec3(0.0, 0.0, e));
    n2 = snoise(p - vec3(0.0, 0.0, e));
    float b = (n1 - n2) / (2.0 * e);
    curl.x = a - b;
    n1 = snoise(p + vec3(0.0, 0.0, e));
    n2 = snoise(p - vec3(0.0, 0.0, e));
    a = (n1 - n2) / (2.0 * e);
    n1 = snoise(p + vec3(e, 0.0, 0.0));
    n2 = snoise(p - vec3(e, 0.0, 0.0));
    b = (n1 - n2) / (2.0 * e);
    curl.y = a - b;
    n1 = snoise(p + vec3(e, 0.0, 0.0));
    n2 = snoise(p - vec3(e, 0.0, 0.0));
    a = (n1 - n2) / (2.0 * e);
    n1 = snoise(p + vec3(0.0, e, 0.0));
    n2 = snoise(p - vec3(0.0, e, 0.0));
    b = (n1 - n2) / (2.0 * e);
    curl.z = a - b;
    return curl;
  }

  void main() {
    float t = aProgress + uTime * aSpeed * uAnimSpeed;
    vec3 basePos;

    if (aRole < 0.5) {
      /* ── main ring ── */
      float angle = t * 6.2831853;
      float r = uRingRadius + sin(angle * 3.0 + uTime) * uRingTube;
      basePos = vec3(
        cos(angle) * r,
        sin(angle * 2.0 + uTime * 0.5) * uRingTube,
        sin(angle) * r
      );
    } else {
      /* ── tendril: sample baked path texture ── */
      float u = fract(t);
      float tendrilIndex = aRole - 1.0;
      float v = (tendrilIndex + 0.5) / ${TENDRIL_COUNT.toFixed(1)};
      vec3 pathPos = texture2D(uTendrilPaths, vec2(u, v)).rgb;
      basePos = pathPos;
    }

    /* ── curl noise turbulence ── */
    vec3 noiseInput = basePos * 0.8 + aSeed * 0.5 + uTime * 0.12;
    vec3 curl = curlNoise(noiseInput);
    basePos += curl * uNoiseStrength;

    vec4 mvPos = modelViewMatrix * vec4(basePos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    /* perspective-attenuated point size */
    float size = mix(uPointSizeMin, uPointSizeMax, aSpeed / 1.5);
    gl_PointSize = size * (300.0 / -mvPos.z);

    vRole = aRole;
    vSpeed = aSpeed;
    vGlow = smoothstep(0.5, 1.5, aSpeed);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vRole;
  varying float vSpeed;
  varying float vGlow;

  void main() {
    /* ── soft round point ── */
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = exp(-dist * dist * 8.0);

    /* ── colour mapping ── */
    /* ring: deep blue-violet core */
    vec3 ringCore  = vec3(0.15, 0.08, 0.55);
    vec3 ringOuter = vec3(0.35, 0.55, 1.0);
    vec3 ringColor = mix(ringCore, ringOuter, vGlow);

    /* tendrils: hotter cyan-to-white */
    vec3 tendrilCore  = vec3(0.3, 0.7, 1.0);
    vec3 tendrilOuter = vec3(0.95, 0.95, 1.0);
    vec3 tendrilColor = mix(tendrilCore, tendrilOuter, vGlow);

    vec3 color = vRole < 0.5 ? ringColor : tendrilColor;

    /* boost brightness for additive glow */
    color *= 1.4 + vGlow * 1.2;

    gl_FragColor = vec4(color, alpha * 0.9);
  }
`;

/* ─────────────────── path baking ─────────────────── */

function bakeTendrilPaths(ringRadius: number, hotspotDist: number): THREE.DataTexture {
  const data = new Float32Array(PATH_RESOLUTION * TENDRIL_COUNT * 4);

  for (let t = 0; t < TENDRIL_COUNT; t++) {
    const angle = (t / TENDRIL_COUNT) * Math.PI * 2;
    const dist = hotspotDist + Math.sin(angle * 2) * 1.0;

    const hx = Math.cos(angle) * dist;
    const hy = Math.sin(angle * 3) * 1.2;
    const hz = Math.sin(angle) * dist;

    const entryAngle = angle - 0.3;
    const exitAngle  = angle + 0.3;
    const r = ringRadius;

    const points = [
      new THREE.Vector3(Math.cos(exitAngle) * r, 0, Math.sin(exitAngle) * r),
      new THREE.Vector3(Math.cos(angle) * (r + 1.5), hy * 0.3, Math.sin(angle) * (r + 1.5)),
      new THREE.Vector3(hx, hy, hz),
      new THREE.Vector3(Math.cos(angle) * (r + 1.5), hy * -0.3, Math.sin(angle) * (r + 1.5)),
      new THREE.Vector3(Math.cos(entryAngle) * r, 0, Math.sin(entryAngle) * r),
    ];

    const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
    const samples = curve.getPoints(PATH_RESOLUTION - 1);

    for (let i = 0; i < PATH_RESOLUTION; i++) {
      const idx = (t * PATH_RESOLUTION + i) * 4;
      data[idx    ] = samples[i].x;
      data[idx + 1] = samples[i].y;
      data[idx + 2] = samples[i].z;
      data[idx + 3] = 1.0;
    }
  }

  const tex = new THREE.DataTexture(
    data,
    PATH_RESOLUTION,
    TENDRIL_COUNT,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* ─────────────────── particle geometry ─────────────────── */

function buildParticleGeometry(count: number, ringFraction: number) {
  const positions  = new Float32Array(count * 3);
  const roles      = new Float32Array(count);
  const progresses = new Float32Array(count);
  const speeds     = new Float32Array(count);
  const seeds      = new Float32Array(count * 3);

  const ringCount = Math.floor(count * ringFraction);
  const perTendril = Math.floor((count - ringCount) / TENDRIL_COUNT);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    progresses[i] = Math.random();
    speeds[i]     = 0.5 + Math.random();
    seeds[i * 3]     = (Math.random() - 0.5) * 2;
    seeds[i * 3 + 1] = (Math.random() - 0.5) * 2;
    seeds[i * 3 + 2] = (Math.random() - 0.5) * 2;

    if (i < ringCount) {
      roles[i] = 0.0;
    } else {
      const tendrilIdx = Math.min(
        Math.floor((i - ringCount) / perTendril),
        TENDRIL_COUNT - 1,
      );
      roles[i] = tendrilIdx + 1.0;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',  new THREE.BufferAttribute(positions,  3));
  geo.setAttribute('aRole',     new THREE.BufferAttribute(roles,      1));
  geo.setAttribute('aProgress', new THREE.BufferAttribute(progresses, 1));
  geo.setAttribute('aSpeed',    new THREE.BufferAttribute(speeds,     1));
  geo.setAttribute('aSeed',     new THREE.BufferAttribute(seeds,      3));
  return geo;
}

/* ─────────────────── React components ─────────────────── */

function FusionReactorPoints({ tuning }: { tuning: FusionReactorTuning }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, tendrilTexture, uniforms } = useMemo(() => {
    const geo = buildParticleGeometry(tuning.particleCount, tuning.ringFraction);
    const tex = bakeTendrilPaths(tuning.ringRadius, tuning.hotspotDist);
    const u = {
      uTime:          { value: 0 },
      uTendrilPaths:  { value: tex },
      uNoiseStrength: { value: tuning.noiseStrength },
      uAnimSpeed:     { value: tuning.animSpeed },
      uRingRadius:    { value: tuning.ringRadius },
      uRingTube:      { value: tuning.ringTube },
      uPointSizeMin:  { value: tuning.pointSizeMin },
      uPointSizeMax:  { value: tuning.pointSizeMax },
    };
    return { geometry: geo, tendrilTexture: tex, uniforms: u };
    // Rebuild geometry when count, fraction, radius, or hotspot change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuning.particleCount, tuning.ringFraction, tuning.ringRadius, tuning.hotspotDist]);

  /* Live-update uniforms that don't require geometry rebuild */
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uNoiseStrength.value = tuning.noiseStrength;
    mat.uniforms.uAnimSpeed.value = tuning.animSpeed;
    mat.uniforms.uRingRadius.value = tuning.ringRadius;
    mat.uniforms.uRingTube.value = tuning.ringTube;
    mat.uniforms.uPointSizeMin.value = tuning.pointSizeMin;
    mat.uniforms.uPointSizeMax.value = tuning.pointSizeMax;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─────────────────── exported scene / page ─────────────────── */

export interface FusionReactorDemoSceneProps {
  showDebugOverlay?: boolean;
}

export interface FusionReactorDemoPageProps extends FusionReactorDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

export function FusionReactorDemoScene({
  showDebugOverlay = true,
}: FusionReactorDemoSceneProps) {
  const tuning = useFusionReactorInspector(DEFAULT_FUSION_REACTOR_TUNING);

  return (
    <>
      <color attach="background" args={['#030008']} />
      <fog attach="fog" args={['#030008', 18, 40]} />
      <FusionReactorPoints tuning={tuning} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={22}
        autoRotate
        autoRotateSpeed={tuning.autoRotateSpeed}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function FusionReactorDemoPage({
  background = '#030008',
  showLegend = true,
  showDebugOverlay = true,
}: FusionReactorDemoPageProps) {
  return (
    <PageLayout background={background}>
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 3, 10] }}
        gl={{ antialias: true }}
      >
        <FusionReactorDemoScene showDebugOverlay={showDebugOverlay} />
      </Canvas>
      {showLegend ? (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#6040ff' }} />
            Fusion ring · GPU vertex shader · curl noise
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#80d0ff' }} />
            Plasma tendrils · baked spline paths
          </div>
          <div className={styles.legendItem}>
            Press ` to open Inspector &middot; Controls tab
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
