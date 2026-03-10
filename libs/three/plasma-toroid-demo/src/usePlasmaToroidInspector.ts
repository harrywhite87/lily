import { useCallback, useRef } from 'react';
import { useDebugControls } from '@lilypad/debug';
import type { FlatValues, FolderControl } from '@lilypad/debug';
import type { PlasmaToroidTuning, PlasmaToroidWaveChannel } from './plasmaToroidTuning';
import { DEFAULT_PLASMA_TOROID_TUNING } from './plasmaToroidTuning';

export type { PlasmaToroidTuning } from './plasmaToroidTuning';
export { DEFAULT_PLASMA_TOROID_TUNING } from './plasmaToroidTuning';

export interface PlasmaToroidInspectorActions {
  setFrontView?: () => void;
  setSideView?: () => void;
  setAxisView?: () => void;
  setIsometricView?: () => void;
}

export function usePlasmaToroidInspector(
  initial: PlasmaToroidTuning = DEFAULT_PLASMA_TOROID_TUNING,
  actions: PlasmaToroidInspectorActions = {},
): PlasmaToroidTuning {
  const setValuesRef = useRef<(values: Partial<FlatValues>) => void>(() => undefined);

  const applyViewPreset = useCallback((apply?: () => void) => {
    apply?.();
    setValuesRef.current({ cam_autoRotate: false });
  }, []);

  const resetTuning = useCallback(() => {
    setValuesRef.current(tuningToControlValues(initial));
  }, [initial]);

  const [values, setValues] = useDebugControls(
    'Plasma Toroid',
    () => ({
      Geometry: {
        type: 'folder' as const,
        title: 'Geometry',
        controls: {
          geo_particleCount: numberControl(initial.particleCount, 5_000, 120_000, 5_000, 'Particles'),
          geo_majorRadius: numberControl(initial.geometry.majorRadius, 0.5, 4.0, 0.05, 'Major Radius'),
          geo_minorRadius: numberControl(initial.geometry.minorRadius, 0.05, 1.5, 0.01, 'Minor Radius'),
          geo_haloSpread: numberControl(initial.geometry.haloSpread, 0, 0.35, 0.005, 'Halo Spread'),
        },
      } satisfies FolderControl,
      Orbit: {
        type: 'folder' as const,
        title: 'Orbit',
        controls: {
          orbit_theta_direction: {
            type: 'select' as const,
            value: initial.orbit.aroundRingDirection,
            options: ['forward', 'reverse', 'mixed'],
            label: 'Ring Direction',
          },
          orbit_theta_speed: numberControl(initial.orbit.aroundRingSpeed, 0, 4, 0.05, 'Around Ring Speed'),
          orbit_phi_speed: numberControl(initial.orbit.aroundTubeSpeed, 0, 4, 0.05, 'Around Tube Speed'),
        },
      } satisfies FolderControl,
      Flow: {
        type: 'folder' as const,
        title: 'Flow',
        controls: {
          flow_theta_amp: numberControl(initial.flow.thetaDrift.amplitude, 0, 0.3, 0.005, 'Theta Amp'),
          flow_theta_freq_theta: numberControl(initial.flow.thetaDrift.thetaFrequency, 0, 10, 0.1, 'Theta Freq T'),
          flow_theta_freq_phi: numberControl(initial.flow.thetaDrift.phiFrequency, 0, 10, 0.1, 'Theta Freq P'),
          flow_theta_speed: numberControl(initial.flow.thetaDrift.speed, 0, 3, 0.05, 'Theta Speed'),
          flow_phi_amp: numberControl(initial.flow.phiDrift.amplitude, 0, 0.3, 0.005, 'Phi Amp'),
          flow_phi_freq_theta: numberControl(initial.flow.phiDrift.thetaFrequency, 0, 10, 0.1, 'Phi Freq T'),
          flow_phi_freq_phi: numberControl(initial.flow.phiDrift.phiFrequency, 0, 10, 0.1, 'Phi Freq P'),
          flow_phi_speed: numberControl(initial.flow.phiDrift.speed, 0, 3, 0.05, 'Phi Speed'),
        },
      } satisfies FolderControl,
      Wobble: {
        type: 'folder' as const,
        title: 'Wobble Local',
        controls: {
          'Ring Radius': waveFolder('Ring Radius', 'wobble_ring', initial.wobble.ring, 0.25),
          Radial: waveFolder('Radial', 'wobble_radial', initial.wobble.radial, 0.35),
          Binormal: waveFolder('Binormal', 'wobble_binormal', initial.wobble.binormal, 0.35),
          Tangent: waveFolder('Tangent', 'wobble_tangent', initial.wobble.tangent, 0.25),
        },
      } satisfies FolderControl,
      Warp: {
        type: 'folder' as const,
        title: 'Warp XYZ',
        controls: {
          warp_enabled: { value: initial.warp.enabled, label: 'Enabled' },
          warp_amp_x: numberControl(initial.warp.amount.x, 0, 0.3, 0.005, 'X Amp'),
          warp_amp_y: numberControl(initial.warp.amount.y, 0, 0.3, 0.005, 'Y Amp'),
          warp_amp_z: numberControl(initial.warp.amount.z, 0, 0.3, 0.005, 'Z Amp'),
          warp_freq_theta: numberControl(initial.warp.thetaFrequency, 0, 8, 0.1, 'Freq T'),
          warp_freq_phi: numberControl(initial.warp.phiFrequency, 0, 8, 0.1, 'Freq P'),
          warp_speed: numberControl(initial.warp.speed, 0, 3, 0.05, 'Speed'),
        },
      } satisfies FolderControl,
      Density: {
        type: 'folder' as const,
        title: 'Density',
        controls: {
          density_base: numberControl(initial.density.base, 0.05, 1, 0.01, 'Base'),
          'Layer One': waveFolder('Layer One', 'density_layer1', initial.density.layer1, 0.5),
          'Layer Two': waveFolder('Layer Two', 'density_layer2', initial.density.layer2, 0.5),
        },
      } satisfies FolderControl,
      Render: {
        type: 'folder' as const,
        title: 'Render',
        controls: {
          render_pointSize: numberControl(initial.render.pointSize, 1, 20, 0.5, 'Point Size'),
          render_pointVariance: numberControl(initial.render.pointSizeVariance, 0, 1, 0.05, 'Size Variance'),
          render_alpha: numberControl(initial.render.alpha, 0.05, 1, 0.05, 'Alpha'),
          render_softness: numberControl(initial.render.softness, 0.1, 2, 0.05, 'Softness'),
        },
      } satisfies FolderControl,
      Camera: {
        type: 'folder' as const,
        title: 'Camera',
        controls: {
          cam_autoRotate: { value: initial.camera.autoRotate, label: 'Auto Rotate' },
          cam_autoRotateSpeed: numberControl(initial.camera.autoRotateSpeed, 0, 3, 0.1, 'Rotate Speed'),
          Views: {
            type: 'folder' as const,
            title: 'Views',
            controls: {
              cam_view_front: {
                type: 'button' as const,
                label: 'Front',
                onClick: () => applyViewPreset(actions.setFrontView),
              },
              cam_view_side: {
                type: 'button' as const,
                label: 'Side',
                onClick: () => applyViewPreset(actions.setSideView),
              },
              cam_view_axis: {
                type: 'button' as const,
                label: 'Axis',
                onClick: () => applyViewPreset(actions.setAxisView),
              },
              cam_view_isometric: {
                type: 'button' as const,
                label: 'Isometric',
                onClick: () => applyViewPreset(actions.setIsometricView),
              },
            },
          } satisfies FolderControl,
        },
      } satisfies FolderControl,
      Presets: {
        type: 'folder' as const,
        title: 'Presets',
        controls: {
          preset_reset: {
            type: 'button' as const,
            label: 'Reset Tuning',
            onClick: resetTuning,
          },
        },
      } satisfies FolderControl,
    }),
    [
      actions.setAxisView,
      actions.setFrontView,
      actions.setIsometricView,
      actions.setSideView,
      applyViewPreset,
      initial,
      resetTuning,
    ],
  );

  setValuesRef.current = setValues;
  return valuesToTuning(values);
}

