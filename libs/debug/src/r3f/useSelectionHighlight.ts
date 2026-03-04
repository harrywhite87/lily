import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDebugStore } from '../core/store';

/**
 * Renders a yellow BoxHelper around the object whose UUID matches
 * the current `selectedObjectUuid` in the debug store.
 */
export function useSelectionHighlight() {
  const { scene } = useThree();
  const selectedUuid = useDebugStore((s) => s.selectedObjectUuid);
  const helperRef = useRef<THREE.BoxHelper | null>(null);

  useEffect(() => {
    // Remove existing helper
    if (helperRef.current) {
      scene.remove(helperRef.current);
      helperRef.current.geometry.dispose();
      const mat = helperRef.current.material as
        | THREE.Material
        | THREE.Material[]
        | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose?.();
      helperRef.current = null;
    }

    if (!selectedUuid) return;

    const obj = scene.getObjectByProperty('uuid', selectedUuid);
    if (!obj) return;

    const helper = new THREE.BoxHelper(obj, 0xffff00);
    helperRef.current = helper;
    scene.add(helper);

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.geometry.dispose();
        const mat = helperRef.current.material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
        helperRef.current = null;
      }
    };
  }, [scene, selectedUuid]);

  // Keep helper in sync with animated / moving objects
  useFrame(() => {
    if (helperRef.current) helperRef.current.update();
  });
}
