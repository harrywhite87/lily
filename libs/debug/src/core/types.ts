/* ─── Plugin system ─── */

export interface DebugPanelRegistration {
  id: string;
  title: string;
  order?: number;
  render: React.ComponentType;
}

export interface DebugCommand {
  id: string;
  title: string;
  run: () => void;
}

export interface DebugPlugin {
  id: string;
  title?: string;
  panels: DebugPanelRegistration[];
  commands?: DebugCommand[];
}
