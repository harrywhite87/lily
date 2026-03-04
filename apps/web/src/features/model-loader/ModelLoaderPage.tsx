import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { DebugOverlay, useDebugControls, AssetsPlugin } from '@lilypad/debug';
import { useAssetRegistry } from '@lilypad/three-assets';
import { useNavigate } from 'react-router-dom';
import { useModel, DEFAULT_MODEL } from './ModelContext';
import { ModelInspector } from './ModelInspector';
import { useModelUpload } from './useModelUpload';
import { PageLayout } from '../layout/PageLayout';
import styles from './ModelLoaderPage.module.scss';

/** Loads a GLTF and exposes a cloned scene for rendering + inspection. */
function useClonedScene(url: string) {
  const { scene } = useGLTF(url);
  return useMemo(() => scene.clone(), [scene]);
}

export function ModelLoaderPage() {
  const { modelUrl, setModelUrl, resetModel } = useModel();
  const navigate = useNavigate();
  const manager = useAssetRegistry();

  const {
    previewUrl,
    fileName,
    dragOver,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleReset,
  } = useModelUpload(resetModel);

  const isCustom = modelUrl !== DEFAULT_MODEL;
  const displayUrl = previewUrl ?? modelUrl;
  const displayName = fileName ?? (isCustom ? 'Custom model' : 'submarine.glb');

  // Viewport controls
  const viewport = useDebugControls('Viewport', {
    autoRotate: { value: false, label: 'Auto Spin' },
    autoRotateSpeed: { value: 1.5, min: 0.1, max: 10, step: 0.1, label: 'Spin Speed' },
  });

  // Model actions
  useDebugControls('Model', {
    'Upload .glb': { type: 'button', label: 'Upload .glb', onClick: () => fileInputRef.current?.click() },
    ...(previewUrl
      ? {
          'Use in Demo': {
            type: 'button' as const,
            label: 'Use in Demo',
            onClick: () => {
              setModelUrl(previewUrl);
              navigate('/');
            },
          },
        }
      : {}),
    ...((previewUrl || isCustom)
      ? { 'Reset to Sub': { type: 'button' as const, label: 'Reset to Sub', onClick: handleReset } }
      : {}),
  }, [previewUrl, isCustom, handleReset]);

  return (
    <PageLayout
      background="var(--color-deep-navy)"
      className={dragOver ? styles.dragOver : ''}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && <div className={styles.dropHint}>Drop .glb here</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

      <Canvas
        camera={{ position: [0.94, 0.81, -1.35], fov: 50, near: 0.10, far: 1000 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0f2240']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} />
        <directionalLight position={[-3, 4, -5]} intensity={0.3} />
        <SceneWithInspector url={displayUrl} label={displayName} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={viewport.autoRotate as boolean}
          autoRotateSpeed={viewport.autoRotateSpeed as number}
        />
        <DebugOverlay plugins={[AssetsPlugin(manager)]} />
      </Canvas>
    </PageLayout>
  );
}

/**
 * Inner R3F component that loads the model, renders it, and attaches the
 * ModelInspector debug layer. Needs to live inside <Canvas>.
 */
function SceneWithInspector({ url, label }: { url: string; label: string }) {
  const cloned = useClonedScene(url);

  return (
    <>
      <primitive object={cloned} />
      <ModelInspector object={cloned} label={label} />
    </>
  );
}
