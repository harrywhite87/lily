import { create } from 'zustand';
import type { MetricsSnapshot, SceneNode, GizmoMode } from '../r3f/types';
import { DEFAULT_METRICS } from '../r3f/types';
import type * as THREE from 'three';

export type FloatingInspector = {
  uuid: string;
  x: number;
  y: number;
};

const FLOATING_BASE_POSITION = { x: 28, y: 84 };
const FLOATING_OFFSET_STEP = 22;

export type DebugStore = {
  isOpen: boolean;
  activePanelId: string;
  selectedObjectUuid: string | null;
  gizmoMode: GizmoMode;
  metrics: MetricsSnapshot;
  sceneGraph: SceneNode[];
  sceneRef: THREE.Scene | null;
  floatingInspectors: FloatingInspector[];
  draggedSceneNodeUuid: string | null;

  setOpen: (open: boolean) => void;
  setActivePanel: (panelId: string) => void;
  setSelectedObjectUuid: (uuid: string | null) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  setMetrics: (m: MetricsSnapshot) => void;
  setSceneGraph: (nodes: SceneNode[]) => void;
  setSceneRef: (scene: THREE.Scene | null) => void;
  openFloatingInspector: (
    uuid: string,
    position?: { x: number; y: number },
  ) => void;
  moveFloatingInspector: (
    uuid: string,
    position: { x: number; y: number },
  ) => void;
  closeFloatingInspector: (uuid: string) => void;
  bringFloatingInspectorToFront: (uuid: string) => void;
  removeMissingFloatingInspectors: (uuids: string[]) => void;
  setDraggedSceneNodeUuid: (uuid: string | null) => void;
};

export const useDebugStore = create<DebugStore>((set) => ({
  isOpen: true,
  activePanelId: 'metrics',
  selectedObjectUuid: null,
  gizmoMode: 'off',
  metrics: DEFAULT_METRICS,
  sceneGraph: [],
  sceneRef: null,
  floatingInspectors: [],
  draggedSceneNodeUuid: null,

  setOpen: (open) => set({ isOpen: open }),
  setActivePanel: (panelId) => set({ activePanelId: panelId }),
  setSelectedObjectUuid: (uuid) =>
    set({ selectedObjectUuid: uuid, ...(uuid === null && { gizmoMode: 'off' }) }),
  setGizmoMode: (mode) => set({ gizmoMode: mode }),
  setMetrics: (m) => set({ metrics: m }),
  setSceneGraph: (nodes) => set({ sceneGraph: nodes }),
  setSceneRef: (scene) => set({ sceneRef: scene }),
  openFloatingInspector: (uuid, position) =>
    set((state) => {
      const existing = state.floatingInspectors.find((panel) => panel.uuid === uuid);
      const rest = state.floatingInspectors.filter((panel) => panel.uuid !== uuid);
      const fallback = {
        x: FLOATING_BASE_POSITION.x + rest.length * FLOATING_OFFSET_STEP,
        y: FLOATING_BASE_POSITION.y + rest.length * FLOATING_OFFSET_STEP,
      };
      const nextPanel: FloatingInspector = {
        uuid,
        ...(existing ?? fallback),
        ...(position ?? {}),
      };
      return { floatingInspectors: [...rest, nextPanel] };
    }),
  moveFloatingInspector: (uuid, position) =>
    set((state) => ({
      floatingInspectors: state.floatingInspectors.map((panel) =>
        panel.uuid === uuid
          ? { ...panel, x: position.x, y: position.y }
          : panel,
      ),
    })),
  closeFloatingInspector: (uuid) =>
    set((state) => ({
      floatingInspectors: state.floatingInspectors.filter(
        (panel) => panel.uuid !== uuid,
      ),
    })),
  bringFloatingInspectorToFront: (uuid) =>
    set((state) => {
      const index = state.floatingInspectors.findIndex((panel) => panel.uuid === uuid);
      if (index < 0 || index === state.floatingInspectors.length - 1) return state;
      const panel = state.floatingInspectors[index];
      const rest = state.floatingInspectors.filter((entry) => entry.uuid !== uuid);
      return { floatingInspectors: [...rest, panel] };
    }),
  removeMissingFloatingInspectors: (uuids) =>
    set((state) => {
      const valid = new Set(uuids);
      const remaining = state.floatingInspectors.filter((panel) =>
        valid.has(panel.uuid),
      );
      if (remaining.length === state.floatingInspectors.length) return state;
      return { floatingInspectors: remaining };
    }),
  setDraggedSceneNodeUuid: (uuid) => set({ draggedSceneNodeUuid: uuid }),
}));

/**
 * Public selector hook — lets consumers read any slice of debug state.
 *
 * Usage: `const fps = useDebug(s => s.metrics.fps);`
 */
export function useDebug<T>(selector: (s: DebugStore) => T): T {
  return useDebugStore(selector);
}
