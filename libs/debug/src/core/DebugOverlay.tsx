import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import type { DragEvent, PointerEvent } from 'react';
import { Html } from '@react-three/drei';
import { useDebugStore } from './store';
import type { FloatingInspector } from './store';
import { useR3FAdapter } from '../r3f/useR3FAdapter';
import { useSelectionHighlight } from '../r3f/useSelectionHighlight';
import { TransformGizmo } from '../r3f/TransformGizmo';
import { useHotkeys } from './useHotkeys';
import { MetricsPanel } from '../panels/MetricsPanel';
import { SceneGraphPanel } from '../panels/SceneGraphPanel';
import { ControlsPanel } from '../controls/ControlsPanel';
import { ObjectInspectorPanel } from '../panels/ObjectInspectorPanel';
import type { DebugPlugin, DebugPanelRegistration } from './types';
import styles from './DebugOverlay.module.scss';

const DETACHED_INSPECTOR_MIME = 'application/x-lilypad-scene-node';
const DROP_OFFSET = 16;

const BUILTIN_PANELS: DebugPanelRegistration[] = [
  { id: 'metrics', title: 'Metrics', order: 0, render: MetricsPanel },
  { id: 'scene', title: 'Scene', order: 1, render: SceneGraphPanel },
  { id: 'controls', title: 'Controls', order: 2, render: ControlsPanel },
];

function normalizePlugins(plugins: DebugPlugin[]): DebugPanelRegistration[] {
  const fromPlugins = plugins.flatMap((plugin) => plugin.panels);
  const all = [...BUILTIN_PANELS, ...fromPlugins];

  return all
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title),
    );
}

function clampFloatingPosition(x: number, y: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(8, window.innerWidth - 340);
  const maxY = Math.max(8, window.innerHeight - 120);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
}

function Tabs({ panels }: { panels: DebugPanelRegistration[] }) {
  const active = useDebugStore((s) => s.activePanelId);
  const setActive = useDebugStore((s) => s.setActivePanel);

  return (
    <div className={styles.tabs}>
      {panels.map((panel) => (
        <button
          key={panel.id}
          onClick={() => setActive(panel.id)}
          className={`${styles.tab} ${panel.id === active ? styles.tabActive : ''}`}
        >
          {panel.title}
        </button>
      ))}
    </div>
  );
}

function PanelHost({ panels }: { panels: DebugPanelRegistration[] }) {
  const active = useDebugStore((s) => s.activePanelId);
  const panel = panels.find((entry) => entry.id === active) ?? panels[0];
  if (!panel) return null;
  const Component = panel.render;
  return <Component />;
}

function useDraggable() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        event.button !== 0 ||
        (event.target as HTMLElement).closest('button')
      ) {
        return;
      }
      dragging.current = true;
      origin.current = {
        mx: event.clientX,
        my: event.clientY,
        ox: offset.x,
        oy: offset.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [offset],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setOffset({
      x: origin.current.ox + (event.clientX - origin.current.mx),
      y: origin.current.oy + (event.clientY - origin.current.my),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { offset, onPointerDown, onPointerMove, onPointerUp };
}

function DetachedInspector({
  panel,
  stackIndex,
}: {
  panel: FloatingInspector;
  stackIndex: number;
}) {
  const moveFloatingInspector = useDebugStore((s) => s.moveFloatingInspector);
  const closeFloatingInspector = useDebugStore((s) => s.closeFloatingInspector);
  const bringFloatingInspectorToFront = useDebugStore(
    (s) => s.bringFloatingInspectorToFront,
  );
  const setSelectedObjectUuid = useDebugStore((s) => s.setSelectedObjectUuid);

  const draggingRef = useRef<{
    pointerId: number;
    mouseX: number;
    mouseY: number;
    panelX: number;
    panelY: number;
  } | null>(null);

  const onHeaderPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        event.button !== 0 ||
        (event.target as HTMLElement).closest('button')
      ) {
        return;
      }
      bringFloatingInspectorToFront(panel.uuid);
      setSelectedObjectUuid(panel.uuid);
      draggingRef.current = {
        pointerId: event.pointerId,
        mouseX: event.clientX,
        mouseY: event.clientY,
        panelX: panel.x,
        panelY: panel.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
    },
    [bringFloatingInspectorToFront, panel.uuid, panel.x, panel.y, setSelectedObjectUuid],
  );

  const onHeaderPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const dragState = draggingRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const x = dragState.panelX + (event.clientX - dragState.mouseX);
      const y = dragState.panelY + (event.clientY - dragState.mouseY);
      moveFloatingInspector(panel.uuid, clampFloatingPosition(x, y));
    },
    [moveFloatingInspector, panel.uuid],
  );

  const onHeaderPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const dragState = draggingRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      draggingRef.current = null;
      event.stopPropagation();
    },
    [],
  );

  return (
    <div
      className={styles.detached}
      style={{ left: panel.x, top: panel.y, zIndex: 10010 + stackIndex }}
      onPointerDown={() => bringFloatingInspectorToFront(panel.uuid)}
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className={styles.detachedHeader}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      >
        <span className={styles.detachedTitle}>Pinned Inspector</span>
        <button
          className={styles.detachedClose}
          onClick={() => closeFloatingInspector(panel.uuid)}
          title="Close pinned inspector"
        >
          x
        </button>
      </div>
      <div className={styles.detachedBody}>
        <ObjectInspectorPanel
          objectUuid={panel.uuid}
          emptyMessage="No object selected"
          missingMessage="Object no longer in scene"
          focusOnInteract
        />
      </div>
    </div>
  );
}

