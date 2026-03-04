/* ─────────────────────────────────────────────────── */
/*  Control schema types for useDebugControls          */
/* ─────────────────────────────────────────────────── */

/** Number slider: detected when value is `number` and min/max are present */
export type NumberControl = {
  value: number;
  min: number;
  max: number;
  step: number;
  label?: string;
};

/** Boolean toggle: detected when value is `boolean` */
export type BooleanControl = {
  value: boolean;
  label?: string;
};

/** Color picker: detected when value is a `#hex` string */
export type ColorControl = {
  value: string; // '#rrggbb'
  label?: string;
};

/** Read-only display: when editable is explicitly false */
export type ReadOnlyControl = {
  value: string | number;
  editable: false;
  label?: string;
};

/** Select dropdown */
export type SelectControl = {
  type: 'select';
  value: string;
  options: string[];
  label?: string;
};

/** Action button */
export type ButtonControl = {
  type: 'button';
  label: string;
  onClick: () => void;
};

/** Folder grouping */
export type FolderControl = {
  type: 'folder';
  title: string;
  collapsed?: boolean;
  controls: ControlSchema;
};

/** A single control entry */
export type ControlEntry =
  | NumberControl
  | BooleanControl
  | ColorControl
  | ReadOnlyControl
  | SelectControl
  | ButtonControl
  | FolderControl;

/** A flat or nested schema of controls */
export type ControlSchema = Record<string, ControlEntry>;

/* ─── Type guards ─── */

export function isButton(c: ControlEntry): c is ButtonControl {
  return 'type' in c && c.type === 'button';
}

export function isFolder(c: ControlEntry): c is FolderControl {
  return 'type' in c && c.type === 'folder';
}

export function isSelect(c: ControlEntry): c is SelectControl {
  return 'type' in c && c.type === 'select';
}

export function isReadOnly(c: ControlEntry): c is ReadOnlyControl {
  return 'editable' in c && c.editable === false;
}

export function isBoolean(c: ControlEntry): c is BooleanControl {
  return !isButton(c) && !isFolder(c) && !isReadOnly(c) && typeof c.value === 'boolean';
}

export function isColor(c: ControlEntry): c is ColorControl {
  return (
    !isButton(c) &&
    !isFolder(c) &&
    !isReadOnly(c) &&
    typeof c.value === 'string' &&
    c.value.startsWith('#')
  );
}

export function isNumber(c: ControlEntry): c is NumberControl {
  return (
    !isButton(c) &&
    !isFolder(c) &&
    !isReadOnly(c) &&
    typeof c.value === 'number' &&
    'min' in c
  );
}

/* ─── Value extraction ─── */

/**
 * Simplified return type — a flat record of key→value for all non-button,
 * non-folder entries (including recursed folder children).
 */
export type FlatValues = Record<string, number | boolean | string>;
