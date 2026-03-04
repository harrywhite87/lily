import { useEffect } from 'react';
import { useDebugStore } from '../core/store';
import { useAssetStore, type AssetManager } from '@lilypad/three-assets';
import { DebugSceneHelper } from './DebugSceneHelper';
import styles from './AssetsPanel.module.scss';

let sceneHelper: DebugSceneHelper | null = null;

interface AssetsPanelProps {
  manager: AssetManager;
}

export function AssetsPanel({ manager }: AssetsPanelProps) {
  const scene = useDebugStore((s) => s.sceneRef);
  const assets = useAssetStore((s) => s.assets);

  // Lazily create the scene helper
  if (!sceneHelper) {
    sceneHelper = new DebugSceneHelper(manager);
  }

  // Register built-in primitives + materials once
  useEffect(() => {
    manager.registerBuiltins();
    const base = import.meta.env.BASE_URL ?? '/';
    manager.registerMaterialsFromGLB(`${base}assets/materials.glb`).catch((err) =>
      console.warn('[Assets] Could not load built-in materials:', err),
    );
  }, [manager]);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      try {
        manager.registerFile(f);
      } catch (err) {
        console.error(err);
      }
    }
    e.target.value = '';
  };

  return (
    <div>
      {/* ── toolbar ── */}
      <div className={styles.toolbar}>
        <label className={styles.uploadLabel}>
          Upload
          <input
            type="file"
            multiple
            accept=".glb,.gltf,.png,.jpg,.jpeg,.webp"
            onChange={onUpload}
            style={{ display: 'none' }}
          />
        </label>

        <button
          className={styles.toolBtn}
          onClick={() => scene && sceneHelper?.clearSpawned(scene)}
          disabled={!scene}
        >
          Clear spawned
        </button>
      </div>

      {/* ── asset list ── */}
      <div className={styles.list}>
        {assets.map((a) => (
          <div key={a.id} className={styles.card}>
            <div className={styles.cardInfo}>
              <div className={styles.cardName}>{a.name}</div>
              <div className={styles.cardKind}>{a.kind}</div>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.spawnBtn}
                onClick={() => scene && sceneHelper?.spawnIntoScene(scene, a.id)}
                disabled={!scene}
              >
                Spawn
              </button>

              {a.source.kind === 'file' && (
                <button
                  className={styles.removeBtn}
                  onClick={() => manager.unregister(a.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        {assets.length === 0 && (
          <div className={styles.empty}>No assets yet.</div>
        )}
      </div>
    </div>
  );
}
