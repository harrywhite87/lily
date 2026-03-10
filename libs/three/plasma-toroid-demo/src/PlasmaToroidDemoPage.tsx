/// <reference types="vite/client" />
import { useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DebugOverlay, DebugPanel } from '@lilypad/debug';
import { PageLayout } from '@lilypad/page-layout';
import { TAU, getPlasmaToroidUniformConfig } from './plasmaToroidField';
import {
  usePlasmaToroidInspector,
  DEFAULT_PLASMA_TOROID_TUNING,
  type PlasmaToroidTuning,
} from './usePlasmaToroidInspector';
import styles from './PlasmaToroidDemoPage.module.scss';

const vertexShader = /* glsl */ `
  attribute float aTheta0;
  attribute float aPhi0;
  attribute float aSpeedTheta;
  attribute float aSpeedPhi;
  attribute float aThetaDirectionSeed;
  attribute float aRadialJitter;
  attribute float aDensitySeed;
  attribute float aSizeSeed;
  attribute float aEnergySeed;
  attribute float aPhase;
  attribute float aBand;

  uniform float uTime;
  uniform float uMajorRadius;
  uniform float uMinorRadius;
  uniform float uHaloSpread;
  uniform float uOrbitThetaSpeed;
  uniform float uOrbitPhiSpeed;
  uniform float uOrbitThetaDirectionMode;

  uniform float uThetaDriftAmp;
  uniform float uThetaDriftFreqTheta;
  uniform float uThetaDriftFreqPhi;
  uniform float uThetaDriftSpeed;

  uniform float uPhiDriftAmp;
  uniform float uPhiDriftFreqTheta;
  uniform float uPhiDriftFreqPhi;
  uniform float uPhiDriftSpeed;

  uniform float uRingWobbleAmp;
  uniform float uRingWobbleFreqTheta;
  uniform float uRingWobbleFreqPhi;
  uniform float uRingWobbleSpeed;

  uniform float uRadialWobbleAmp;
  uniform float uRadialWobbleFreqTheta;
  uniform float uRadialWobbleFreqPhi;
  uniform float uRadialWobbleSpeed;

  uniform float uBinormalWobbleAmp;
  uniform float uBinormalWobbleFreqTheta;
  uniform float uBinormalWobbleFreqPhi;
  uniform float uBinormalWobbleSpeed;

  uniform float uTangentWobbleAmp;
  uniform float uTangentWobbleFreqTheta;
  uniform float uTangentWobbleFreqPhi;
  uniform float uTangentWobbleSpeed;

  uniform float uWarpEnabled;
  uniform float uWarpAmpX;
  uniform float uWarpAmpY;
  uniform float uWarpAmpZ;
  uniform float uWarpFreqTheta;
  uniform float uWarpFreqPhi;
  uniform float uWarpSpeed;

  uniform float uDensityBase;
  uniform float uDensityAmp1;
  uniform float uDensityFreqTheta1;
  uniform float uDensityFreqPhi1;
  uniform float uDensitySpeed1;
  uniform float uDensityAmp2;
  uniform float uDensityFreqTheta2;
  uniform float uDensityFreqPhi2;
  uniform float uDensitySpeed2;

  uniform float uPointSize;
  uniform float uPointSizeVariance;
  uniform float uAlpha;
  uniform float uSoftness;

  varying float vAlpha;
  varying float vEnergy;

  float sampleWave(
    float amp,
    float freqTheta,
    float freqPhi,
    float speed,
    float theta,
    float phi,
    float time,
    float phaseOffset
  ) {
    return amp * sin(theta * freqTheta + phi * freqPhi + time * speed + phaseOffset);
  }

  vec3 ringCenter(float theta, float radius) {
    return vec3(cos(theta) * radius, 0.0, sin(theta) * radius);
  }

  vec3 ringNormal(float theta) {
    return normalize(vec3(cos(theta), 0.0, sin(theta)));
  }

  vec3 ringTangent(float theta) {
    return normalize(vec3(-sin(theta), 0.0, cos(theta)));
  }

  float resolveThetaDirection(float mode, float seed) {
    if (mode > 0.5) {
      return 1.0;
    }

    if (mode < -0.5) {
      return -1.0;
    }

    return seed < 0.85 ? 1.0 : -1.0;
  }

  void main() {
    float thetaDirection = resolveThetaDirection(uOrbitThetaDirectionMode, aThetaDirectionSeed);
    float theta = aTheta0 + uTime * aSpeedTheta * uOrbitThetaSpeed * thetaDirection;
    float phi = aPhi0 + uTime * aSpeedPhi * uOrbitPhiSpeed;

    theta += sampleWave(
      uThetaDriftAmp,
      uThetaDriftFreqTheta,
      uThetaDriftFreqPhi,
      uThetaDriftSpeed,
      theta,
      phi,
      uTime,
      aPhase
    );

    phi += sampleWave(
      uPhiDriftAmp,
      uPhiDriftFreqTheta,
      uPhiDriftFreqPhi,
      uPhiDriftSpeed,
      theta,
      phi,
      uTime,
      aPhase * 1.17
    );

    float ringOffset = sampleWave(
      uRingWobbleAmp,
      uRingWobbleFreqTheta,
      uRingWobbleFreqPhi,
      uRingWobbleSpeed,
      theta,
      phi,
      uTime,
      aPhase * 0.73
    );

    float haloOffset = aRadialJitter * (0.05 + mix(0.0, uHaloSpread, aBand));
    float radialOffset = sampleWave(
      uRadialWobbleAmp,
      uRadialWobbleFreqTheta,
      uRadialWobbleFreqPhi,
      uRadialWobbleSpeed,
      theta,
      phi,
      uTime,
      aPhase
    ) + haloOffset;

    float binormalOffset = sampleWave(
      uBinormalWobbleAmp,
      uBinormalWobbleFreqTheta,
      uBinormalWobbleFreqPhi,
      uBinormalWobbleSpeed,
      theta,
      phi,
      uTime,
      aPhase * 1.31
    );

    float tangentOffset = sampleWave(
      uTangentWobbleAmp,
      uTangentWobbleFreqTheta,
      uTangentWobbleFreqPhi,
      uTangentWobbleSpeed,
      theta,
      phi,
      uTime,
      aPhase * 0.61
    );

    float density = clamp(
      uDensityBase +
        sampleWave(
          uDensityAmp1,
          uDensityFreqTheta1,
          uDensityFreqPhi1,
          uDensitySpeed1,
          theta,
          phi,
          uTime,
          0.0
        ) +
        sampleWave(
          uDensityAmp2,
          uDensityFreqTheta2,
          uDensityFreqPhi2,
          uDensitySpeed2,
          theta,
          phi,
          uTime,
          aPhase * 1.91
        ),
      0.0,
      1.0
    );

    float visibleSoft = smoothstep(aDensitySeed - 0.08, aDensitySeed + 0.08, density);

    float majorRadius = uMajorRadius + ringOffset;
    vec3 center = ringCenter(theta, majorRadius);
    vec3 normal = ringNormal(theta);
    vec3 tangent = ringTangent(theta);
    vec3 tubeDirection = normalize(normal * cos(phi) + vec3(0.0, 1.0, 0.0) * sin(phi));

    vec3 pos = center + tubeDirection * (uMinorRadius + radialOffset);
    pos += vec3(0.0, 1.0, 0.0) * binormalOffset;
    pos += tangent * tangentOffset;

    vec3 warpOffset = vec3(
      sin(
        theta * uWarpFreqTheta +
        phi * uWarpFreqPhi +
        uTime * uWarpSpeed +
        aPhase * 0.71
      ) * uWarpAmpX,
      sin(
        theta * (uWarpFreqTheta + 0.9) -
        phi * (uWarpFreqPhi + 0.35) -
        uTime * (uWarpSpeed * 1.17) +
        aPhase * 1.17
      ) * uWarpAmpY,
      sin(
        theta * (uWarpFreqTheta - 0.55) +
        phi * (uWarpFreqPhi + 0.7) +
        uTime * (uWarpSpeed * 0.91) +
        aPhase * 1.53
      ) * uWarpAmpZ
    );

    pos += warpOffset * uWarpEnabled;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float size = uPointSize * mix(0.7, 1.0 + uPointSizeVariance, aSizeSeed);
    size *= mix(0.85, 1.2, aEnergySeed);
    size *= mix(0.5, 1.0, visibleSoft);
    gl_PointSize = size * (1.0 / -mvPosition.z);

    vAlpha = uAlpha * visibleSoft * uSoftness;
    vEnergy = aEnergySeed;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

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

    if (alpha < 0.01) discard;

    vec3 color = mix(
      vec3(0.35, 0.65, 1.0),
      vec3(0.95, 0.98, 1.0),
      core
    );

    gl_FragColor = vec4(color, alpha);
  }
`;

