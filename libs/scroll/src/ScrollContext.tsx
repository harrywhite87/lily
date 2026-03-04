import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { sectionProgress } from '@lilypad/shared';

/**
 * Segment layout (5 sections, 4 transitions):
 *
 *   s01 (0.00–0.20): Section 0→1  Schematic assembly (new)
 *   a   (0.20–0.40): Section 1→2  Horizontal transition
 *   b   (0.40–0.60): Section 2→3  Horizontal transition
 *   c   (0.60–0.80): Section 3→4  Horizontal transition
 *   d   (0.80–1.00): Section 4→5  Vertical transition
 */

export interface ScrollProgressState {
  /** Global progress p ∈ [0, 1] */
  progress: number;
  /** s01: Schematic-to-assembly transition (Section 0→1) */
  s01: number;
  /** Section 1→2 horizontal transition */
  a: number;
  /** Section 2→3 horizontal transition */
  b: number;
  /** Section 3→4 horizontal transition */
  c: number;
  /** Section 4→5 vertical transition */
  d: number;
}

interface ScrollContextValue extends ScrollProgressState {
  setProgress: (p: number) => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    s01: 0,
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  });

  const setProgress = useCallback((p: number) => {
    setState({
      progress: p,
      s01: sectionProgress(p, 0.0, 0.2),
      a: sectionProgress(p, 0.2, 0.4),
      b: sectionProgress(p, 0.4, 0.6),
      c: sectionProgress(p, 0.6, 0.8),
      d: sectionProgress(p, 0.8, 1.0),
    });
  }, []);

  return (
    <ScrollContext.Provider value={{ ...state, setProgress }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollProgress(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error('useScrollProgress must be used within a ScrollProvider');
  }
  return ctx;
}
