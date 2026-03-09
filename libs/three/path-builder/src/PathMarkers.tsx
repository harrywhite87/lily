import { useCallback, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useDebugStore } from '@lilypad/debug';
import type { PathPoint } from './usePathBuilder';

export interface PathMarkersProps {
  points: PathPoint[];
  onPointMoved: (index: number, x: number, y: number, z: number) => void;
}

export function PathMarkers({ points, onPointMoved }: PathMarkersProps) {
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const setSelectedObjectUuid = useDebugStore((store) => store.setSelectedObjectUuid);
  const setGizmoMode = useDebugStore((store) => store.setGizmoMode);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>, index: number) => {
      event.stopPropagation();
      const mesh = meshRefs.current.get(index);

      if (!mesh) {
        return;
      }

      setSelectedObjectUuid(mesh.uuid);
      setGizmoMode('translate');
    },
    [setGizmoMode, setSelectedObjectUuid],
  );

  useFrame(() => {
    const selectedUuid = useDebugStore.getState().selectedObjectUuid;

    if (!selectedUuid) {
      return;
    }

    for (const [index, mesh] of meshRefs.current.entries()) {
      if (mesh.uuid !== selectedUuid || index >= points.length) {
        continue;
      }

      const [px, py, pz] = points[index];
      const { x, y, z } = mesh.position;

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
      {points.map((position, index) => (
        <mesh
          key={index}
          ref={(mesh: THREE.Mesh | null) => {
            if (mesh) {
              meshRefs.current.set(index, mesh);
              return;
            }

            meshRefs.current.delete(index);
          }}
          position={position}
          onClick={(event) => handleClick(event, index)}
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
