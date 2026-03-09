import { forwardRef } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';
import styles from './Select.module.scss';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  className?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, ...rest }, ref) => {
    const wrapperClasses = [styles.root, className].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        <select ref={ref} className={styles.select} {...rest}>
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
