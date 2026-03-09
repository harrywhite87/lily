import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

// ── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  'data-testid'?: string;
}

// ── Maps ─────────────────────────────────────────────────────────────────────

const variantClassMap: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
};

const sizeClassMap: Record<ButtonSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'medium',
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const rootClasses = [
      styles.button,
      variantClassMap[variant],
      sizeClassMap[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={rootClasses}
        {...props}
      >
        <span className={styles.inner}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
