import { useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useScrollProgress } from './ScrollContext';
import { clamp } from '@lilypad/shared';

interface ScrollContainerProps {
  children: ReactNode;
  /** Total virtual scroll height multiplier (how many viewports of scroll range). Default: 5 */
  scrollMultiplier?: number;
}

/**
 * Custom scroll container that captures wheel events and computes
 * normalized progress p ∈ [0, 1]. This replaces native page scroll
 * so we have full control over the scroll-to-progress mapping.
 */
export function ScrollContainer({
  children,
  scrollMultiplier = 5,
}: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollY = useRef(0);
  const { setProgress } = useScrollProgress();

  const totalHeight = typeof window !== 'undefined' ? window.innerHeight * scrollMultiplier : 1;

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      scrollY.current = clamp(scrollY.current + e.deltaY, 0, totalHeight);
      const p = scrollY.current / totalHeight;
      setProgress(p);
    },
    [totalHeight, setProgress],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  );
}
