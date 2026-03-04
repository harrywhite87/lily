import { useScrollProgress } from '@lilypad/scroll';
import { WaterSurfaceMdXyzX } from './WaterSurfaceMdXyzX';

export function SceneUsageExample() {
  const { c } = useScrollProgress();

  return <WaterSurfaceMdXyzX progressArea3={c} />;
}

