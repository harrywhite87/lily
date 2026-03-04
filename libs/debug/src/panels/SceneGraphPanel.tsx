import { useMemo, useCallback } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { useDebugStore } from '../core/store';
import type { SceneNode } from '../r3f/types';
import { PropertiesPanel } from './PropertiesPanel';

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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: depth * 12,
          }}
        >
          <button
            onClick={() => setSelected(isSelected ? null : n.uuid)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              flex: 1,
              minWidth: 0,
              padding: '2px 6px',
              borderRadius: 4,
              background: isSelected
                ? 'rgba(255,255,100,0.14)'
                : 'transparent',
              fontSize: 11,
              lineHeight: '18px',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected)
                e.currentTarget.style.background = 'transparent';
            }}
            title={n.uuid}
          >
            <span style={{ opacity: 0.55, marginRight: 4 }}>{n.type}</span>
            <span style={{ opacity: n.visible ? 1 : 0.4 }}>{n.name}</span>
          </button>
          <button
            onClick={() => handleExpand(n.uuid)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 18,
              height: 18,
              borderRadius: 4,
              textAlign: 'center',
              fontSize: 11,
              lineHeight: '18px',
              background: 'rgba(255,255,255,0.06)',
              opacity: 0.8,
            }}
            title="Open floating inspector"
          >
            +
          </button>
          <button
            draggable
            onDragStart={(event) => handleDragStart(event, n.uuid)}
            onDragEnd={handleDragEnd}
            style={{
              all: 'unset',
              cursor: 'grab',
              width: 18,
              height: 18,
              borderRadius: 4,
              textAlign: 'center',
              fontSize: 11,
              lineHeight: '18px',
              background: 'rgba(255,255,255,0.06)',
              opacity: 0.55,
            }}
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
      <div
        style={{
          maxHeight: 240,
          overflow: 'auto',
          paddingRight: 4,
        }}
      >
        {roots.map((r) => renderNode(r.uuid, 0))}
        {nodes.length === 0 && (
          <div style={{ opacity: 0.5, fontSize: 11, padding: 4 }}>
            No scene data yet...
          </div>
        )}
      </div>
      <PropertiesPanel />
    </div>
  );
}
