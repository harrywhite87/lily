import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {
  AssetRecord,
  LoadedAsset,
  PrimitiveType,
  PrimitiveAssetRecord,
  MaterialTextures,
} from './types';
import { EMPTY_TEXTURES } from './types';
import { useAssetStore } from './store';

/* ─── helpers ─── */

function createPrimitiveObject(type: PrimitiveType): THREE.Object3D {
  const geom =
    type === 'box'
      ? new THREE.BoxGeometry(1, 1, 1)
      : type === 'sphere'
        ? new THREE.SphereGeometry(0.5, 32, 16)
        : type === 'plane'
          ? new THREE.PlaneGeometry(1, 1, 1, 1)
          : type === 'torus'
            ? new THREE.TorusGeometry(0.5, 0.2, 16, 64)
            : type === 'cylinder'
              ? new THREE.CylinderGeometry(0.5, 0.5, 1, 24)
              : new THREE.ConeGeometry(0.5, 1, 24);

  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  group.name = `primitive:${type}`;
  return group;
}

/* ─── AssetManager ─── */

export class AssetManager {
  private loaded = new Map<string, LoadedAsset>();
  private refs = new Map<string, number>();
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();

  /** Cached GLB scenes keyed by URL — prevents re-downloading the same file */
  private glbCache = new Map<string, Promise<THREE.Group>>();

  /** Cached per-material textures keyed by material name */
  private materialTextureCache = new Map<string, MaterialTextures>();

  /* ── register built-in primitives ── */

  registerBuiltins(): void {
    const { upsert } = useAssetStore.getState();

    const primitives: Array<{ primitive: PrimitiveType; name: string }> = [
      { primitive: 'box', name: 'Box' },
      { primitive: 'sphere', name: 'Sphere' },
      { primitive: 'plane', name: 'Plane' },
      { primitive: 'torus', name: 'Torus' },
      { primitive: 'cylinder', name: 'Cylinder' },
      { primitive: 'cone', name: 'Cone' },
    ];

    for (const p of primitives) {
      upsert({
        id: `builtin:${p.primitive}`,
        name: p.name,
        kind: 'primitive',
        primitive: p.primitive,
        source: { kind: 'builtin' },
        createdAt: Date.now(),
      });
    }
  }

  /* ── load a GLB and cache the result ── */

  private loadGLB(url: string): Promise<THREE.Group> {
    const cached = this.glbCache.get(url);
    if (cached) return cached;

    const promise = this.gltfLoader.loadAsync(url).then((gltf) => gltf.scene);
    this.glbCache.set(url, promise);
    return promise;
  }

  /* ── extract materials from a GLB (ignoring meshes) ── */

