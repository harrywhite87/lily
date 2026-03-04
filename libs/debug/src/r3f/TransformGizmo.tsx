import { useRef, useEffect, JSX } from 'react';
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

  // Resolve the live THREE.Object3D
  const obj =
    selectedUuid && gizmoMode !== 'off'
      ? scene.getObjectByProperty('uuid', selectedUuid)
      : null;

  // Disable orbit controls while dragging gizmo
  useEffect(() => {
    const tc = tcRef.current;
    if (!tc) return;

    const onDraggingChanged = (event: { value: boolean }) => {
      if (controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (controls as any).enabled = !event.value;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc.addEventListener('dragging-changed', onDraggingChanged as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tc.removeEventListener('dragging-changed', onDraggingChanged as any);
      if (controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (controls as any).enabled = true;
      }
    };
  }, [controls, selectedUuid, gizmoMode]);

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
