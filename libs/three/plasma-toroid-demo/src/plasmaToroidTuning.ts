export interface PlasmaToroidWaveChannel {
  amplitude: number;
  thetaFrequency: number;
  phiFrequency: number;
  speed: number;
}

export interface PlasmaToroidVector3 {
  x: number;
  y: number;
  z: number;
}

export type PlasmaToroidDirectionMode = 'forward' | 'reverse' | 'mixed';

export interface PlasmaToroidTuning {
  particleCount: number;
  geometry: {
    majorRadius: number;
    minorRadius: number;
    haloSpread: number;
  };
  orbit: {
    aroundRingSpeed: number;
    aroundTubeSpeed: number;
    aroundRingDirection: PlasmaToroidDirectionMode;
  };
  flow: {
    thetaDrift: PlasmaToroidWaveChannel;
    phiDrift: PlasmaToroidWaveChannel;
  };
  wobble: {
    ring: PlasmaToroidWaveChannel;
    radial: PlasmaToroidWaveChannel;
    binormal: PlasmaToroidWaveChannel;
    tangent: PlasmaToroidWaveChannel;
  };
  warp: {
    enabled: boolean;
    amount: PlasmaToroidVector3;
    thetaFrequency: number;
    phiFrequency: number;
    speed: number;
  };
  density: {
    base: number;
    layer1: PlasmaToroidWaveChannel;
    layer2: PlasmaToroidWaveChannel;
  };
  render: {
    pointSize: number;
    pointSizeVariance: number;
    alpha: number;
    softness: number;
  };
  camera: {
    autoRotate: boolean;
    autoRotateSpeed: number;
  };
}

export const DEFAULT_PLASMA_TOROID_TUNING: PlasmaToroidTuning = {
  particleCount: 40_000,
  geometry: {
    majorRadius: 1.4,
    minorRadius: 0.32,
    haloSpread: 0.08,
  },
  orbit: {
    aroundRingSpeed: 1.0,
    aroundTubeSpeed: 1.0,
    aroundRingDirection: 'forward',
  },
  flow: {
    thetaDrift: {
      amplitude: 0.08,
      thetaFrequency: 2.5,
      phiFrequency: 1.0,
      speed: 0.75,
    },
    phiDrift: {
      amplitude: 0.11,
      thetaFrequency: 3.5,
      phiFrequency: 2.0,
      speed: 0.9,
    },
  },
  wobble: {
    ring: {
      amplitude: 0.07,
      thetaFrequency: 3.0,
      phiFrequency: 0.5,
      speed: 0.45,
    },
    radial: {
      amplitude: 0.08,
      thetaFrequency: 4.0,
      phiFrequency: 3.0,
      speed: 0.6,
    },
    binormal: {
      amplitude: 0.06,
      thetaFrequency: 2.0,
      phiFrequency: 5.0,
      speed: 0.8,
    },
    tangent: {
      amplitude: 0.045,
      thetaFrequency: 6.0,
      phiFrequency: 4.0,
      speed: 1.2,
    },
  },
  warp: {
    enabled: true,
    amount: {
      x: 0.05,
      y: 0.03,
      z: 0.05,
    },
    thetaFrequency: 2.0,
    phiFrequency: 1.5,
    speed: 0.5,
  },
  density: {
    base: 0.58,
    layer1: {
      amplitude: 0.24,
      thetaFrequency: 3.0,
      phiFrequency: 2.0,
      speed: 0.6,
    },
    layer2: {
      amplitude: 0.16,
      thetaFrequency: 5.0,
      phiFrequency: 3.0,
      speed: 0.4,
    },
  },
  render: {
    pointSize: 6.0,
    pointSizeVariance: 0.45,
    alpha: 0.8,
    softness: 1.0,
  },
  camera: {
    autoRotate: true,
    autoRotateSpeed: 0.4,
  },
};
