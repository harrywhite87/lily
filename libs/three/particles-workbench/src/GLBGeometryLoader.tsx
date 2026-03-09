import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { extractGeometry, normalizeGeometry } from '@lilypad/three-particles';

export interface GLBGeometryLoaderProps {
  url: string;
  onGeometry: (geometry: THREE.BufferGeometry) => void;
}

export function GLBGeometryLoader({
  url,
  onGeometry,
}: GLBGeometryLoaderProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    const geometry = extractGeometry(scene);
    if (!geometry) {
      return;
    }

    normalizeGeometry(geometry);
    onGeometry(geometry);
  }, [onGeometry, scene]);

  return null;
}
