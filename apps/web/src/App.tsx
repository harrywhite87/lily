import { Routes, Route } from 'react-router-dom';
import { ScrollProvider, ScrollContainer, useScrollProgress } from '@lilypad/scroll';
import { Section0 } from './features/content/Section0';
import { Area1 } from './features/content/Area1';
import { Area2 } from './features/content/Area2';
import { Area3 } from './features/content/Area3';
import { Area4 } from './features/content/Area4';
import { SceneOverlay } from './features/scene/SceneOverlay';
import { NavBar } from './features/nav/NavBar';
import { enabledRoutes } from './router';
import styles from './App.module.scss';

export function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<ScrollDemo />} />
        {enabledRoutes().map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
      </Routes>
    </>
  );
}

/** The original scroll-driven demo, now rendered only on "/" */
function ScrollDemo() {
  return (
    <ScrollProvider>
      <ScrollContainer scrollMultiplier={8}>
        <ContentLayer />
      </ScrollContainer>
      <SceneOverlay />
    </ScrollProvider>
  );
}

/**
 * The DOM content layer positions the five sections with directional transitions:
 *
 *   s01 (p 0→0.2):  Section 0 → Section 1  HORIZONTAL  (schematic assembly)
 *   a   (p 0.2→0.4): Section 1 → Section 2  HORIZONTAL
 *   b   (p 0.4→0.6): Section 2 → Section 3  HORIZONTAL
 *   c   (p 0.6→0.8): Section 3 → Section 4  HORIZONTAL
 *   d   (p 0.8→1.0): Section 4 → Section 5  VERTICAL
 *
 * The horizontal track holds Sections 0–4 in a row and is translated left by progress.
 * When segment d kicks in, the viewport translates vertically to reveal Section 5.
 */
function ContentLayer() {
  const { s01, a, b, c, d } = useScrollProgress();

  // Horizontal offset: slide left through Sections 0→1→2→3→4
  // s01 drives the first slide, a/b/c drive subsequent ones
  const hOffset = (s01 + a + b + c) * 100; // 0→400 vw

  // Vertical offset: slide upward to reveal Section 5 (Area 4)
  const vOffset = d * 100; // 0→100 vh

  return (
    <div className={styles.viewport}>
      <div
        className={styles.verticalTrack}
        style={{ transform: `translateY(-${vOffset}vh)` }}
      >
        {/* Horizontal track: Sections 0, 1, 2, 3, 4 side by side */}
        <div
          className={styles.horizontalTrack}
          style={{ transform: `translateX(-${hOffset}vw)` }}
        >
          <Section0 />
          <Area1 />
          <Area2 />
          <Area3 />
        </div>

        {/* Section 5 (Area 4) sits below the horizontal track */}
        <Area4 />
      </div>
    </div>
  );
}
