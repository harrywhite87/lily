import { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';

export interface OrbitControlsLike {
  enabled: boolean;
}

export interface TransformGizmoProps {
  mesh: THREE.Mesh;
  controls?: OrbitControlsLike;
}

export function TransformGizmo({
  mesh,
  controls,
}: TransformGizmoProps) {
  const transformRef = useRef<any>(null);

  useEffect(() => {
    const transform = transformRef.current;
    if (!transform) {
      return;
    }

    const handleDraggingChanged = (event: { value: boolean }) => {
      if (controls) {
        controls.enabled = !event.value;
      }
    };

    transform.addEventListener('dragging-changed', handleDraggingChanged);
    return () => {
      transform.removeEventListener('dragging-changed', handleDraggingChanged);
      if (controls) {
        controls.enabled = true;
      }
    };
  }, [controls]);

  return <TransformControls ref={transformRef} object={mesh} mode="translate" />;
}
