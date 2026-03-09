import type { ComponentType } from 'react';

/* ───────────────────────── lazy imports ───────────────────────── */
// Using static imports keeps things simple; swap to React.lazy() later if needed.
import { ModelLoaderPage } from './features/model-loader/ModelLoaderPage';
import { CausticsPage } from './features/caustics-page/CausticsPage';
import { WaterPage } from './features/water-page/WaterPage';
import { BlueprintPage } from './features/blueprint-page/BlueprintPage';
import { BuildPage } from './features/build-page/BuildPage';
import { ParticlesPage } from './features/particles-page/ParticlesPage';
import { PathBuilderPage } from './features/path-builder/PathBuilderPage';
import { ShipyardPage } from './features/shipyard/ShipyardPage';
import { BattleboardPage } from './features/battleboard/BattleboardPage';
import { ParticleCloudDemoPage } from './features/particle-cloud-demo/ParticleCloudDemoPage';
import { SwarmDemoPage } from './features/swarm-demo/SwarmDemoPage';
import { FusionReactorDemoPage } from './features/fusion-reactor/FusionReactorDemoPage';

/* ───────────────────────── types ──────────────────────────────── */
export interface RouteEntry {
  /** URL path segment (must start with `/`) */
  path: string;
  /** Display label shown in the NavBar */
  label: string;
  /** Page component rendered by React-Router */
  component: ComponentType;
  /**
   * Set to `false` to hide this route from the NavBar while keeping
   * the route itself active. Set to `true` (default) to show it.
   */
  showInNav?: boolean;
  /**
   * Set to `false` to completely disable this route (removes it from
   * both the NavBar and the router). Defaults to `true`.
   */
  enabled?: boolean;
}

/* ───────────────────────── route definitions ──────────────────── */
/**
 * Single source of truth for every page in the app.
 *
 * To **hide** a page from the nav but keep the URL working:
 *   → set `showInNav: false`
 *
 * To **disable** a page entirely (nav + route):
 *   → set `enabled: false`
 */
export const routes: RouteEntry[] = [
  { path: '/model-loader',     label: 'Model',       component: ModelLoaderPage },
  { path: '/caustics',         label: 'Caustics',    component: CausticsPage },
  { path: '/water',            label: 'Water',       component: WaterPage },
  { path: '/blueprint',        label: 'Blueprint',   component: BlueprintPage },
  { path: '/build',            label: 'Build',       component: BuildPage },
  { path: '/particles',        label: 'Particles',   component: ParticlesPage },
  { path: '/path-builder',     label: 'Path',        component: PathBuilderPage },
  { path: '/shipyard',         label: 'Shipyard',    component: ShipyardPage },
  { path: '/battleboard',      label: 'Battleboard', component: BattleboardPage },
  { path: '/particle-clouds',  label: 'Clouds',      component: ParticleCloudDemoPage },
  { path: '/swarm',            label: 'Swarm',       component: SwarmDemoPage },
  { path: '/fusion-reactor',   label: 'Reactor',     component: FusionReactorDemoPage },
];

/* ───────────────────────── helpers ────────────────────────────── */
/** Routes that are enabled (or not explicitly disabled). */
export const enabledRoutes = () =>
  routes.filter((r) => r.enabled !== false);

/** Routes that should appear in the NavBar. */
export const navRoutes = () =>
  enabledRoutes().filter((r) => r.showInNav !== false);
