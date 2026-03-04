import { useMemo, useCallback } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { useDebugStore } from '../core/store';
import type { SceneNode } from '../r3f/types';
import { PropertiesPanel } from './PropertiesPanel';
import styles from './SceneGraphPanel.module.scss';

export function SceneGraphPanel() {
  const nodes = useDebugStore((s) => s.sceneGraph);
  const selected = useDebugStore((s) => s.selectedObjectUuid);
  const setSelected = useDebugStore((s) => s.setSelectedObjectUuid);
  const openFloatingInspector = useDebugStore((s) => s.openFloatingInspector);
  const setDraggedSceneNodeUuid = useDebugStore((s) => s.setDraggedSceneNodeUuid);

  // Build adjacency map once per render
  const byId = useMemo(() => {
    const m = new Map<string, SceneNode>();
    for (const n of nodes) m.set(n.uuid, n);
    return m;
  }, [nodes]);

  const roots = useMemo(
    () => nodes.filter((n) => n.parentUuid === null),
    [nodes],
  );

  const handleExpand = useCallback((uuid: string) => {
    setSelected(uuid);
    openFloatingInspector(uuid);
  }, [openFloatingInspector, setSelected]);

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, uuid: string) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-lilypad-scene-node', uuid);
      event.dataTransfer.setData('text/plain', uuid);
      setDraggedSceneNodeUuid(uuid);
    },
    [setDraggedSceneNodeUuid],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSceneNodeUuid(null);
  }, [setDraggedSceneNodeUuid]);

  const renderNode = (uuid: string, depth: number): ReactNode => {
    const n = byId.get(uuid);
    if (!n) return null;

    const isSelected = selected === n.uuid;
    return (
      <div key={n.uuid}>
        <div
          className={styles.nodeRow}
          style={{ marginLeft: depth * 12 }}
        >
          <button
            onClick={() => setSelected(isSelected ? null : n.uuid)}
            className={`${styles.nodeBtn} ${isSelected ? styles.nodeBtnSelected : ''}`}
            title={n.uuid}
          >
            <span className={styles.nodeType}>{n.type}</span>
            <span className={n.visible ? undefined : styles.nodeNameHidden}>{n.name}</span>
          </button>
          <button
            onClick={() => handleExpand(n.uuid)}
            className={styles.iconBtn}
            title="Open floating inspector"
          >
            +
          </button>
          <button
            draggable
            onDragStart={(event) => handleDragStart(event, n.uuid)}
            onDragEnd={handleDragEnd}
            className={styles.dragHandle}
            title="Drag onto scene to open floating inspector"
          >
            ::
          </button>
        </div>
        {n.childrenUuids.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.scrollArea}>
        {roots.map((r) => renderNode(r.uuid, 0))}
        {nodes.length === 0 && (
          <div className={styles.empty}>
            No scene data yet...
          </div>
        )}
      </div>
      <PropertiesPanel />
    </div>
  );
}
