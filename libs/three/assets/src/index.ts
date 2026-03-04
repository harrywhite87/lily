/* ─── Public API ─── */

export { AssetManager } from './AssetManager';
export {
  AssetRegistryProvider,
  useAssetRegistry,
} from './AssetRegistryProvider';
export { useMaterialTextures } from './useMaterialTextures';
export { useAssetStore } from './store';

export type {
  AssetKind,
  AssetSource,
  PrimitiveType,
  AssetRecordBase,
  PrimitiveAssetRecord,
  ModelAssetRecord,
  TextureAssetRecord,
  MaterialAssetRecord,
  GeometryAssetRecord,
  AssetRecord,
  LoadedAsset,
  MaterialTextures,
} from './types';

export { EMPTY_TEXTURES } from './types';
