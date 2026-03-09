import { useMemo } from 'react';
import * as THREE from 'three';
import { useDebugControls } from '@lilypad/debug';
import type { FolderControl } from '@lilypad/debug';
import { countModelMetrics, EMPTY_METRICS } from './model-utils';

/* ────────────────────────────────────────────── */
/*  ModelInspector                                */
/*  A renderless R3F component that deep-inspects */
/*  a Three.js object and surfaces metrics via    */
/*  the debug overlay. Drop it as a sibling to    */
/*  any <primitive> or mesh group to inspect.     */
/* ────────────────────────────────────────────── */

interface ModelInspectorProps {
  /** The Three.js object to inspect (scene, group, mesh…). */
  object: THREE.Object3D | null;
  /** Optional label shown in the filename row. */
  label?: string;
}

export function ModelInspector({ object, label }: ModelInspectorProps) {
  const metrics = useMemo(
    () => (object ? countModelMetrics(object) : EMPTY_METRICS),
    [object],
  );

  useDebugControls('Inspector', {
    ...(label ? { file: { value: label, editable: false as const, label: 'File' } } : {}),
    Geometry: {
      type: 'folder' as const,
      title: 'Geometry',
      controls: {
        totalMeshes:   { value: metrics.totalMeshes,   editable: false as const, label: 'Total Meshes' },
        activeMeshes:  { value: metrics.activeMeshes,  editable: false as const, label: 'Active Meshes' },
        totalVertices: { value: metrics.totalVertices, editable: false as const, label: 'Total Vertices' },
        activeIndices: { value: metrics.activeIndices, editable: false as const, label: 'Active Indices' },
        activeFaces:   { value: metrics.activeFaces,   editable: false as const, label: 'Active Faces' },
        drawCalls:     { value: metrics.drawCalls,     editable: false as const, label: 'Draw Calls' },
      },
    } satisfies FolderControl,
    Skinning: {
      type: 'folder' as const,
      title: 'Skinning',
      collapsed: true,
      controls: {
        activeBones:     { value: metrics.activeBones,     editable: false as const, label: 'Active Bones' },
        activeParticles: { value: metrics.activeParticles, editable: false as const, label: 'Active Particles' },
      },
    } satisfies FolderControl,
    Assets: {
      type: 'folder' as const,
      title: 'Assets',
      collapsed: true,
      controls: {
        totalMaterials: { value: metrics.totalMaterials, editable: false as const, label: 'Total Materials' },
        totalTextures:  { value: metrics.totalTextures,  editable: false as const, label: 'Total Textures' },
        totalLights:    { value: metrics.totalLights,    editable: false as const, label: 'Total Lights' },
      },
    } satisfies FolderControl,
  }, [metrics, label]);

  return null; // renderless
}
