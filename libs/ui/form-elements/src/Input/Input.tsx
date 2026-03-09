import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    const classes = [styles.root, className].filter(Boolean).join(' ');

    return <input ref={ref} className={classes} {...rest} />;
  }
);

Input.displayName = 'Input';
