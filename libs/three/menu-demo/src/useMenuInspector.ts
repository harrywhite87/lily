import { useDebugControls } from '@lilypad/debug';
import type { FlatValues } from '@lilypad/debug';

/* ─────────────────── tuning type ─────────────────── */

export interface MenuTuning {
  diameter: number;
  showAxesHelper: boolean;
  axesHelperSize: number;
}

export const DEFAULT_MENU_TUNING: MenuTuning = {
  diameter: 5,
  showAxesHelper: false,
  axesHelperSize: 3,
};

/* ─────────────────── hook ─────────────────── */

export function useMenuInspector(
  initial: MenuTuning = DEFAULT_MENU_TUNING,
): MenuTuning {
  const values = useDebugControls('Menu', {
    diameter:        { value: initial.diameter,        min: 1, max: 20, step: 0.1 },
    showAxesHelper:  { value: initial.showAxesHelper },
    axesHelperSize:  { value: initial.axesHelperSize,  min: 0.5, max: 10, step: 0.5 },
  });

  return valuesToTuning(values);
}

function valuesToTuning(v: FlatValues): MenuTuning {
  return {
    diameter:       v.diameter       as number,
    showAxesHelper: v.showAxesHelper as boolean,
    axesHelperSize: v.axesHelperSize as number,
  };
}
