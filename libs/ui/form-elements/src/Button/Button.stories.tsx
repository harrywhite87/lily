import type { Meta, StoryObj } from '@storybook/react';
import type { ButtonColor, ButtonVariant, ButtonSize } from './Button';
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
    color: {
      control: 'select',
      options: ['orange', 'dark-gray', 'gray', 'light-gray', 'white', 'red'],
    },
    recessed: { control: 'boolean' },
    backlit: { control: 'boolean' },
    active: { control: 'boolean' },
    isActive: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

const colors: ButtonColor[] = ['orange', 'dark-gray', 'gray', 'light-gray', 'white', 'red'];
const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

export const AllVariants: Story = {
  render: () => (
    <div className={styles.showcase}>
      <div className={styles.section}>
        <div className={styles.heading}>Colors (Primary Variant)</div>
        <div className={styles.row}>
          {colors.map((c) => (
            <Button key={c} color={c}>{c}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Variants</div>
        <div className={styles.row}>
          {variants.map((v) => (
            <Button key={v} variant={v} color="light-gray">{v}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Sizes</div>
        <div className={styles.row}>
          {sizes.map((s) => (
            <Button key={s} size={s} color="light-gray">{s}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>States</div>
        <div className={styles.row}>
          <Button color="orange">Default</Button>
          <Button color="orange" backlit>Backlit</Button>
          <Button color="light-gray" disabled>Disabled</Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>Secondary Variant × Colors</div>
        <div className={styles.row}>
          {colors.map((c) => (
            <Button key={c} variant="secondary" color={c}>{c}</Button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.heading}>No Recess</div>
        <div className={styles.row}>
          {colors.map((c) => (
            <Button key={c} color={c} recessed={false}>{c}</Button>
          ))}
        </div>
      </div>
    </div>
  ),
};