function numberControl(
  value: number,
  min: number,
  max: number,
  step: number,
  label: string,
) {
  return { value, min, max, step, label };
}

function waveFolder(
  title: string,
  prefix: string,
  initial: PlasmaToroidWaveChannel,
  maxAmplitude: number,
): FolderControl {
  return {
    type: 'folder',
    title,
    controls: {
      [`${prefix}_amp`]: numberControl(initial.amplitude, 0, maxAmplitude, 0.005, 'Amplitude'),
      [`${prefix}_freq_theta`]: numberControl(initial.thetaFrequency, 0, 10, 0.1, 'Freq T'),
      [`${prefix}_freq_phi`]: numberControl(initial.phiFrequency, 0, 10, 0.1, 'Freq P'),
      [`${prefix}_speed`]: numberControl(initial.speed, 0, 3, 0.05, 'Speed'),
    },
  };
}

function tuningToControlValues(tuning: PlasmaToroidTuning): Partial<FlatValues> {
  return {
    geo_particleCount: tuning.particleCount,
    geo_majorRadius: tuning.geometry.majorRadius,
    geo_minorRadius: tuning.geometry.minorRadius,
    geo_haloSpread: tuning.geometry.haloSpread,
    orbit_theta_direction: tuning.orbit.aroundRingDirection,
    orbit_theta_speed: tuning.orbit.aroundRingSpeed,
    orbit_phi_speed: tuning.orbit.aroundTubeSpeed,
    flow_theta_amp: tuning.flow.thetaDrift.amplitude,
    flow_theta_freq_theta: tuning.flow.thetaDrift.thetaFrequency,
    flow_theta_freq_phi: tuning.flow.thetaDrift.phiFrequency,
    flow_theta_speed: tuning.flow.thetaDrift.speed,
    flow_phi_amp: tuning.flow.phiDrift.amplitude,
    flow_phi_freq_theta: tuning.flow.phiDrift.thetaFrequency,
    flow_phi_freq_phi: tuning.flow.phiDrift.phiFrequency,
    flow_phi_speed: tuning.flow.phiDrift.speed,
    wobble_ring_amp: tuning.wobble.ring.amplitude,
    wobble_ring_freq_theta: tuning.wobble.ring.thetaFrequency,
    wobble_ring_freq_phi: tuning.wobble.ring.phiFrequency,
    wobble_ring_speed: tuning.wobble.ring.speed,
    wobble_radial_amp: tuning.wobble.radial.amplitude,
    wobble_radial_freq_theta: tuning.wobble.radial.thetaFrequency,
    wobble_radial_freq_phi: tuning.wobble.radial.phiFrequency,
    wobble_radial_speed: tuning.wobble.radial.speed,
    wobble_binormal_amp: tuning.wobble.binormal.amplitude,
    wobble_binormal_freq_theta: tuning.wobble.binormal.thetaFrequency,
    wobble_binormal_freq_phi: tuning.wobble.binormal.phiFrequency,
    wobble_binormal_speed: tuning.wobble.binormal.speed,
    wobble_tangent_amp: tuning.wobble.tangent.amplitude,
    wobble_tangent_freq_theta: tuning.wobble.tangent.thetaFrequency,
    wobble_tangent_freq_phi: tuning.wobble.tangent.phiFrequency,
    wobble_tangent_speed: tuning.wobble.tangent.speed,
    warp_enabled: tuning.warp.enabled,
    warp_amp_x: tuning.warp.amount.x,
    warp_amp_y: tuning.warp.amount.y,
    warp_amp_z: tuning.warp.amount.z,
    warp_freq_theta: tuning.warp.thetaFrequency,
    warp_freq_phi: tuning.warp.phiFrequency,
    warp_speed: tuning.warp.speed,
    density_base: tuning.density.base,
    density_layer1_amp: tuning.density.layer1.amplitude,
    density_layer1_freq_theta: tuning.density.layer1.thetaFrequency,
    density_layer1_freq_phi: tuning.density.layer1.phiFrequency,
    density_layer1_speed: tuning.density.layer1.speed,
    density_layer2_amp: tuning.density.layer2.amplitude,
    density_layer2_freq_theta: tuning.density.layer2.thetaFrequency,
    density_layer2_freq_phi: tuning.density.layer2.phiFrequency,
    density_layer2_speed: tuning.density.layer2.speed,
    render_pointSize: tuning.render.pointSize,
    render_pointVariance: tuning.render.pointSizeVariance,
    render_alpha: tuning.render.alpha,
    render_softness: tuning.render.softness,
    cam_autoRotate: tuning.camera.autoRotate,
    cam_autoRotateSpeed: tuning.camera.autoRotateSpeed,
  };
}

