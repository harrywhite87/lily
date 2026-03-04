import { create } from 'zustand';
import type { AssetRecord } from './types';

type AssetState = {
  assets: AssetRecord[];
  upsert: (a: AssetRecord) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],

  upsert: (a) =>
    set((s) => {
      const idx = s.assets.findIndex((x) => x.id === a.id);
      if (idx >= 0) {
        const next = s.assets.slice();
        next[idx] = a;
        return { assets: next };
      }
      return { assets: [...s.assets, a] };
    }),

  remove: (id) =>
    set((s) => ({ assets: s.assets.filter((x) => x.id !== id) })),

  clear: () => set({ assets: [] }),
}));
