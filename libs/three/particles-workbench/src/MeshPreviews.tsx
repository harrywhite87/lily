import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformGizmo } from './TransformGizmo';

export interface MeshPreviewsProps {
  fromGeometry: THREE.BufferGeometry;
  toGeometry: THREE.BufferGeometry;
  fromPositionRef: MutableRefObject<THREE.Vector3>;
  toPositionRef: MutableRefObject<THREE.Vector3>;
  selectedMesh: 'A' | 'B' | null;
  onSelectMesh: (mesh: 'A' | 'B') => void;
}

export function MeshPreviews({
  fromGeometry,
  toGeometry,
  fromPositionRef,
  toPositionRef,
  selectedMesh,
  onSelectMesh,
}: MeshPreviewsProps) {
  const fromMeshRef = useRef<THREE.Mesh>(null);
  const toMeshRef = useRef<THREE.Mesh>(null);
  const { controls } = useThree();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fromMeshRef.current) {
      fromMeshRef.current.position.copy(fromPositionRef.current);
    }

    if (toMeshRef.current) {
      toMeshRef.current.position.copy(toPositionRef.current);
    }
  }, [fromPositionRef, toPositionRef]);

  useFrame(() => {
    if (fromMeshRef.current) {
      fromPositionRef.current.copy(fromMeshRef.current.position);
    }

    if (toMeshRef.current) {
      toPositionRef.current.copy(toMeshRef.current.position);
    }
  });

  const activeMesh = !mounted
    ? null
    : selectedMesh === 'A'
      ? fromMeshRef.current
      : selectedMesh === 'B'
        ? toMeshRef.current
        : null;

  return (
    <>
      <mesh
        ref={fromMeshRef}
        geometry={fromGeometry}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelectMesh('A');
        }}
      >
        <meshBasicMaterial
          color="#4fc3f7"
          wireframe
          transparent
          opacity={selectedMesh === 'A' ? 0.4 : 0.15}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={toMeshRef}
        geometry={toGeometry}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelectMesh('B');
        }}
      >
        <meshBasicMaterial
          color="#ff8a65"
          wireframe
          transparent
          opacity={selectedMesh === 'B' ? 0.4 : 0.15}
          depthWrite={false}
        />
      </mesh>
      {activeMesh ? (
        <TransformGizmo
          key={selectedMesh}
          mesh={activeMesh}
          controls={controls as unknown as { enabled: boolean } | undefined}
        />
      ) : null}
    </>
  );
}
