import { useRef } from 'react';
import { extend, shaderMaterial, useFrame, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

import waterVert from '../shaders/water-mdxyzx.vert.glsl?raw';
import waterFrag from '../shaders/water-mdxyzx.frag.glsl?raw';

const WaterMdXyzXMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgressArea3: 0,
    uWaveDepth: 1.0,
    uWaveScale: 0.14,
    uWaveDrag: 0.28,
    uWaveSpeed: 0.9,
    uAmbient: 0.35,
    uDiffuse: 0.75,
    uSpecular: 0.85,
    uSpecularPower: 96.0,
    uFoamStrength: 0.55,
    uFogNear: 7.0,
    uFogFar: 42.0,
    uWaterDeepColor: new THREE.Color('#0a1630'),
    uWaterShallowColor: new THREE.Color('#1e5f7c'),
    uRimColor: new THREE.Color('#a8d5ef'),
    uFogColor: new THREE.Color('#0f1f33'),
  },
  waterVert,
  waterFrag,
);

extend({ WaterMdXyzXMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    waterMdXyzXMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uProgressArea3?: number;
      uWaveDepth?: number;
      uWaveScale?: number;
      uWaveDrag?: number;
      uWaveSpeed?: number;
      uAmbient?: number;
      uDiffuse?: number;
      uSpecular?: number;
      uSpecularPower?: number;
      uFoamStrength?: number;
      uFogNear?: number;
      uFogFar?: number;
      uWaterDeepColor?: THREE.Color;
      uWaterShallowColor?: THREE.Color;
      uRimColor?: THREE.Color;
      uFogColor?: THREE.Color;
    };
  }
}

type Props = {
  progressArea3: number;
};

export function WaterSurfaceMdXyzX({ progressArea3 }: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    const t = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t;
    materialRef.current.uniforms.uProgressArea3.value = progressArea3;

    // Subtle scroll-coupled tuning for Area 3 focus.
    materialRef.current.uniforms.uWaveDepth.value = 0.85 + progressArea3 * 0.35;
    materialRef.current.uniforms.uWaveScale.value = 0.13 + progressArea3 * 0.03;
    materialRef.current.uniforms.uSpecular.value = 0.75 + progressArea3 * 0.25;
  });

  return (
    <mesh position={[7.5, -1.5, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 12, 192, 192]} />
      <waterMdXyzXMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

