import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import type {
  InspectorScalar,
  InspectorField,
  ObjectInspectorSurface,
} from '@lilypad/shared';
import { useDebugStore } from '../core/store';
import type { GizmoMode } from '../r3f/types';
import { getObjectInspectorSurface } from '../inspector/objectInspectorSurface';
import { ObjectInspectorFields } from '../inspector/ObjectInspectorFields';
import styles from './PropertiesPanel.module.scss';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

type Vec3 = [number, number, number];
type InspectorValue = InspectorScalar;

type ObjectInspectorPanelProps = {
  objectUuid: string | null;
  emptyMessage?: string;
  missingMessage?: string;
  className?: string;
  focusOnInteract?: boolean;
};

function readFieldValue(field: InspectorField): InspectorValue {
  if (field.kind === 'button') return '';
  return field.get();
}

function readSurfaceValues(
  surface: ObjectInspectorSurface | null,
): Record<string, InspectorValue> {
  if (!surface) return {};
  const values: Record<string, InspectorValue> = {};
  for (const field of surface.fields) {
    if (field.kind === 'button') continue;
    values[field.key] = readFieldValue(field);
  }
  return values;
}

const GIZMO_BUTTONS: { mode: GizmoMode; label: string }[] = [
  { mode: 'translate', label: 'Move' },
  { mode: 'rotate', label: 'Rotate' },
  { mode: 'scale', label: 'Scale' },
];

