import { useRef, useMemo } from 'react';
import { useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial, useGLTF } from '@react-three/drei';
import { useModel } from '../model-loader/ModelContext';
import * as THREE from 'three';

/* ─── GLSL Shaders ─────────────────────────────────────────── */

const blueprintVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const blueprintFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGridScale;
  uniform float uThickness;
  uniform float uSubGridScale;
  uniform float uSubGridOpacity;
  uniform vec3 uGridColor;
  uniform vec3 uBaseColor;
  uniform vec3 uFresnelColor;
  uniform float uFresnelPower;
  uniform float uFresnelIntensity;
  uniform float uPulseSpeed;
  uniform float uPulseAmount;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  float gridLine(vec2 coord, float scale, float thickness) {
    vec2 grid = abs(fract(coord * scale - 0.5) - 0.5);
    float line = min(grid.x, grid.y);
    return 1.0 - smoothstep(0.0, thickness, line);
  }

  void main() {
    // ── Major grid ──
    float majorGrid = gridLine(vWorldPosition.xz, uGridScale, uThickness);

    // ── Sub grid (finer, fainter) ──
    float subGrid = gridLine(vWorldPosition.xz, uSubGridScale, uThickness * 0.6);

    // ── Combine grids ──
    float gridMask = max(majorGrid, subGrid * uSubGridOpacity);

    // ── Subtle pulse on grid brightness ──
    float pulse = 1.0 + sin(uTime * uPulseSpeed) * uPulseAmount;
    gridMask *= pulse;

    // ── Fresnel edge glow ──
    float fresnel = pow(1.0 - max(dot(vWorldNormal, vViewDir), 0.0), uFresnelPower);
    fresnel *= uFresnelIntensity;

    // ── Compose final color ──
    vec3 color = mix(uBaseColor, uGridColor, gridMask);
    color += uFresnelColor * fresnel;

    // Slight transparency on faces facing the camera, more opaque at edges
    float alpha = 0.85 + fresnel * 0.15;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Material definition ──────────────────────────────────── */

const BlueprintShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uGridScale: 1.0,
    uThickness: 0.02,
    uSubGridScale: 5.0,
    uSubGridOpacity: 0.3,
    uGridColor: new THREE.Color('#00e5ff'),
    uBaseColor: new THREE.Color('#0a1628'),
    uFresnelColor: new THREE.Color('#00e5ff'),
    uFresnelPower: 2.5,
    uFresnelIntensity: 0.8,
    uPulseSpeed: 1.5,
    uPulseAmount: 0.08,
  },
  blueprintVertexShader,
  blueprintFragmentShader,
);

extend({ BlueprintShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    blueprintShaderMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uGridScale?: number;
      uThickness?: number;
      uSubGridScale?: number;
      uSubGridOpacity?: number;
      uGridColor?: THREE.Color;
      uBaseColor?: THREE.Color;
      uFresnelColor?: THREE.Color;
      uFresnelPower?: number;
      uFresnelIntensity?: number;
      uPulseSpeed?: number;
      uPulseAmount?: number;
    };
  }
}

/* ─── Overrides (for Leva integration) ─────────────────────── */

export interface BlueprintOverrides {
  gridScale?: number;
  thickness?: number;
  subGridScale?: number;
  subGridOpacity?: number;
  fresnelPower?: number;
  fresnelIntensity?: number;
  pulseSpeed?: number;
  pulseAmount?: number;
}

/* ─── Component ────────────────────────────────────────────── */

interface BlueprintSubmarineProps {
  overrides?: BlueprintOverrides;
}

export function BlueprintSubmarine({ overrides }: BlueprintSubmarineProps) {
  const { modelUrl } = useModel();
  const { scene } = useGLTF(modelUrl);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  // Clone scene and replace all mesh materials with our blueprint shader
  const cloned = useMemo(() => {
    const c = scene.clone();
    return c;
  }, [scene]);

  // Update uniforms each frame
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = clock.getElapsedTime();

    if (overrides) {
      if (overrides.gridScale !== undefined) mat.uniforms.uGridScale.value = overrides.gridScale;
      if (overrides.thickness !== undefined) mat.uniforms.uThickness.value = overrides.thickness;
      if (overrides.subGridScale !== undefined) mat.uniforms.uSubGridScale.value = overrides.subGridScale;
      if (overrides.subGridOpacity !== undefined) mat.uniforms.uSubGridOpacity.value = overrides.subGridOpacity;
      if (overrides.fresnelPower !== undefined) mat.uniforms.uFresnelPower.value = overrides.fresnelPower;
      if (overrides.fresnelIntensity !== undefined) mat.uniforms.uFresnelIntensity.value = overrides.fresnelIntensity;
      if (overrides.pulseSpeed !== undefined) mat.uniforms.uPulseSpeed.value = overrides.pulseSpeed;
      if (overrides.pulseAmount !== undefined) mat.uniforms.uPulseAmount.value = overrides.pulseAmount;
    }
  });

  // Replace materials on all meshes in the cloned scene
  useMemo(() => {
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // We'll set the material in JSX via the shared ref instead
        // Mark meshes so we can identify them
        child.userData.__blueprint = true;
      }
    });
  }, [cloned]);

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
      {/* Overlay: we traverse and apply our material via a callback */}
      <BlueprintMaterialApplicator target={cloned} materialRef={materialRef} />
    </group>
  );
}

/**
 * Applies the blueprint shader material to all meshes in the target scene graph.
 * We do this as a component so the material ref is established in JSX.
 */
function BlueprintMaterialApplicator({
  target,
  materialRef,
}: {
  target: THREE.Object3D;
  materialRef: React.RefObject<THREE.ShaderMaterial>;
}) {
  useMemo(() => {
    // Wait until our material ref is set (after first render)
    // This will be called on mount
  }, []);

  useFrame(() => {
    if (!materialRef.current) return;
    target.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material !== materialRef.current) {
        child.material = materialRef.current;
      }
    });
  });

  return (
    <mesh visible={false}>
      <boxGeometry args={[0.001, 0.001, 0.001]} />
      <blueprintShaderMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        depthWrite={true}
      />
    </mesh>
  );
}
