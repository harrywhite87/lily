/// <reference types="vite/client" />
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import {
  usePlasmaToroidInspector,
  DEFAULT_PLASMA_TOROID_TUNING,
  type PlasmaToroidTuning,
} from './usePlasmaToroidInspector';
import styles from './PlasmaToroidDemoPage.module.scss';

/* ─────────────────── constants ─────────────────── */

const TAU = Math.PI * 2;

/* ─────────────────── GLSL shaders ─────────────────── */

const vertexShader = /* glsl */ `
  attribute float aTheta0;
  attribute float aPhi0;
  attribute float aSpeedTheta;
  attribute float aSpeedPhi;
  attribute float aRadialJitter;
  attribute float aDensitySeed;
  attribute float aSizeSeed;
  attribute float aEnergySeed;
  attribute float aPhase;
  attribute float aBand;

  uniform float uTime;
  uniform float uMajorRadius;
  uniform float uMinorRadius;
  uniform float uPointSize;
  uniform float uPointSizeVariance;
  uniform float uAlpha;
  uniform float uHaloSpread;

  uniform float uMajorNoiseAmp1;
  uniform float uMajorNoiseAmp2;
  uniform float uMajorNoiseFreq1;
  uniform float uMajorNoiseFreq2;
  uniform float uMajorNoiseSpeed1;
  uniform float uMajorNoiseSpeed2;

  uniform float uTubeNoiseAmp1;
  uniform float uTubeNoiseAmp2;
  uniform float uTubeNoiseAmp3;
  uniform float uTubeNoiseFreqTheta1;
  uniform float uTubeNoiseFreqTheta2;
  uniform float uTubeNoiseFreqTheta3;
  uniform float uTubeNoiseFreqPhi1;
  uniform float uTubeNoiseFreqPhi2;
  uniform float uTubeNoiseFreqPhi3;
  uniform float uTubeNoiseSpeed1;
  uniform float uTubeNoiseSpeed2;
  uniform float uTubeNoiseSpeed3;

  uniform float uDensityBase;
  uniform float uDensityAmp1;
  uniform float uDensityAmp2;
  uniform float uDensityFreqTheta1;
  uniform float uDensityFreqTheta2;
  uniform float uDensityFreqPhi1;
  uniform float uDensityFreqPhi2;
  uniform float uDensitySpeed1;
  uniform float uDensitySpeed2;

  varying float vAlpha;
  varying float vEnergy;

  const float TAU = 6.28318530718;

  vec3 ringCenter(float theta, float R) {
    return vec3(cos(theta) * R, 0.0, sin(theta) * R);
  }

  vec3 ringNormal(float theta) {
    return normalize(vec3(cos(theta), 0.0, sin(theta)));
  }

  vec3 ringBinormal() {
    return vec3(0.0, 1.0, 0.0);
  }

  void main() {
    float theta = aTheta0 + uTime * aSpeedTheta;
    float phi   = aPhi0   + uTime * aSpeedPhi;

    // Major-angle offset
    theta +=
        0.08 * sin(theta * 2.0 + uTime * 0.7 + aPhase)
      + 0.05 * sin(theta * 5.0 - uTime * 1.1 + aPhase * 1.7)
      + 0.03 * sin(phi   * 3.0 + uTime * 0.9 + aPhase * 0.3);

    // Tube-angle offset
    phi +=
        0.12 * sin(theta * 3.0 + phi * 2.0 + uTime * 0.8 + aPhase)
      + 0.07 * sin(theta * 6.0 - phi * 4.0 - uTime * 1.3 + aPhase * 1.2);

    // Major radius deformation
    float majorNoise =
        uMajorNoiseAmp1 * sin(theta * uMajorNoiseFreq1 + uTime * uMajorNoiseSpeed1)
      + uMajorNoiseAmp2 * sin(theta * uMajorNoiseFreq2 - uTime * uMajorNoiseSpeed2 + aPhase);
    float majorRadius = uMajorRadius + majorNoise;

    // Minor radius deformation
    float tubeNoise =
        uTubeNoiseAmp1 * sin(
          theta * uTubeNoiseFreqTheta1 +
          phi   * uTubeNoiseFreqPhi1 +
          uTime * uTubeNoiseSpeed1 +
          aPhase
        )
      + uTubeNoiseAmp2 * sin(
          theta * uTubeNoiseFreqTheta2 -
          phi   * uTubeNoiseFreqPhi2 -
          uTime * uTubeNoiseSpeed2 +
          aPhase * 1.3
        )
      + uTubeNoiseAmp3 * sin(
          theta * uTubeNoiseFreqTheta3 +
          phi   * uTubeNoiseFreqPhi3 +
          uTime * uTubeNoiseSpeed3 +
          aPhase * 0.6
        );
    float minorRadius = uMinorRadius + tubeNoise;

    // Radial particle spread
    float radialSpread =
        aRadialJitter * (0.08 + mix(0.0, uHaloSpread, aBand))
      + aBand * 0.04 * sin(theta * 4.0 + uTime * 1.2 + aPhase);
    minorRadius += radialSpread;

    // Density field
    float densityField =
        uDensityBase
      + uDensityAmp1 * sin(
          theta * uDensityFreqTheta1 +
          phi   * uDensityFreqPhi1 +
          uTime * uDensitySpeed1
        )
      + uDensityAmp2 * sin(
          theta * uDensityFreqTheta2 -
          phi   * uDensityFreqPhi2 -
          uTime * uDensitySpeed2 +
          aPhase
        );
    float density = clamp(densityField, 0.0, 1.0);
    float visibleSoft = smoothstep(aDensitySeed - 0.08, aDensitySeed + 0.08, density);

    // Final position
    vec3 center = ringCenter(theta, majorRadius);
    vec3 n = ringNormal(theta);
    vec3 b = ringBinormal();
    vec3 tangent = normalize(vec3(-sin(theta), 0.0, cos(theta)));

    vec3 pos = center + (n * cos(phi) + b * sin(phi)) * minorRadius;
    pos += tangent * 0.015 * sin(phi * 5.0 + uTime * 1.5 + aPhase);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size
    float size = uPointSize * mix(0.7, 1.0 + uPointSizeVariance, aSizeSeed);
    size *= mix(0.85, 1.2, aEnergySeed);
    size *= mix(0.5, 1.0, visibleSoft);
    gl_PointSize = size * (1.0 / -mvPosition.z);

    vAlpha = uAlpha * visibleSoft;
    vEnergy = aEnergySeed;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uSoftness;

  varying float vAlpha;
  varying float vEnergy;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = length(uv);

    float disc = 1.0 - smoothstep(0.7, 1.0, d);
    float core = 1.0 - smoothstep(0.0, 0.35, d);

    float alpha = disc * vAlpha;
    alpha *= mix(0.85, 1.15, vEnergy);
    alpha += core * 0.12 * vAlpha;
    alpha *= uSoftness;

    if (alpha < 0.01) discard;

    vec3 color = mix(
      vec3(0.35, 0.65, 1.0),
      vec3(0.95, 0.98, 1.0),
      core
    );

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─────────────────── geometry generation ─────────────────── */

function buildToroidGeometry(count: number) {
  const aTheta0       = new Float32Array(count);
  const aPhi0         = new Float32Array(count);
  const aSpeedTheta   = new Float32Array(count);
  const aSpeedPhi     = new Float32Array(count);
  const aRadialJitter = new Float32Array(count);
  const aDensitySeed  = new Float32Array(count);
  const aSizeSeed     = new Float32Array(count);
  const aEnergySeed   = new Float32Array(count);
  const aPhase        = new Float32Array(count);
  const aBand         = new Float32Array(count);
  const positions     = new Float32Array(count * 3); // required by THREE, all zeros

  for (let i = 0; i < count; i++) {
    aTheta0[i] = Math.random() * TAU;
    aPhi0[i]   = Math.random() * TAU;

    // Biased speed distributions for grouped flow
    const speedThetaBase = 0.4 + Math.random() * 1.0;
    aSpeedTheta[i] = speedThetaBase * (Math.random() < 0.85 ? 1 : -1);

    const speedPhiBase = 0.2 + Math.random() * 1.0;
    aSpeedPhi[i] = speedPhiBase * (Math.random() < 0.5 ? 1 : -1);

    aRadialJitter[i] = (Math.random() * 2 - 1);
    aDensitySeed[i]  = Math.random();
    aSizeSeed[i]     = Math.random();
    aEnergySeed[i]   = Math.random();
    aPhase[i]        = Math.random() * TAU;
    aBand[i]         = Math.random() < 0.7 ? 0 : 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',      new THREE.BufferAttribute(positions,     3));
  geo.setAttribute('aTheta0',       new THREE.BufferAttribute(aTheta0,       1));
  geo.setAttribute('aPhi0',         new THREE.BufferAttribute(aPhi0,         1));
  geo.setAttribute('aSpeedTheta',   new THREE.BufferAttribute(aSpeedTheta,   1));
  geo.setAttribute('aSpeedPhi',     new THREE.BufferAttribute(aSpeedPhi,     1));
  geo.setAttribute('aRadialJitter', new THREE.BufferAttribute(aRadialJitter, 1));
  geo.setAttribute('aDensitySeed',  new THREE.BufferAttribute(aDensitySeed,  1));
  geo.setAttribute('aSizeSeed',     new THREE.BufferAttribute(aSizeSeed,     1));
  geo.setAttribute('aEnergySeed',   new THREE.BufferAttribute(aEnergySeed,   1));
  geo.setAttribute('aPhase',        new THREE.BufferAttribute(aPhase,        1));
  geo.setAttribute('aBand',         new THREE.BufferAttribute(aBand,         1));

  return geo;
}

/* ─────────────────── uniforms factory ─────────────────── */

function createUniforms(tuning: PlasmaToroidTuning) {
  return {
    uTime: { value: 0 },

    uMajorRadius: { value: tuning.majorRadius },
    uMinorRadius: { value: tuning.minorRadius },

    uMajorNoiseAmp1:   { value: tuning.majorNoiseAmp1 },
    uMajorNoiseAmp2:   { value: tuning.majorNoiseAmp2 },
    uMajorNoiseFreq1:  { value: 3.0 },
    uMajorNoiseFreq2:  { value: 5.0 },
    uMajorNoiseSpeed1: { value: 0.4 },
    uMajorNoiseSpeed2: { value: 0.6 },

    uTubeNoiseAmp1:       { value: tuning.tubeNoiseAmp1 },
    uTubeNoiseAmp2:       { value: tuning.tubeNoiseAmp2 },
    uTubeNoiseAmp3:       { value: tuning.tubeNoiseAmp3 },
    uTubeNoiseFreqTheta1: { value: 4.0 },
    uTubeNoiseFreqTheta2: { value: 6.0 },
    uTubeNoiseFreqTheta3: { value: 3.0 },
    uTubeNoiseFreqPhi1:   { value: 2.0 },
    uTubeNoiseFreqPhi2:   { value: 3.0 },
    uTubeNoiseFreqPhi3:   { value: 5.0 },
    uTubeNoiseSpeed1:     { value: 0.5 },
    uTubeNoiseSpeed2:     { value: 0.7 },
    uTubeNoiseSpeed3:     { value: 0.3 },

    uDensityBase:       { value: tuning.densityBase },
    uDensityAmp1:       { value: tuning.densityAmp1 },
    uDensityAmp2:       { value: tuning.densityAmp2 },
    uDensityFreqTheta1: { value: 3.0 },
    uDensityFreqTheta2: { value: 5.0 },
    uDensityFreqPhi1:   { value: 2.0 },
    uDensityFreqPhi2:   { value: 3.0 },
    uDensitySpeed1:     { value: 0.6 },
    uDensitySpeed2:     { value: 0.4 },

    uPointSize:         { value: tuning.pointSize },
    uPointSizeVariance: { value: tuning.pointSizeVariance },
    uAlpha:             { value: tuning.alpha },
    uSoftness:          { value: tuning.softness },

    uHaloSpread: { value: tuning.haloSpread },
  };
}

/* ─────────────────── React components ─────────────────── */

function PlasmaToroidPoints({ tuning }: { tuning: PlasmaToroidTuning }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(
    () => buildToroidGeometry(tuning.particleCount),
    [tuning.particleCount],
  );

  const uniforms = useMemo(
    () => createUniforms(tuning),
    // Only rebuild uniforms when particle count changes (geometry rebuild)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tuning.particleCount],
  );

  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value = clock.getElapsedTime();

    // Live-update tunable uniforms
    mat.uniforms.uMajorRadius.value     = tuning.majorRadius;
    mat.uniforms.uMinorRadius.value     = tuning.minorRadius;

    mat.uniforms.uMajorNoiseAmp1.value  = tuning.majorNoiseAmp1;
    mat.uniforms.uMajorNoiseAmp2.value  = tuning.majorNoiseAmp2;

    mat.uniforms.uTubeNoiseAmp1.value   = tuning.tubeNoiseAmp1;
    mat.uniforms.uTubeNoiseAmp2.value   = tuning.tubeNoiseAmp2;
    mat.uniforms.uTubeNoiseAmp3.value   = tuning.tubeNoiseAmp3;

    mat.uniforms.uDensityBase.value     = tuning.densityBase;
    mat.uniforms.uDensityAmp1.value     = tuning.densityAmp1;
    mat.uniforms.uDensityAmp2.value     = tuning.densityAmp2;

    mat.uniforms.uPointSize.value       = tuning.pointSize;
    mat.uniforms.uPointSizeVariance.value = tuning.pointSizeVariance;
    mat.uniforms.uAlpha.value           = tuning.alpha;
    mat.uniforms.uSoftness.value        = tuning.softness;
    mat.uniforms.uHaloSpread.value      = tuning.haloSpread;
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

export interface PlasmaToroidDemoSceneProps {
  showDebugOverlay?: boolean;
}

export interface PlasmaToroidDemoPageProps extends PlasmaToroidDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

export function PlasmaToroidDemoScene({
  showDebugOverlay = true,
}: PlasmaToroidDemoSceneProps) {
  const tuning = usePlasmaToroidInspector(DEFAULT_PLASMA_TOROID_TUNING);

  return (
    <>
      <color attach="background" args={['#020010']} />
      <fog attach="fog" args={['#020010', 8, 20]} />
      <PlasmaToroidPoints tuning={tuning} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={tuning.autoRotateSpeed}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function PlasmaToroidDemoPage({
  background = '#020010',
  showLegend = true,
  showDebugOverlay = true,
}: PlasmaToroidDemoPageProps) {
  return (
    <PageLayout background={background}>
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 50, position: [0, 1.5, 4.5] }}
        gl={{ antialias: true }}
      >
        <PlasmaToroidDemoScene showDebugOverlay={showDebugOverlay} />
      </Canvas>
      {showLegend ? (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#5a9fff' }} />
            Core band · GPU torus parameterization
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#c0e8ff' }} />
            Halo band · density-gated particles
          </div>
          <div className={styles.legendItem}>
            Press ` to open Inspector &middot; Controls tab
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
