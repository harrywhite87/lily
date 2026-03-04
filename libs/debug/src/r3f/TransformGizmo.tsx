import { useRef, useEffect, useCallback, JSX } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { useDebugStore } from '../core/store';

/**
 * R3F component that renders a TransformControls gizmo on the
 * currently selected object.
 */
export function TransformGizmo(): JSX.Element | null {
  const { scene, controls } = useThree();
  const selectedUuid = useDebugStore((s) => s.selectedObjectUuid);
  const gizmoMode = useDebugStore((s) => s.gizmoMode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tcRef = useRef<any>(null);
  const shiftRef = useRef(false);
  const prevScaleRef = useRef<[number, number, number]>([1, 1, 1]);

  // Resolve the live THREE.Object3D
  const obj =
    selectedUuid && gizmoMode !== 'off'
      ? scene.getObjectByProperty('uuid', selectedUuid)
      : null;

  // Track shift key for uniform scale
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftRef.current = false;
    };
    const blur = () => { shiftRef.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Uniform-scale callback: snap all axes to the most-changed axis
  const onObjectChange = useCallback(() => {
    if (gizmoMode !== 'scale' || !shiftRef.current || !obj) return;
    const s = obj.scale;
    const prev = prevScaleRef.current;
    const dx = Math.abs(s.x - prev[0]);
    const dy = Math.abs(s.y - prev[1]);
    const dz = Math.abs(s.z - prev[2]);
    const dominant = dx >= dy && dx >= dz ? s.x : dy >= dz ? s.y : s.z;
    s.set(dominant, dominant, dominant);
    prevScaleRef.current = [dominant, dominant, dominant];
  }, [gizmoMode, obj]);

  // Disable orbit controls while dragging gizmo & listen for objectChange
  useEffect(() => {
    const tc = tcRef.current;
    if (!tc) return;

    const onDraggingChanged = (event: { value: boolean }) => {
      if (event.value && obj) {
        // Snapshot scale at drag start
        prevScaleRef.current = [obj.scale.x, obj.scale.y, obj.scale.z];
      }
      if (controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (controls as any).enabled = !event.value;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc.addEventListener('dragging-changed', onDraggingChanged as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc.addEventListener('objectChange', onObjectChange as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tc.removeEventListener('dragging-changed', onDraggingChanged as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tc.removeEventListener('objectChange', onObjectChange as any);
      if (controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (controls as any).enabled = true;
      }
    };
  }, [controls, selectedUuid, gizmoMode, onObjectChange, obj]);

  if (!obj) return null;

  const mode: 'translate' | 'rotate' | 'scale' =
    gizmoMode === 'rotate'
      ? 'rotate'
      : gizmoMode === 'scale'
        ? 'scale'
        : 'translate';

  return (
    <TransformControls
      ref={tcRef}
      object={obj}
      mode={mode}
    />
  );
}
