import { useState, useEffect } from 'react';
import { useAssetRegistry } from './AssetRegistryProvider';
import type { MaterialTextures } from './types';
import { EMPTY_TEXTURES } from './types';

/**
 * Load PBR textures for a named material from materials.glb.
 *
 * Replaces per-component hooks like `useSandTextures()` / `useRustTextures()`
 * with a single generic hook backed by the shared asset registry.
 *
 * @param materialName  Name of the material in the GLB, e.g. 'Sand.001' or 'Rust.002'
 */
export function useMaterialTextures(materialName: string): MaterialTextures {
  const manager = useAssetRegistry();
  const [textures, setTextures] = useState<MaterialTextures>(EMPTY_TEXTURES);

  useEffect(() => {
    let cancelled = false;

    manager.loadMaterialTextures(materialName).then((result) => {
      if (!cancelled) setTextures(result);
    });

    return () => {
      cancelled = true;
    };
  }, [manager, materialName]);

  return textures;
}
