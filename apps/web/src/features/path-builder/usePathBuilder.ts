import { useState, useMemo, useCallback, useRef } from 'react';
import { useDebugControls } from '@lilypad/debug';
import type { ControlSchema, FolderControl } from '@lilypad/debug';

export type PathPoint = [number, number, number];

/**
 * Manages an interactive path — an ordered list of 3D markers.
 *
 * Registers debug controls for add/remove and per-point x/y/z sliders.
 * Returns the current points array and an onPointMoved callback for gizmo sync.
 */
export function usePathBuilder() {
  const [pointCount, setPointCount] = useState(0);
  const pointCountRef = useRef(pointCount);
  pointCountRef.current = pointCount;

  const addPoint = useCallback(() => {
    setPointCount((n) => n + 1);
  }, []);

  const removeLastPoint = useCallback(() => {
    setPointCount((n) => Math.max(0, n - 1));
  }, []);

  // Build the dynamic control schema
  const [values, setValues] = useDebugControls(
    'Path',
    () => {
      const schema: ControlSchema = {};

      schema['➕ Add Point'] = {
        type: 'button' as const,
        label: '➕ Add Point',
        onClick: () => setPointCount((n) => n + 1),
      };

      if (pointCountRef.current > 0) {
        schema['➖ Remove Last'] = {
          type: 'button' as const,
          label: '➖ Remove Last',
          onClick: () => setPointCount((n) => Math.max(0, n - 1)),
        };
      }

      for (let i = 0; i < pointCountRef.current; i++) {
        const folder: FolderControl = {
          type: 'folder' as const,
          title: `Point ${i}`,
          collapsed: true,
          controls: {
            [`p${i}_x`]: { value: i * 2, min: -20, max: 20, step: 0.1, label: 'X' },
            [`p${i}_y`]: { value: 0, min: -20, max: 20, step: 0.1, label: 'Y' },
            [`p${i}_z`]: { value: 0, min: -20, max: 20, step: 0.1, label: 'Z' },
          },
        };
        schema[`Point ${i}`] = folder;
      }

      return schema;
    },
    [pointCount],
  );

  // Reconstruct points array from flat values
  const points = useMemo<PathPoint[]>(() => {
    const result: PathPoint[] = [];
    for (let i = 0; i < pointCount; i++) {
      const x = (values[`p${i}_x`] as number) ?? i * 2;
      const y = (values[`p${i}_y`] as number) ?? 0;
      const z = (values[`p${i}_z`] as number) ?? 0;
      result.push([x, y, z]);
    }
    return result;
  }, [values, pointCount]);

  /**
   * Called by PathMarkers when the gizmo moves a marker.
   * Updates the control slider values so they stay in sync.
   */
  const onPointMoved = useCallback(
    (index: number, x: number, y: number, z: number) => {
      const rounded = (v: number) => Math.round(v * 10) / 10;
      setValues({
        [`p${index}_x`]: rounded(x),
        [`p${index}_y`]: rounded(y),
        [`p${index}_z`]: rounded(z),
      });
    },
    [setValues],
  );

  return { points, pointCount, addPoint, removeLastPoint, onPointMoved };
}
