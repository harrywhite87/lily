import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

// ── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonSize = 'small' | 'medium' | 'large';

export type ButtonColor =
  | 'orange'
  | 'dark-gray'
  | 'gray'
  | 'light-gray'
  | 'white'
  | 'red';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  /** Amber active-glow state */
  isActive?: boolean;
  /** Persistent ambient backlit glow */
  backlit?: boolean;
  /** Amber active-glow state */
  active?: boolean;
  /** Adds keycap housing (3-D recessed look) — off by default */
  recessed?: boolean;
  /** Render as a child slot instead of a `<button>` */
  asChild?: boolean;
  'data-testid'?: string;
}

// ── Maps ─────────────────────────────────────────────────────────────────────

const colorClassMap: Record<ButtonColor, string> = {
  orange: styles.colorOrange,
  'dark-gray': styles.colorDarkGray,
  gray: styles.colorGray,
  'light-gray': styles.colorLightGray,
  white: styles.colorWhite,
  red: styles.colorRed,
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
      color = 'light-gray',
      isActive = false,
      backlit = false,
      recessed = true,
      asChild = false,
      active = false,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const rootClasses = [
      styles.button,
      active ? styles.active : '',
      recessed && variant !== 'ghost' ? styles.recessed : '',
      variant === 'ghost' ? styles.variantGhost : '',
      colorClassMap[color],
      sizeClassMap[size],
      isActive ? styles.isActive : '',
      backlit ? styles.backlit : '',
      className,
      variant === 'secondary' ? styles.secondary : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={asChild ? undefined : type}
        className={rootClasses}
        data-active={isActive || undefined}
        {...props}
      >
        <span className={styles.inner}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
