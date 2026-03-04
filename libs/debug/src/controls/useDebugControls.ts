import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useControlsStore, extractValues } from './store';
import type { ControlSchema, FlatValues } from './types';

let orderCounter = 0;

/** Shallow-compare two flat value records */
function shallowEqual(a: FlatValues, b: FlatValues): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Register interactive controls in the debug overlay.
 *
 * Simple usage — returns current values:
 * ```ts
 * const { speed, autoRotate } = useDebugControls('Viewport', {
 *   speed: { value: 1.5, min: 0, max: 10, step: 0.1 },
 *   autoRotate: { value: false },
 * });
 * ```
 *
 * With setter — returns [values, setValues]:
 * ```ts
 * const [values, setValues] = useDebugControls('Caustics', () => schema, []);
 * ```
 */
export function useDebugControls<S extends ControlSchema>(
  id: string,
  schema: S,
  deps?: React.DependencyList,
): FlatValues;
export function useDebugControls<S extends ControlSchema>(
  id: string,
  schemaFactory: () => S,
  deps?: React.DependencyList,
): [FlatValues, (values: Partial<FlatValues>) => void];
export function useDebugControls<S extends ControlSchema>(
  id: string,
  schemaOrFactory: S | (() => S),
  deps?: React.DependencyList,
): FlatValues | [FlatValues, (values: Partial<FlatValues>) => void] {
  const isFactory = typeof schemaOrFactory === 'function';
  const orderRef = useRef(orderCounter++);

  // Resolve schema — only recompute when deps change
  const schema = useMemo(
    () => (isFactory ? (schemaOrFactory as () => S)() : schemaOrFactory),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps ?? [],
  );

  // Stable initial values (computed once from the initial schema)
  const initialValuesRef = useRef<FlatValues | null>(null);
  if (initialValuesRef.current === null) {
    initialValuesRef.current = extractValues(schema);
  }

  // Register on mount, unregister on unmount
  useEffect(() => {
    useControlsStore.getState().register(id, schema, orderRef.current);
    return () => useControlsStore.getState().unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update schema when it structurally changes (skip first render)
  const prevSchemaRef = useRef(schema);
  useEffect(() => {
    if (prevSchemaRef.current !== schema) {
      prevSchemaRef.current = schema;
      useControlsStore.getState().updateSchema(id, schema);
    }
  }, [id, schema]);

  // Stable value reference — only change when content actually changes
  const cachedRef = useRef<FlatValues>(initialValuesRef.current);

  const values = useControlsStore((s) => {
    const reg = s.registrations.get(id);
    const current = reg?.values ?? initialValuesRef.current!;
    // Only return a new reference if values actually changed
    if (shallowEqual(cachedRef.current, current)) {
      return cachedRef.current;
    }
    cachedRef.current = current;
    return current;
  });

  const setValues = useCallback(
    (v: Partial<FlatValues>) => useControlsStore.getState().setValues(id, v),
    [id],
  );

  if (isFactory) {
    return [values, setValues];
  }
  return values;
}
