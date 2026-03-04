import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CausticsOverrides } from '../shaders/Caustics';
import type { WaterOverrides } from '../shaders/WaterSurface';

// ── Default values ──

export const CAUSTICS_DEFAULTS: Required<CausticsOverrides> = {
  scale: 2.2,
  speed: 0.18,
  baseIntensity: 1.5,
  contrast: 1.42,
  shimmer: 0.54,
  flowAmount: 1.2,
  edgeFade: 0.2,
  sandAmount: 0.42,
  sandScale: 5.6,
  sandTexScale: 1.0,
};

export const WATER_DEFAULTS: Required<WaterOverrides> = {
  waveScale: 0.38,
  waveDepth: 1.1,
  waveDrag: 1.0,
  waveSpeed: 1.0,
  reflectionStrength: 1.18,
  scatterStrength: 1.0,
  sunIntensity: 0.95,
  exposure: 2.0,
  timeOfDay: 0.0,
  animateSun: false,
  sunCycleSpeed: 0.03,
  normalEpsilon: 0.06,
  normalSmooth: 0.8,
  fogNear: 8.0,
  fogFar: 56.0,
  fogStrength: 0.38,
};

// ── Serializable config shape ──

export interface ShaderConfig {
  caustics: Required<CausticsOverrides>;
  water: Required<WaterOverrides>;
}

const STORAGE_KEY = 'lilypad:shader-config';

function loadFromStorage(): ShaderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { caustics: { ...CAUSTICS_DEFAULTS }, water: { ...WATER_DEFAULTS } };
    const parsed = JSON.parse(raw) as Partial<ShaderConfig>;
    return {
      caustics: { ...CAUSTICS_DEFAULTS, ...parsed.caustics },
      water: { ...WATER_DEFAULTS, ...parsed.water },
    };
  } catch {
    return { caustics: { ...CAUSTICS_DEFAULTS }, water: { ...WATER_DEFAULTS } };
  }
}

function saveToStorage(config: ShaderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ── Context ──

interface ShaderConfigContextValue {
  config: ShaderConfig;
  setCaustics: (overrides: Partial<CausticsOverrides>) => void;
  setWater: (overrides: Partial<WaterOverrides>) => void;
  resetAll: () => void;
  downloadConfig: () => void;
  importConfig: (file: File) => Promise<void>;
}

const ShaderConfigContext = createContext<ShaderConfigContextValue>(null!);

export function ShaderConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShaderConfig>(loadFromStorage);

  // Persist on every change
  useEffect(() => {
    saveToStorage(config);
  }, [config]);

  const setCaustics = useCallback((overrides: Partial<CausticsOverrides>) => {
    setConfig((prev) => ({
      ...prev,
      caustics: { ...prev.caustics, ...overrides },
    }));
  }, []);

  const setWater = useCallback((overrides: Partial<WaterOverrides>) => {
    setConfig((prev) => ({
      ...prev,
      water: { ...prev.water, ...overrides },
    }));
  }, []);

  const resetAll = useCallback(() => {
    const defaults: ShaderConfig = {
      caustics: { ...CAUSTICS_DEFAULTS },
      water: { ...WATER_DEFAULTS },
    };
    setConfig(defaults);
  }, []);

  const downloadConfig = useCallback(() => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lilypad-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const importConfig = useCallback(async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as Partial<ShaderConfig>;
      setConfig({
        caustics: { ...CAUSTICS_DEFAULTS, ...parsed.caustics },
        water: { ...WATER_DEFAULTS, ...parsed.water },
      });
    } catch {
      alert('Invalid config file — expected Lilypad JSON.');
    }
  }, []);

  return (
    <ShaderConfigContext.Provider
      value={{ config, setCaustics, setWater, resetAll, downloadConfig, importConfig }}
    >
      {children}
    </ShaderConfigContext.Provider>
  );
}

export function useShaderConfig() {
  return useContext(ShaderConfigContext);
}
