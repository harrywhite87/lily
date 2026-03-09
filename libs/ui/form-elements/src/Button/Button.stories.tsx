import type { Meta, StoryObj } from '@storybook/react';
import type { ButtonVariant, ButtonSize } from './Button';
import { Button } from './Button';
import styles from './ButtonShowcase.module.scss';

const meta: Meta<typeof Button> = {
  title: 'Form Elements/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

export const AllVariants: Story = {
  render: () => (
    <div className={styles.showcase}>
      <div className={styles.section}>
        <div className={styles.heading}>Variants</div>
        <div className={styles.row}>
          {variants.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Sizes (Primary)</div>
        <div className={styles.row}>
          {sizes.map((s) => (
            <Button key={s} size={s}>{s}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Sizes (Secondary)</div>
        <div className={styles.row}>
          {sizes.map((s) => (
            <Button key={s} variant="secondary" size={s}>{s}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Sizes (Ghost)</div>
        <div className={styles.row}>
          {sizes.map((s) => (
            <Button key={s} variant="ghost" size={s}>{s}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Disabled States</div>
        <div className={styles.row}>
          <Button variant="primary" disabled>Primary</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="ghost" disabled>Ghost</Button>
        </div>
      </div>
    </div>
  ),
};
