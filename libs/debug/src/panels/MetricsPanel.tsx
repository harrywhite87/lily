import { useCallback, useMemo } from 'react';
import { useDebugStore } from '../core/store';
import type { CameraState } from '../r3f/types';
import styles from './MetricsPanel.module.scss';

/* ─── Row ─── */

function Row(props: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{props.label}</span>
      <span className={styles.rowValue}>
        {props.value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className={styles.divider} />;
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
      className={styles.copyBtn}
    >
      Copy Camera Config
    </button>
  );
}

/* ─── MetricsPanel ─── */

export function MetricsPanel() {
  const m = useDebugStore((s) => s.metrics);
  const cam = m.camera;

  return (
    <div className={styles.grid}>
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
      <div className={styles.sectionHeading}>
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
