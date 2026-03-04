import { useEffect } from 'react';
import type { RefObject } from 'react';
import type * as THREE from 'three';
import type { ObjectInspectorSurface } from '@lilypad/shared';
import {
  setObjectInspectorSurface,
  clearObjectInspectorSurface,
} from './objectInspectorSurface';

type ObjectTarget =
  | THREE.Object3D
  | null
  | undefined
  | RefObject<THREE.Object3D | null>;

function resolveObject(target: ObjectTarget): THREE.Object3D | null {
  if (!target) return null;
  if (typeof target === 'object' && 'current' in target) {
    return target.current;
  }
  return target;
}

/**
 * Registers an inspector surface on a specific THREE object.
 * The Scene properties panel can read this surface when that object is selected.
 */
export function useObjectInspectorSurface(
  target: ObjectTarget,
  surface: ObjectInspectorSurface | null,
): void {
  useEffect(() => {
    const object = resolveObject(target);
    if (!object || !surface) return;

    setObjectInspectorSurface(object, surface);
    return () => {
      clearObjectInspectorSurface(object, surface);
    };
  });
}
