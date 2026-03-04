/// <reference types="vite/client" />

// Pull in React Three Fiber's JSX type augmentations
// This makes <mesh>, <ambientLight>, <group>, etc. valid JSX elements
import type {} from '@react-three/fiber';

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.vert' {
  const src: string;
  export default src;
}

declare module '*.frag' {
  const src: string;
  export default src;
}
