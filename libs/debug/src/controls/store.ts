import { create } from 'zustand';
import type { ControlSchema, ControlEntry, FlatValues } from './types';
import { isButton, isFolder, isReadOnly } from './types';

/* ─── helpers ─── */

/** Extract initial values from a schema (flat — digs into folders) */
export function extractValues(schema: ControlSchema): FlatValues {
  const out: FlatValues = {};
  for (const [key, entry] of Object.entries(schema)) {
    if (isButton(entry)) continue;
    if (isFolder(entry)) {
      Object.assign(out, extractValues(entry.controls));
      continue;
    }
    out[key] = entry.value;
  }
  return out;
}

/* ─── store types ─── */

export type ControlRegistration = {
  id: string;
  schema: ControlSchema;
  values: FlatValues;
  order: number;
};

type ControlsStoreState = {
  /** Registered control groups (one per useDebugControls call) */
  registrations: Map<string, ControlRegistration>;

  /** Register a control group */
  register: (id: string, schema: ControlSchema, order: number) => void;

  /** Unregister a control group */
  unregister: (id: string) => void;

  /** Set a single value within a registration */
  setValue: (id: string, key: string, value: number | boolean | string) => void;

  /** Bulk-set values within a registration (programmatic update) */
  setValues: (id: string, values: Partial<FlatValues>) => void;

  /** Update schema (for dynamic controls that change with deps) */
  updateSchema: (id: string, schema: ControlSchema) => void;
};

/* ─── store ─── */

export const useControlsStore = create<ControlsStoreState>((set, get) => ({
  registrations: new Map(),

  register: (id, schema, order) => {
    set((s) => {
      const next = new Map(s.registrations);
      next.set(id, { id, schema, values: extractValues(schema), order });
      return { registrations: next };
    });
  },

  unregister: (id) => {
    set((s) => {
      const next = new Map(s.registrations);
      next.delete(id);
      return { registrations: next };
    });
  },

  setValue: (id, key, value) => {
    set((s) => {
      const reg = s.registrations.get(id);
      if (!reg) return s;
      const next = new Map(s.registrations);
      next.set(id, {
        ...reg,
        values: { ...reg.values, [key]: value },
      });
      return { registrations: next };
    });
  },

  setValues: (id, values) => {
    set((s) => {
      const reg = s.registrations.get(id);
      if (!reg) return s;
      const next = new Map(s.registrations);
      const filtered: FlatValues = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== undefined) filtered[k] = v;
      }
      next.set(id, {
        ...reg,
        values: { ...reg.values, ...filtered },
      });
      return { registrations: next };
    });
  },

  updateSchema: (id, schema) => {
    set((s) => {
      const reg = s.registrations.get(id);
      if (!reg) return s;
      const next = new Map(s.registrations);
      // Merge new default values, but keep existing overridden values
      const newDefaults = extractValues(schema);
      const merged: FlatValues = { ...newDefaults };
      for (const key of Object.keys(merged)) {
        if (key in reg.values) merged[key] = reg.values[key];
      }
      next.set(id, { ...reg, schema, values: merged });
      return { registrations: next };
    });
  },
}));