function GizmoToolbar({ onActivate }: { onActivate: () => void }) {
  const gizmoMode = useDebugStore((s) => s.gizmoMode);
  const setGizmoMode = useDebugStore((s) => s.setGizmoMode);

  return (
    <div className={styles.toolbar}>
      {GIZMO_BUTTONS.map((btn) => {
        const isActive = gizmoMode === btn.mode;
        return (
          <button
            key={btn.mode}
            className={`${styles.toolBtn} ${isActive ? styles.toolBtnActive : ''}`}
            onClick={() => {
              onActivate();
              setGizmoMode(isActive ? 'off' : btn.mode);
            }}
            title={`${btn.label} gizmo`}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

export function ObjectInspectorPanel({
  objectUuid,
  emptyMessage = 'Select an object',
  missingMessage = 'Object not found',
  className,
  focusOnInteract = true,
}: ObjectInspectorPanelProps) {
  const sceneRef = useDebugStore((s) => s.sceneRef);
  const setSelectedObjectUuid = useDebugStore((s) => s.setSelectedObjectUuid);

  const [pos, setPos] = useState<Vec3>([0, 0, 0]);
  const [rotDeg, setRotDeg] = useState<Vec3>([0, 0, 0]);
  const [scale, setScale] = useState<Vec3>([1, 1, 1]);
  const [customValues, setCustomValues] = useState<
    Record<string, InspectorValue>
  >({});
  const [objInfo, setObjInfo] = useState<{ name: string; type: string } | null>(
    null,
  );

  const objRef = useRef<THREE.Object3D | null>(null);
  const surfaceRef = useRef<ObjectInspectorSurface | null>(null);
  const rafRef = useRef<number>(0);
  const editingRef = useRef<string | null>(null);
  const shiftPressedRef = useRef(false);

  const activateObject = useCallback(() => {
    if (!focusOnInteract || !objectUuid) return;
    setSelectedObjectUuid(objectUuid);
  }, [focusOnInteract, objectUuid, setSelectedObjectUuid]);

  useEffect(() => {
    if (!sceneRef || !objectUuid) {
      objRef.current = null;
      surfaceRef.current = null;
      setObjInfo(null);
      setScale([1, 1, 1]);
      setCustomValues({});
      return;
    }
    const obj = sceneRef.getObjectByProperty('uuid', objectUuid);
    objRef.current = obj ?? null;
    if (obj) {
      setPos([obj.position.x, obj.position.y, obj.position.z]);
      setRotDeg([
        obj.rotation.x * RAD2DEG,
        obj.rotation.y * RAD2DEG,
        obj.rotation.z * RAD2DEG,
      ]);
      setScale([obj.scale.x, obj.scale.y, obj.scale.z]);
      setObjInfo({ name: obj.name || '(unnamed)', type: obj.type });
      const surface = getObjectInspectorSurface(obj);
      surfaceRef.current = surface;
      setCustomValues(readSurfaceValues(surface));
    } else {
      surfaceRef.current = null;
      setObjInfo(null);
      setScale([1, 1, 1]);
      setCustomValues({});
    }
  }, [sceneRef, objectUuid]);

  useEffect(() => {
    const tick = () => {
      const obj = objRef.current;
      if (obj) {
        if (!editingRef.current?.startsWith('pos')) {
          setPos([obj.position.x, obj.position.y, obj.position.z]);
        }
        if (!editingRef.current?.startsWith('rot')) {
          setRotDeg([
            obj.rotation.x * RAD2DEG,
            obj.rotation.y * RAD2DEG,
            obj.rotation.z * RAD2DEG,
          ]);
        }
        if (!editingRef.current?.startsWith('scale')) {
          setScale([obj.scale.x, obj.scale.y, obj.scale.z]);
        }

        const surface = surfaceRef.current;
        if (surface) {
          setCustomValues((prev) => {
            let changed = false;
            const next = { ...prev };

            for (const field of surface.fields) {
              if (field.kind === 'button') continue;
              const value = readFieldValue(field);
              if (next[field.key] !== value) {
                changed = true;
                next[field.key] = value;
              }
            }

            return changed ? next : prev;
          });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [objectUuid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftPressedRef.current = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftPressedRef.current = false;
      }
    };
    const onWindowBlur = () => {
      shiftPressedRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  const handlePosChange = useCallback(
    (axis: number, value: number) => {
      const obj = objRef.current;
      if (!obj) return;
      activateObject();
      const arr: Vec3 = [obj.position.x, obj.position.y, obj.position.z];
      arr[axis] = value;
      obj.position.set(arr[0], arr[1], arr[2]);
      setPos(arr);
    },
    [activateObject],
  );

  const handleRotChange = useCallback(
    (axis: number, valueDeg: number) => {
      const obj = objRef.current;
      if (!obj) return;
      activateObject();
      const arr: Vec3 = [
        obj.rotation.x * RAD2DEG,
        obj.rotation.y * RAD2DEG,
        obj.rotation.z * RAD2DEG,
      ];
      arr[axis] = valueDeg;
      obj.rotation.set(arr[0] * DEG2RAD, arr[1] * DEG2RAD, arr[2] * DEG2RAD);
      setRotDeg(arr);
    },
    [activateObject],
  );

  const handleCustomValueChange = useCallback(
    (key: string, value: InspectorValue) => {
      const surface = surfaceRef.current;
      if (!surface) return;

      const field = surface.fields.find((entry) => entry.key === key);
      if (!field || field.kind === 'button' || field.kind === 'readonly') {
        return;
      }

      activateObject();
      if (field.kind === 'number' && typeof value === 'number') {
        field.set(value);
      } else if (field.kind === 'boolean' && typeof value === 'boolean') {
        field.set(value);
      } else if (
        (field.kind === 'color' || field.kind === 'select') &&
        typeof value === 'string'
      ) {
        field.set(value);
      }

      setCustomValues((prev) => ({ ...prev, [key]: value }));
    },
    [activateObject],
  );

  const handleCustomButtonClick = useCallback(
    (key: string) => {
      const surface = surfaceRef.current;
      if (!surface) return;

      const field = surface.fields.find((entry) => entry.key === key);
      if (field?.kind === 'button') {
        activateObject();
        field.onClick();
      }
    },
    [activateObject],
  );

  const handleScaleChange = useCallback(
    (axis: number, value: number) => {
      const obj = objRef.current;
      if (!obj) return;
      activateObject();
      const arr: Vec3 = [obj.scale.x, obj.scale.y, obj.scale.z];
      if (shiftPressedRef.current) {
        arr[0] = value;
        arr[1] = value;
        arr[2] = value;
      } else {
        arr[axis] = value;
      }
      obj.scale.set(arr[0], arr[1], arr[2]);
      setScale(arr);
    },
    [activateObject],
  );

  const rootClassName = className
    ? `${styles.panel} ${className}`
    : styles.panel;

  if (!objectUuid) {
    return (
      <div className={rootClassName}>
        <div className={styles.placeholder}>{emptyMessage}</div>
      </div>
    );
  }

  if (!objInfo) {
    return (
      <div className={rootClassName}>
        <div className={styles.placeholder}>{missingMessage}</div>
      </div>
    );
  }

  const AXES = ['X', 'Y', 'Z'] as const;
  const AXIS_CLASSES = [styles.axisX, styles.axisY, styles.axisZ];
  const customSurface = surfaceRef.current;

  return (
    <div className={rootClassName}>
      <div className={styles.objHeader}>
        <span className={styles.objType}>{objInfo.type}</span>
        <span className={styles.objName}>{objInfo.name}</span>
      </div>

      <GizmoToolbar onActivate={activateObject} />

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Position</div>
        <div className={styles.row}>
          {AXES.map((axis, i) => (
            <div key={axis} className={styles.field}>
              <span className={`${styles.axisLabel} ${AXIS_CLASSES[i]}`}>
                {axis}
              </span>
              <input
                className={styles.input}
                type="number"
                step={0.1}
                value={Number(pos[i].toFixed(3))}
                onFocus={() => {
                  activateObject();
                  editingRef.current = `pos${axis}`;
                }}
                onBlur={() => {
                  editingRef.current = null;
                }}
                onChange={(e) =>
                  handlePosChange(i, parseFloat(e.target.value) || 0)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Rotation (deg)</div>
        <div className={styles.row}>
          {AXES.map((axis, i) => (
            <div key={axis} className={styles.field}>
              <span className={`${styles.axisLabel} ${AXIS_CLASSES[i]}`}>
                {axis}
              </span>
              <input
                className={styles.input}
                type="number"
                step={1}
                value={Number(rotDeg[i].toFixed(2))}
                onFocus={() => {
                  activateObject();
                  editingRef.current = `rot${axis}`;
                }}
                onBlur={() => {
                  editingRef.current = null;
                }}
                onChange={(e) =>
                  handleRotChange(i, parseFloat(e.target.value) || 0)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Scale (Shift = all axes)</div>
        <div className={styles.row}>
          {AXES.map((axis, i) => (
            <div key={axis} className={styles.field}>
              <span className={`${styles.axisLabel} ${AXIS_CLASSES[i]}`}>
                {axis}
              </span>
              <input
                className={styles.input}
                type="number"
                step={0.01}
                value={Number(scale[i].toFixed(3))}
                onFocus={() => {
                  activateObject();
                  editingRef.current = `scale${axis}`;
                }}
                onBlur={() => {
                  editingRef.current = null;
                }}
                onChange={(e) =>
                  handleScaleChange(i, parseFloat(e.target.value) || 0)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {customSurface && customSurface.fields.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            {customSurface.title ?? 'Component'}
          </div>
          <ObjectInspectorFields
            surface={customSurface}
            values={customValues}
            onValueChange={handleCustomValueChange}
            onButtonClick={handleCustomButtonClick}
          />
        </div>
      )}
    </div>
  );
}
