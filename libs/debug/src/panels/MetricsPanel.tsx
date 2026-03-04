import { useCallback, useMemo } from 'react';
import { useDebugStore } from '../core/store';
import type { CameraState } from '../r3f/types';

/* ─── Row ─── */

function Row(props: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.7, fontSize: 11 }}>{props.label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {props.value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        margin: '2px 0',
      }}
    />
  );
}

/* ─── Camera section ─── */

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function Vec3Row(props: { label: string; v: [number, number, number] }) {
  return (
    <Row
      label={props.label}
      value={`${fmt(props.v[0])}, ${fmt(props.v[1])}, ${fmt(props.v[2])}`}
    />
  );
}

function formatCameraConfig(cam: CameraState): string {
  const lines: string[] = [
    `camera={{`,
    `  position: [${fmt(cam.position[0])}, ${fmt(cam.position[1])}, ${fmt(cam.position[2])}],`,
    `  fov: ${fmt(cam.fov, 0)},`,
    `  near: ${fmt(cam.near)},`,
    `  far: ${fmt(cam.far, 0)},`,
    `}}`,
  ];
  if (cam.target) {
    lines.push(
      `// OrbitControls target:`,
      `target={[${fmt(cam.target[0])}, ${fmt(cam.target[1])}, ${fmt(cam.target[2])}]}`,
    );
  }
  return lines.join('\n');
}

function CopyButton({ cam }: { cam: CameraState }) {
  const handleCopy = useCallback(() => {
    const text = formatCameraConfig(cam);
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback: log to console
      // eslint-disable-next-line no-console
      console.log('[Camera Config]\n' + text);
    });
  }, [cam]);

  return (
    <button
      onClick={handleCopy}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'block',
        width: '100%',
        padding: '4px 8px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.07)',
        fontSize: 11,
        textAlign: 'center',
        opacity: 0.85,
        transition: 'background 120ms ease, opacity 120ms ease',
        marginTop: 4,
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
        (e.target as HTMLElement).style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
        (e.target as HTMLElement).style.opacity = '0.85';
      }}
    >
      📋 Copy Camera Config
    </button>
  );
}

/* ─── MetricsPanel ─── */

export function MetricsPanel() {
  const m = useDebugStore((s) => s.metrics);
  const cam = m.camera;

  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <Row label="FPS" value={m.fps.toFixed(1)} />
      <Row label="Frame (ms)" value={m.frameMs.toFixed(2)} />
      <Divider />
      <Row label="Draw calls" value={m.drawCalls} />
      <Row label="Triangles" value={m.triangles.toLocaleString()} />
      <Row label="Lines" value={m.lines} />
      <Row label="Points" value={m.points} />
      <Divider />
      <Row label="Geometries" value={m.geometries} />
      <Row label="Textures" value={m.textures} />
      <Divider />
      <div style={{ opacity: 0.55, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
        Camera
      </div>
      <Vec3Row label="Position" v={cam.position} />
      <Vec3Row label="Rotation °" v={cam.rotation} />
      <Row label="FOV" value={fmt(cam.fov, 0)} />
      {cam.target && <Vec3Row label="Target" v={cam.target} />}
      <CopyButton cam={cam} />
    </div>
  );
}
