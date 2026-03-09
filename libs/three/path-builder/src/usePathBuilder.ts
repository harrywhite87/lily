import { useCallback, useMemo, useRef, useState } from 'react';
import { useDebugControls } from '@lilypad/debug';
import type { ControlSchema, FolderControl } from '@lilypad/debug';

export type PathPoint = [number, number, number];

export function usePathBuilder() {
  const [pointCount, setPointCount] = useState(0);
  const pointCountRef = useRef(pointCount);
  pointCountRef.current = pointCount;

  const addPoint = useCallback(() => {
    setPointCount((count) => count + 1);
  }, []);

  const removeLastPoint = useCallback(() => {
    setPointCount((count) => Math.max(0, count - 1));
  }, []);

  const [values, setValues] = useDebugControls(
    'Path',
    () => {
      const schema: ControlSchema = {};

      schema['+ Add Point'] = {
        type: 'button',
        label: '+ Add Point',
        onClick: addPoint,
      };

      if (pointCountRef.current > 0) {
        schema['- Remove Last'] = {
          type: 'button',
          label: '- Remove Last',
          onClick: removeLastPoint,
        };
      }

      for (let index = 0; index < pointCountRef.current; index += 1) {
        const folder: FolderControl = {
          type: 'folder',
          title: `Point ${index}`,
          collapsed: true,
          controls: {
            [`p${index}_x`]: {
              value: index * 2,
              min: -20,
              max: 20,
              step: 0.1,
              label: 'X',
            },
            [`p${index}_y`]: {
              value: 0,
              min: -20,
              max: 20,
              step: 0.1,
              label: 'Y',
            },
            [`p${index}_z`]: {
              value: 0,
              min: -20,
              max: 20,
              step: 0.1,
              label: 'Z',
            },
          },
        };

        schema[`Point ${index}`] = folder;
      }

      return schema;
    },
    [addPoint, pointCount, removeLastPoint],
  );

  const points = useMemo<PathPoint[]>(() => {
    const nextPoints: PathPoint[] = [];

    for (let index = 0; index < pointCount; index += 1) {
      const x = (values[`p${index}_x`] as number) ?? index * 2;
      const y = (values[`p${index}_y`] as number) ?? 0;
      const z = (values[`p${index}_z`] as number) ?? 0;
      nextPoints.push([x, y, z]);
    }

    return nextPoints;
  }, [pointCount, values]);

  const onPointMoved = useCallback(
    (index: number, x: number, y: number, z: number) => {
      const roundToTenth = (value: number) => Math.round(value * 10) / 10;

      setValues({
        [`p${index}_x`]: roundToTenth(x),
        [`p${index}_y`]: roundToTenth(y),
        [`p${index}_z`]: roundToTenth(z),
      });
    },
    [setValues],
  );

  return { points, pointCount, addPoint, removeLastPoint, onPointMoved };
}
