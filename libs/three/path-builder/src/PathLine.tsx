import { Line } from '@react-three/drei';
import type { PathPoint } from './usePathBuilder';

export interface PathLineProps {
  points: PathPoint[];
}

export function PathLine({ points }: PathLineProps) {
  if (points.length < 2) {
    return null;
  }

  return (
    <Line
      points={points}
      color="#00e5ff"
      lineWidth={2}
      opacity={0.8}
      transparent
    />
  );
}
