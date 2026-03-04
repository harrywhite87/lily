import { createContext, useContext, useState, type ReactNode } from 'react';
import { AssetManager } from './AssetManager';

const AssetRegistryContext = createContext<AssetManager>(null!);

export interface AssetRegistryProviderProps {
  children: ReactNode;
}

/**
 * Provides a singleton AssetManager to the component tree.
 * Mount once near the root of the app (e.g. in `main.tsx`).
 */
export function AssetRegistryProvider({ children }: AssetRegistryProviderProps) {
  const [manager] = useState(() => new AssetManager());

  return (
    <AssetRegistryContext.Provider value={manager}>
      {children}
    </AssetRegistryContext.Provider>
  );
}

/**
 * Access the shared AssetManager instance.
 */
export function useAssetRegistry(): AssetManager {
  return useContext(AssetRegistryContext);
}
