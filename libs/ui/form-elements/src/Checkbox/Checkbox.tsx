import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Checkbox.module.scss';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  children?: ReactNode;
  className?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ children, className, disabled, ...rest }, ref) => {
    const rootClasses = [
      styles.root,
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label className={rootClasses}>
        <input ref={ref} type="checkbox" disabled={disabled} {...rest} />
        <span className={styles.indicator}>
          <span className={styles.checkmark} />
        </span>
        {children && <span>{children}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
