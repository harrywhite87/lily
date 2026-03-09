import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.scss';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...rest }, ref) => {
    const classes = [styles.root, className].filter(Boolean).join(' ');

    return <textarea ref={ref} className={classes} {...rest} />;
  }
);

TextArea.displayName = 'TextArea';