function buildToroidGeometry(count: number) {
  const aTheta0 = new Float32Array(count);
  const aPhi0 = new Float32Array(count);
  const aSpeedTheta = new Float32Array(count);
  const aSpeedPhi = new Float32Array(count);
  const aThetaDirectionSeed = new Float32Array(count);
  const aRadialJitter = new Float32Array(count);
  const aDensitySeed = new Float32Array(count);
  const aSizeSeed = new Float32Array(count);
  const aEnergySeed = new Float32Array(count);
  const aPhase = new Float32Array(count);
  const aBand = new Float32Array(count);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    aTheta0[i] = Math.random() * TAU;
    aPhi0[i] = Math.random() * TAU;

    const speedThetaBase = 0.4 + Math.random() * 1.0;
    aSpeedTheta[i] = speedThetaBase;

    const speedPhiBase = 0.2 + Math.random() * 1.0;
    aSpeedPhi[i] = speedPhiBase * (Math.random() < 0.5 ? 1 : -1);
    aThetaDirectionSeed[i] = Math.random();

    aRadialJitter[i] = Math.random() * 2 - 1;
    aDensitySeed[i] = Math.random();
    aSizeSeed[i] = Math.random();
    aEnergySeed[i] = Math.random();
    aPhase[i] = Math.random() * TAU;
    aBand[i] = Math.random() < 0.7 ? 0 : 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTheta0', new THREE.BufferAttribute(aTheta0, 1));
  geometry.setAttribute('aPhi0', new THREE.BufferAttribute(aPhi0, 1));
  geometry.setAttribute('aSpeedTheta', new THREE.BufferAttribute(aSpeedTheta, 1));
  geometry.setAttribute('aSpeedPhi', new THREE.BufferAttribute(aSpeedPhi, 1));
  geometry.setAttribute('aThetaDirectionSeed', new THREE.BufferAttribute(aThetaDirectionSeed, 1));
  geometry.setAttribute('aRadialJitter', new THREE.BufferAttribute(aRadialJitter, 1));
  geometry.setAttribute('aDensitySeed', new THREE.BufferAttribute(aDensitySeed, 1));
  geometry.setAttribute('aSizeSeed', new THREE.BufferAttribute(aSizeSeed, 1));
  geometry.setAttribute('aEnergySeed', new THREE.BufferAttribute(aEnergySeed, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute('aBand', new THREE.BufferAttribute(aBand, 1));
  return geometry;
}

function createUniforms(tuning: PlasmaToroidTuning) {
  const config = getPlasmaToroidUniformConfig(tuning);
  const uniforms: Record<string, { value: number }> = {
    uTime: { value: 0 },
  };

  for (const [key, value] of Object.entries(config)) {
    uniforms[key] = { value };
  }

  return uniforms;
}

function applyUniforms(
  uniforms: Record<string, { value: number }>,
  tuning: PlasmaToroidTuning,
) {
  const config = getPlasmaToroidUniformConfig(tuning);
  for (const [key, value] of Object.entries(config)) {
    uniforms[key].value = value;
  }
}

function PlasmaToroidPoints({ tuning }: { tuning: PlasmaToroidTuning }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(
    () => buildToroidGeometry(tuning.particleCount),
    [tuning.particleCount],
  );

  const uniforms = useMemo(
    () => createUniforms(tuning),
    [tuning.particleCount],
  );

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) {
      return;
    }

    material.uniforms.uTime.value = clock.getElapsedTime();
    applyUniforms(material.uniforms as Record<string, { value: number }>, tuning);
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

export interface PlasmaToroidDemoSceneProps {
  showDebugOverlay?: boolean;
}

export interface PlasmaToroidDemoPageProps extends PlasmaToroidDemoSceneProps {
  background?: string;
  showLegend?: boolean;
}

type CameraPreset = {
  position: [number, number, number];
  up?: [number, number, number];
};

function PlasmaToroidSceneContents({
  showDebugOverlay = true,
}: PlasmaToroidDemoSceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const applyCameraPreset = useCallback(
    (preset: CameraPreset) => {
      camera.position.set(...preset.position);
      if (preset.up) {
        camera.up.set(...preset.up);
      } else {
        camera.up.set(0, 1, 0);
      }
      camera.lookAt(0, 0, 0);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
    },
    [camera],
  );

  const setFrontView = useCallback(() => {
    applyCameraPreset({ position: [0, 0.55, 5.8] });
  }, [applyCameraPreset]);

  const setSideView = useCallback(() => {
    applyCameraPreset({ position: [5.8, 0.4, 0.01] });
  }, [applyCameraPreset]);

  const setAxisView = useCallback(() => {
    applyCameraPreset({
      position: [0.01, 5.8, 0],
      up: [0, 0, -1],
    });
  }, [applyCameraPreset]);

  const setIsometricView = useCallback(() => {
    applyCameraPreset({ position: [4.5, 2.6, 4.5] });
  }, [applyCameraPreset]);

  const tuning = usePlasmaToroidInspector(DEFAULT_PLASMA_TOROID_TUNING, {
    setFrontView,
    setSideView,
    setAxisView,
    setIsometricView,
  });

  return (
    <>
      <color attach="background" args={['#020010']} />
      <fog attach="fog" args={['#020010', 8, 20]} />
      <PlasmaToroidPoints tuning={tuning} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={12}
        autoRotate={tuning.camera.autoRotate}
        autoRotateSpeed={tuning.camera.autoRotateSpeed}
      />
      {showDebugOverlay ? <DebugOverlay /> : null}
    </>
  );
}

export function PlasmaToroidDemoScene({
  showDebugOverlay = true,
}: PlasmaToroidDemoSceneProps) {
  return <PlasmaToroidSceneContents showDebugOverlay={showDebugOverlay} />;
}

export function PlasmaToroidDemoPage({
  background = '#020010',
  showLegend = true,
  showDebugOverlay = true,
}: PlasmaToroidDemoPageProps) {
  return (
    <PageLayout background={background}>
      <DebugPanel position="left" />
      <Canvas
        style={{ flex: 1 }}
        camera={{ fov: 50, near: 0.1, far: 50, position: [0, 1.5, 4.5] }}
        gl={{ antialias: true }}
      >
        <PlasmaToroidDemoScene showDebugOverlay={showDebugOverlay} />
      </Canvas>
      {showLegend ? (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#5a9fff' }} />
            Core band · local toroid wobble field
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: '#c0e8ff' }} />
            XYZ warp · axis-safe asymmetry layer
          </div>
          <div className={styles.legendItem}>
            Press ` to open Inspector · Controls tab
          </div>
        </div>
      ) : null}
      <DebugPanel position="right" />
    </PageLayout>
  );
}
