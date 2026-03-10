import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AssetRegistryProvider } from '@lilypad/three-assets';
import { ModelProvider } from './features/model-loader/ModelContext';
import { ShaderConfigProvider } from './features/config/ShaderConfigContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { PasswordGate } from './features/auth/PasswordGate';
import { App } from './App';
import './global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <PasswordGate> */}
      <ThemeProvider>
        <HashRouter>
          <AssetRegistryProvider>
            <ModelProvider>
              <ShaderConfigProvider>
                <App />
              </ShaderConfigProvider>
            </ModelProvider>
          </AssetRegistryProvider>
        </HashRouter>
      </ThemeProvider>
    {/* </PasswordGate> */}
  </StrictMode>
);
