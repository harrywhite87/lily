import type * as THREE from 'three';
import type { ObjectInspectorSurface } from '@lilypad/shared';

export const OBJECT_INSPECTOR_SURFACE_KEY = '__lilypadObjectInspectorSurface';

type UserDataWithInspectorSurface = {
  [OBJECT_INSPECTOR_SURFACE_KEY]?: ObjectInspectorSurface;
};

export function setObjectInspectorSurface(
  object: THREE.Object3D,
  surface: ObjectInspectorSurface,
): void {
  (object.userData as UserDataWithInspectorSurface)[
    OBJECT_INSPECTOR_SURFACE_KEY
  ] = surface;
}

export function clearObjectInspectorSurface(
  object: THREE.Object3D,
  expectedSurface?: ObjectInspectorSurface,
): void {
  const userData = object.userData as UserDataWithInspectorSurface;
  if (!expectedSurface || userData[OBJECT_INSPECTOR_SURFACE_KEY] === expectedSurface) {
    delete userData[OBJECT_INSPECTOR_SURFACE_KEY];
  }
}

export function getObjectInspectorSurface(
  object: THREE.Object3D | null | undefined,
): ObjectInspectorSurface | null {
  if (!object) return null;
  const surface = (object.userData as UserDataWithInspectorSurface)[
    OBJECT_INSPECTOR_SURFACE_KEY
  ];
  if (!surface || !Array.isArray(surface.fields)) return null;
  return surface;
}
