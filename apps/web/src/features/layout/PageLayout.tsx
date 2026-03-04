import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import styles from './PageLayout.module.scss';

type PageLayoutProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Background color/gradient for the canvas area. Defaults to deep navy. */
  background?: string;
  /** Optional extra className to merge on the root element. */
  className?: string;
  /** Optional inline styles (e.g. display: flex). */
  style?: CSSProperties;
};

/**
 * Shared page shell: fixed fullscreen container offset below the NavBar.
 * Every route page should wrap its content in this component for a
 * consistent header + canvas layout.
 */
export function PageLayout({
  children,
  background = 'var(--color-deep-navy)',
  className,
  style,
  ...rest
}: PageLayoutProps) {
  const merged = className
    ? `${styles.layout} ${className}`
    : styles.layout;

  return (
    <div className={merged} style={{ background, ...style }} {...rest}>
      {children}
    </div>
  );
}
