import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import styles from './PageLayout.module.scss';

export type PageLayoutProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  background?: string;
  className?: string;
  style?: CSSProperties;
};

export function PageLayout({
  children,
  background = 'var(--color-deep-navy)',
  className,
  style,
  ...rest
}: PageLayoutProps) {
  const mergedClassName = className
    ? `${styles.layout} ${className}`
    : styles.layout;

  return (
    <div className={mergedClassName} style={{ background, ...style }} {...rest}>
      {children}
    </div>
  );
}
