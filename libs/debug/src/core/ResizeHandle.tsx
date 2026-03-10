import { useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';
import { useDebugStore, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from './store';
import type { DockMode } from './store';
import styles from './DebugOverlay.module.scss';

/**
 * Vertical drag handle placed on the inner edge of the debug sidebar.
 * Calls `setSidebarWidth` during drag to resize the panel.
 */
export function ResizeHandle() {
  const setSidebarWidth = useDebugStore((s) => s.setSidebarWidth);
  const dockMode = useDebugStore((s) => s.dockMode) as DockMode;
  const draggingRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const currentWidth = useDebugStore.getState().sidebarWidth;
      draggingRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: currentWidth,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = draggingRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = event.clientX - drag.startX;
      // When docked right, dragging left (negative delta) should increase width
      // When docked left, dragging right (positive delta) should increase width
      const direction = dockMode === 'right' ? -1 : 1;
      const nextWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, drag.startWidth + delta * direction),
      );
      setSidebarWidth(nextWidth);
    },
    [dockMode, setSidebarWidth],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = draggingRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      draggingRef.current = null;
    },
    [],
  );

  return (
    <div
      className={styles.resizeHandle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