type DockMode = 'left' | 'right' | 'float';

const DOCK_OPTIONS: { mode: DockMode; label: string }[] = [
  { mode: 'left', label: 'Left' },
  { mode: 'right', label: 'Right' },
  { mode: 'float', label: 'Float' },
];

export interface DebugOverlayProps {
  plugins?: DebugPlugin[];
  sceneGraphHz?: number;
}

export function DebugOverlay({
  plugins = [],
  sceneGraphHz = 6,
}: DebugOverlayProps) {
  useHotkeys();
  useR3FAdapter({ sceneGraphHz });
  useSelectionHighlight();

  const isOpen = useDebugStore((s) => s.isOpen);
  const setOpen = useDebugStore((s) => s.setOpen);
  const activePanelId = useDebugStore((s) => s.activePanelId);
  const sceneGraph = useDebugStore((s) => s.sceneGraph);
  const floatingInspectors = useDebugStore((s) => s.floatingInspectors);
  const draggedSceneNodeUuid = useDebugStore((s) => s.draggedSceneNodeUuid);
  const setDraggedSceneNodeUuid = useDebugStore((s) => s.setDraggedSceneNodeUuid);
  const openFloatingInspector = useDebugStore((s) => s.openFloatingInspector);
  const removeMissingFloatingInspectors = useDebugStore(
    (s) => s.removeMissingFloatingInspectors,
  );
  const setSelectedObjectUuid = useDebugStore((s) => s.setSelectedObjectUuid);

  const drag = useDraggable();
  const [dockMode, setDockMode] = useState<DockMode>('right');

  const panels = useMemo(() => normalizePlugins(plugins), [plugins]);
  const isFloating = dockMode === 'float';
  const overlayModeClassName =
    dockMode === 'left'
      ? styles.overlayLeft
      : dockMode === 'right'
        ? styles.overlayRight
        : styles.overlayFloat;

  useEffect(() => {
    if (!panels.some((panel) => panel.id === activePanelId)) {
      useDebugStore.getState().setActivePanel(panels[0]?.id ?? 'metrics');
    }
  }, [activePanelId, panels]);

  useEffect(() => {
    removeMissingFloatingInspectors(sceneGraph.map((node) => node.uuid));
  }, [removeMissingFloatingInspectors, sceneGraph]);

  const onSceneDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onSceneDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const droppedUuid =
        event.dataTransfer.getData(DETACHED_INSPECTOR_MIME) ||
        draggedSceneNodeUuid;
      if (!droppedUuid) {
        setDraggedSceneNodeUuid(null);
        return;
      }
      openFloatingInspector(
        droppedUuid,
        clampFloatingPosition(
          event.clientX + DROP_OFFSET,
          event.clientY + DROP_OFFSET,
        ),
      );
      setSelectedObjectUuid(droppedUuid);
      setDraggedSceneNodeUuid(null);
    },
    [
      draggedSceneNodeUuid,
      openFloatingInspector,
      setDraggedSceneNodeUuid,
      setSelectedObjectUuid,
    ],
  );

  const onSceneDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    event.preventDefault();
  }, []);

  if (!isOpen) return <TransformGizmo />;

  return (
    <>
      <TransformGizmo />
      <Html
        fullscreen
        style={{ pointerEvents: 'none' }}
        zIndexRange={[9999, 9999]}
      >
        <div className={styles.root}>
          {draggedSceneNodeUuid && (
            <div
              className={styles.sceneDropTarget}
              onDragOver={onSceneDragOver}
              onDrop={onSceneDrop}
              onDragLeave={onSceneDragLeave}
            >
              Drop anywhere to pin this object inspector
            </div>
          )}

          <div
            className={`${styles.overlay} ${overlayModeClassName}`}
            style={{
              pointerEvents: 'auto',
              ...(isFloating
                ? { transform: `translate(${drag.offset.x}px, ${drag.offset.y}px)` }
                : null),
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div
              className={`${styles.header} ${isFloating ? styles.headerDraggable : ''}`}
              onPointerDown={isFloating ? drag.onPointerDown : undefined}
              onPointerMove={isFloating ? drag.onPointerMove : undefined}
              onPointerUp={isFloating ? drag.onPointerUp : undefined}
            >
              <div className={styles.title}>Inspector</div>
              <div className={styles.headerActions}>
                <div
                  className={styles.dockSwitcher}
                  role="group"
                  aria-label="Dock inspector"
                >
                  {DOCK_OPTIONS.map((option) => (
                    <button
                      key={option.mode}
                      className={`${styles.dockBtn} ${dockMode === option.mode ? styles.dockBtnActive : ''}`}
                      onClick={() => setDockMode(option.mode)}
                      title={`Dock ${option.label.toLowerCase()}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setOpen(false)}
                  title="Close (Esc)"
                >
                  x
                </button>
              </div>
            </div>

            <Tabs panels={panels} />

            <div className={styles.panelHost}>
              <PanelHost panels={panels} />
            </div>

            <div className={styles.footer}>
              <code>`</code> toggle &nbsp;|&nbsp; <code>Esc</code> close
            </div>
          </div>

          <div className={styles.detachedLayer}>
            {floatingInspectors.map((panel, index) => (
              <DetachedInspector
                key={panel.uuid}
                panel={panel}
                stackIndex={index}
              />
            ))}
          </div>
        </div>
      </Html>
    </>
  );
}
