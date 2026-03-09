import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { AssetManager, LoadedAsset } from '@lilypad/three-assets';

/* ─── helpers ─── */

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();

    const material = mesh.material as
      | THREE.Material
      | THREE.Material[]
      | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose?.();
  });
}

/* ─── DebugSceneHelper ─── */

/**
 * Scene-specific helpers that augment the shared AssetManager for
 * debug overlay workflows (spawning into scene, clearing, etc.).
 *
 * These are NOT part of the shared asset library — they are
 * debug-only concerns that stay in `libs/debug`.
 */
export class DebugSceneHelper {
  constructor(private manager: AssetManager) {}

  ensureDebugRoot(scene: THREE.Scene): THREE.Group {
    const existing = scene.getObjectByName('__debug_assets_root__');
    if (existing && existing instanceof THREE.Group) return existing;

    const root = new THREE.Group();
    root.name = '__debug_assets_root__';
    scene.add(root);
    return root;
  }

  async spawnIntoScene(
    scene: THREE.Scene,
    id: string,
  ): Promise<THREE.Object3D> {
    const loaded: LoadedAsset = await this.manager.load(id);
    const root = this.ensureDebugRoot(scene);

    let obj: THREE.Object3D;

    if (loaded.kind === 'primitive') {
      obj = loaded.create();
    } else if (loaded.kind === 'model') {
      obj = SkeletonUtils.clone(loaded.scene);
    } else if (loaded.kind === 'material') {
      // Spawn a preview sphere with the material applied
      const geom = new THREE.SphereGeometry(0.5, 32, 16);
      const mat = loaded.material.clone();
      obj = new THREE.Mesh(geom, mat);
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.name = `material-preview:${loaded.material.name}`;
    } else if (loaded.kind === 'texture') {
      // texture → spawn as preview plane
      const geom = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshStandardMaterial({ map: loaded.texture });
      obj = new THREE.Mesh(geom, mat);
      obj.name = 'texture-plane';
    } else {
      // geometry
      const geom = loaded.geometry;
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      obj = new THREE.Mesh(geom, mat);
      obj.name = 'geometry-preview';
    }

    obj.userData.__debugAssetId = id;
    obj.position.set(0, 0.5, 0);
    root.add(obj);
    return obj;
  }

  clearSpawned(scene: THREE.Scene): void {
    const root = scene.getObjectByName('__debug_assets_root__');
    if (!root) return;

    const children = [...root.children];
    for (const c of children) {
      root.remove(c);
      disposeObject3D(c);
    }
  }
}
