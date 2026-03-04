export type InspectorScalar = number | string | boolean;

export type InspectorNumberField = {
  kind: 'number';
  key: string;
  label?: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (value: number) => void;
};

export type InspectorBooleanField = {
  kind: 'boolean';
  key: string;
  label?: string;
  get: () => boolean;
  set: (value: boolean) => void;
};

export type InspectorColorField = {
  kind: 'color';
  key: string;
  label?: string;
  get: () => string;
  set: (value: string) => void;
};

export type InspectorSelectField = {
  kind: 'select';
  key: string;
  label?: string;
  options: string[];
  get: () => string;
  set: (value: string) => void;
};

export type InspectorReadOnlyField = {
  kind: 'readonly';
  key: string;
  label?: string;
  get: () => string | number;
};

export type InspectorButtonField = {
  kind: 'button';
  key: string;
  label: string;
  onClick: () => void;
};

export type InspectorField =
  | InspectorNumberField
  | InspectorBooleanField
  | InspectorColorField
  | InspectorSelectField
  | InspectorReadOnlyField
  | InspectorButtonField;

export type ObjectInspectorSurface = {
  title?: string;
  fields: InspectorField[];
};
