import type { LabelHTMLAttributes, ReactNode } from 'react';
import styles from './Label.module.scss';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  required?: boolean;
  className?: string;
};

export function Label({
  children,
  required,
  className,
  ...rest
}: LabelProps) {
  const classes = [styles.root, required ? styles.required : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes} {...rest}>
      {children}
    </label>
  );
}
