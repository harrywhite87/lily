/// <reference types="vite/client" />
import { createContext, useContext, useState, type ReactNode } from 'react';

interface ModelContextValue {
  modelUrl: string;
  setModelUrl: (url: string) => void;
  resetModel: () => void;
}

const DEFAULT_MODEL = `${import.meta.env.BASE_URL}submarine.glb`;

const ModelContext = createContext<ModelContextValue>({
  modelUrl: DEFAULT_MODEL,
  setModelUrl: () => {},
  resetModel: () => {},
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL);

  const resetModel = () => setModelUrl(DEFAULT_MODEL);

  return (
    <ModelContext.Provider value={{ modelUrl, setModelUrl, resetModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  return useContext(ModelContext);
}

export { DEFAULT_MODEL };