  async registerMaterialsFromGLB(url: string): Promise<string[]> {
    const { upsert } = useAssetStore.getState();
    const scene = await this.loadGLB(url);

    const seen = new Map<string, THREE.Material>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of mats) {
        const key = m.name || m.uuid;
        if (!seen.has(key)) seen.set(key, m);
      }
    });

    const ids: string[] = [];
    for (const [, mat] of seen) {
      const id = `builtin:material:${mat.name || mat.uuid}`;
      ids.push(id);

      // Cache the loaded material directly
      this.loaded.set(id, { kind: 'material', material: mat });

      // Cache per-material textures for fast lookup
      if (mat instanceof THREE.MeshStandardMaterial) {
        this.cacheMaterialTextures(mat);
      }

      upsert({
        id,
        name: mat.name || '(unnamed)',
        kind: 'material',
        materialType: mat.type,
        source: { kind: 'builtin' },
        createdAt: Date.now(),
      });
    }

    return ids;
  }

  /* ── cache textures from a standard material ── */

  private cacheMaterialTextures(mat: THREE.MeshStandardMaterial): void {
    const configureTex = (
      tex: THREE.Texture | null,
      srgb: boolean,
    ): THREE.Texture | null => {
      if (!tex) return null;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = srgb
        ? THREE.SRGBColorSpace
        : THREE.LinearSRGBColorSpace;
      return tex;
    };

    this.materialTextureCache.set(mat.name, {
      map: configureTex(mat.map, true),
      normalMap: configureTex(mat.normalMap, false),
      roughnessMap: configureTex(mat.roughnessMap, false),
      metalnessMap: configureTex(mat.metalnessMap, false),
    });
  }

  /* ── get textures for a specific named material ── */

  async loadMaterialTextures(materialName: string): Promise<MaterialTextures> {
    // Check cache first
    const cached = this.materialTextureCache.get(materialName);
    if (cached) return cached;

    // If the GLB hasn't been loaded yet, try the default materials path
    const base =
      typeof import.meta !== 'undefined'
        ? (import.meta.env?.BASE_URL ?? '/')
        : '/';
    await this.registerMaterialsFromGLB(`${base}assets/materials.glb`);

    return this.materialTextureCache.get(materialName) ?? EMPTY_TEXTURES;
  }

  /* ── register a user-uploaded file ── */

  registerFile(file: File): string {
    const { upsert } = useAssetStore.getState();

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isModel = ext === 'glb' || ext === 'gltf';
    const isTexture = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);

    if (!isModel && !isTexture) {
      throw new Error(`Unsupported file type: .${ext}`);
    }

    const id = `file:${crypto.randomUUID()}`;
    const objectUrl = URL.createObjectURL(file);

    if (isModel) {
      upsert({
        id,
        name: file.name,
        kind: 'model',
        source: { kind: 'file', file, objectUrl },
        formatHint: ext as 'glb' | 'gltf',
        createdAt: Date.now(),
      });
    } else {
      upsert({
        id,
        name: file.name,
        kind: 'texture',
        source: { kind: 'file', file, objectUrl },
        createdAt: Date.now(),
      });
    }

    return id;
  }

  /* ── unregister (removes from store + cache, revokes object URLs) ── */

  unregister(id: string): void {
    const state = useAssetStore.getState();
    const record = state.assets.find((a) => a.id === id);
    if (record?.source.kind === 'file') {
      URL.revokeObjectURL(record.source.objectUrl);
    }

    this.loaded.delete(id);
    this.refs.delete(id);
    state.remove(id);
  }

  /* ── ref counting ── */

  retain(id: string): void {
    this.refs.set(id, (this.refs.get(id) ?? 0) + 1);
  }

  release(id: string): void {
    const count = (this.refs.get(id) ?? 0) - 1;
    if (count <= 0) {
      this.refs.delete(id);
      // Optionally dispose if no references remain
    } else {
      this.refs.set(id, count);
    }
  }

  /* ── load on demand (lazy, cached) ── */

  async load(id: string): Promise<LoadedAsset> {
    const cached = this.loaded.get(id);
    if (cached) return cached;

    const record = useAssetStore.getState().assets.find((a) => a.id === id);
    if (!record) throw new Error(`Asset not found: ${id}`);

    const url =
      record.source.kind === 'url'
        ? record.source.url
        : record.source.kind === 'file'
          ? record.source.objectUrl
          : null;

    let loaded: LoadedAsset;

    if (record.kind === 'primitive') {
      loaded = {
        kind: 'primitive',
        create: () =>
          createPrimitiveObject((record as PrimitiveAssetRecord).primitive),
      };
    } else if (record.kind === 'texture') {
      if (!url) throw new Error('Texture asset missing URL');
      const texture = await this.textureLoader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      loaded = { kind: 'texture', texture };
    } else if (record.kind === 'material') {
      // Materials are pre-cached during registerMaterialsFromGLB;
      // if somehow we get here without cache, create a fallback
      loaded = {
        kind: 'material',
        material: new THREE.MeshStandardMaterial({ color: 0xcccccc }),
      };
    } else {
      // model
      if (!url) throw new Error('Model asset missing URL');
      const gltf = await this.gltfLoader.loadAsync(url);
      loaded = { kind: 'model', scene: gltf.scene };
    }

    this.loaded.set(id, loaded);
    return loaded;
  }

  /* ── query ── */

  list(filter?: { kind?: AssetRecord['kind']; tags?: string[] }): AssetRecord[] {
    const all = useAssetStore.getState().assets;
    if (!filter) return all;

    return all.filter((a) => {
      if (filter.kind && a.kind !== filter.kind) return false;
      if (filter.tags && !filter.tags.every((t) => a.tags?.includes(t)))
        return false;
      return true;
    });
  }
}