function value(v: FlatValues, key: string) {
  return v[key];
}

function valuesToTuning(v: FlatValues): PlasmaToroidTuning {
  return {
    particleCount: value(v, 'geo_particleCount') as number,
    geometry: {
      majorRadius: value(v, 'geo_majorRadius') as number,
      minorRadius: value(v, 'geo_minorRadius') as number,
      haloSpread: value(v, 'geo_haloSpread') as number,
    },
    orbit: {
      aroundRingDirection: value(v, 'orbit_theta_direction') as 'forward' | 'reverse' | 'mixed',
      aroundRingSpeed: value(v, 'orbit_theta_speed') as number,
      aroundTubeSpeed: value(v, 'orbit_phi_speed') as number,
    },
    flow: {
      thetaDrift: {
        amplitude: value(v, 'flow_theta_amp') as number,
        thetaFrequency: value(v, 'flow_theta_freq_theta') as number,
        phiFrequency: value(v, 'flow_theta_freq_phi') as number,
        speed: value(v, 'flow_theta_speed') as number,
      },
      phiDrift: {
        amplitude: value(v, 'flow_phi_amp') as number,
        thetaFrequency: value(v, 'flow_phi_freq_theta') as number,
        phiFrequency: value(v, 'flow_phi_freq_phi') as number,
        speed: value(v, 'flow_phi_speed') as number,
      },
    },
    wobble: {
      ring: {
        amplitude: value(v, 'wobble_ring_amp') as number,
        thetaFrequency: value(v, 'wobble_ring_freq_theta') as number,
        phiFrequency: value(v, 'wobble_ring_freq_phi') as number,
        speed: value(v, 'wobble_ring_speed') as number,
      },
      radial: {
        amplitude: value(v, 'wobble_radial_amp') as number,
        thetaFrequency: value(v, 'wobble_radial_freq_theta') as number,
        phiFrequency: value(v, 'wobble_radial_freq_phi') as number,
        speed: value(v, 'wobble_radial_speed') as number,
      },
      binormal: {
        amplitude: value(v, 'wobble_binormal_amp') as number,
        thetaFrequency: value(v, 'wobble_binormal_freq_theta') as number,
        phiFrequency: value(v, 'wobble_binormal_freq_phi') as number,
        speed: value(v, 'wobble_binormal_speed') as number,
      },
      tangent: {
        amplitude: value(v, 'wobble_tangent_amp') as number,
        thetaFrequency: value(v, 'wobble_tangent_freq_theta') as number,
        phiFrequency: value(v, 'wobble_tangent_freq_phi') as number,
        speed: value(v, 'wobble_tangent_speed') as number,
      },
    },
    warp: {
      enabled: value(v, 'warp_enabled') as boolean,
      amount: {
        x: value(v, 'warp_amp_x') as number,
        y: value(v, 'warp_amp_y') as number,
        z: value(v, 'warp_amp_z') as number,
      },
      thetaFrequency: value(v, 'warp_freq_theta') as number,
      phiFrequency: value(v, 'warp_freq_phi') as number,
      speed: value(v, 'warp_speed') as number,
    },
    density: {
      base: value(v, 'density_base') as number,
      layer1: {
        amplitude: value(v, 'density_layer1_amp') as number,
        thetaFrequency: value(v, 'density_layer1_freq_theta') as number,
        phiFrequency: value(v, 'density_layer1_freq_phi') as number,
        speed: value(v, 'density_layer1_speed') as number,
      },
      layer2: {
        amplitude: value(v, 'density_layer2_amp') as number,
        thetaFrequency: value(v, 'density_layer2_freq_theta') as number,
        phiFrequency: value(v, 'density_layer2_freq_phi') as number,
        speed: value(v, 'density_layer2_speed') as number,
      },
    },
    render: {
      pointSize: value(v, 'render_pointSize') as number,
      pointSizeVariance: value(v, 'render_pointVariance') as number,
      alpha: value(v, 'render_alpha') as number,
      softness: value(v, 'render_softness') as number,
    },
    camera: {
      autoRotate: value(v, 'cam_autoRotate') as boolean,
      autoRotateSpeed: value(v, 'cam_autoRotateSpeed') as number,
    },
  };
}
