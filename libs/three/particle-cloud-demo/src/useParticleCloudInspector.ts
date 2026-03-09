import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useObjectInspectorSurface } from '@lilypad/debug';
import {
  createParticleCloudInspectorSurface,
  type ParticleCloudTuning,
} from '@lilypad/three-particles';

export function useParticleCloudInspector(
  title: string,
  initial: ParticleCloudTuning,
) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const [tuning, setTuning] = useState<ParticleCloudTuning>(initial);
  const tuningRef = useRef(tuning);

  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  const surface = useMemo(
    () =>
      createParticleCloudInspectorSurface({
        title,
        get: () => tuningRef.current,
        set: (patch) =>
          setTuning((previous) => ({
            ...previous,
            ...patch,
          })),
      }),
    [title],
  );

  useObjectInspectorSurface(pointsRef, surface);

  return { pointsRef, tuning };
}
