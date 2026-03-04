import { useRef, useCallback } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDebugStore } from '@lilypad/debug';
import type { PathPoint } from './usePathBuilder';

interface PathMarkersProps {
  points: PathPoint[];
  onPointMoved: (index: number, x: number, y: number, z: number) => void;
}

/**
 * Renders clickable sphere markers at each path point.
 * Clicking a marker selects it for gizmo manipulation.
 * A useFrame loop detects when the gizmo moves a marker and syncs
 * the position back via onPointMoved.
 */
export function PathMarkers({ points, onPointMoved }: PathMarkersProps) {
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const setSelectedObjectUuid = useDebugStore((s) => s.setSelectedObjectUuid);
  const setGizmoMode = useDebugStore((s) => s.setGizmoMode);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>, index: number) => {
      e.stopPropagation();
      const mesh = meshRefs.current.get(index);
      if (mesh) {
        setSelectedObjectUuid(mesh.uuid);
        setGizmoMode('translate');
      }
    },
    [setSelectedObjectUuid, setGizmoMode],
  );

  // Sync gizmo-moved positions back to state
  useFrame(() => {
    const selectedUuid = useDebugStore.getState().selectedObjectUuid;
    if (!selectedUuid) return;

    for (const [index, mesh] of meshRefs.current.entries()) {
      if (mesh.uuid !== selectedUuid) continue;
      if (index >= points.length) continue;

      const [px, py, pz] = points[index];
      const { x, y, z } = mesh.position;

      // Only sync if the mesh has actually moved (gizmo dragged it)
      if (
        Math.abs(x - px) > 0.001 ||
        Math.abs(y - py) > 0.001 ||
        Math.abs(z - pz) > 0.001
      ) {
        onPointMoved(index, x, y, z);
      }
      break;
    }
  });

  return (
    <>
      {points.map((pos, i) => (
        <mesh
          key={i}
          ref={(mesh: THREE.Mesh | null) => {
            if (mesh) {
              meshRefs.current.set(i, mesh);
            } else {
              meshRefs.current.delete(i);
            }
          }}
          position={pos}
          onClick={(e) => handleClick(e, i)}
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      ))}
    </>
  );
}
