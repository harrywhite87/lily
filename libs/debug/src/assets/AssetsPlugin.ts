import { AssetsPanel } from './AssetsPanel';
import type { DebugPlugin } from '../core/types';
import type { AssetManager } from '@lilypad/three-assets';

/**
 * Creates an Assets plugin for the DebugOverlay.
 *
 * Usage:
 * ```tsx
 * <DebugOverlay plugins={[AssetsPlugin(assetManager)]} />
 * ```
 */
export function AssetsPlugin(manager: AssetManager): DebugPlugin {
  return {
    id: 'assets',
    title: 'Assets',
    panels: [
      {
        id: 'assets',
        title: 'Assets',
        order: 5,
        render: () => AssetsPanel({ manager }),
      },
    ],
  };
}
