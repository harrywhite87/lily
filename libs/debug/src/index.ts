/* ─── Public API ─── */

export { DebugOverlay } from './core/DebugOverlay';
export { useDebug, useDebugStore } from './core/store';
export { useDebugControls } from './controls/useDebugControls';
export {
  OBJECT_INSPECTOR_SURFACE_KEY,
  setObjectInspectorSurface,
  clearObjectInspectorSurface,
  getObjectInspectorSurface,
} from './inspector/objectInspectorSurface';
export { useObjectInspectorSurface } from './inspector/useObjectInspectorSurface';
export { ObjectInspectorFields } from './inspector/ObjectInspectorFields';

export type {
  DebugPlugin,
  DebugPanelRegistration,
  DebugCommand,
} from './core/types';

export type {
  MetricsSnapshot,
  SceneNode,
} from './r3f/types';

export type {
  ControlSchema,
  ControlEntry,
  NumberControl,
  BooleanControl,
  ColorControl,
  ReadOnlyControl,
  SelectControl,
  ButtonControl,
  FolderControl,
  FlatValues,
} from './controls/types';

export type {
  InspectorScalar,
  InspectorNumberField,
  InspectorBooleanField,
  InspectorColorField,
  InspectorSelectField,
  InspectorReadOnlyField,
  InspectorButtonField,
  InspectorField,
  ObjectInspectorSurface,
} from '@lilypad/shared';
