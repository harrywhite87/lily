import type {
  ControlEntry,
  NumberControl,
  BooleanControl,
  ColorControl,
  ReadOnlyControl,
  ButtonControl,
  SelectControl,
} from './types';
import styles from './controls.module.scss';

/* ─── Number slider ─── */

export function NumberInput(props: {
  name: string;
  control: NumberControl;
  value: number;
  onChange: (v: number) => void;
}) {
  const { control, value, onChange, name } = props;
  const label = control.label ?? name;

  // Determine decimal places from step
  const decimals = Math.max(
    0,
    (control.step.toString().split('.')[1] ?? '').length,
  );

  return (
    <div className={styles.row}>
      <span className={styles.label} title={label}>
        {label}
      </span>
      <div className={styles.valueWrap}>
        <input
          type="range"
          className={styles.slider}
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className={styles.numValue}>{value.toFixed(decimals)}</span>
      </div>
    </div>
  );
}

/* ─── Boolean toggle ─── */

export function BooleanToggle(props: {
  name: string;
  control: BooleanControl;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { control, value, onChange, name } = props;
  const label = control.label ?? name;

  return (
    <div className={styles.row}>
      <span className={styles.label} title={label}>
        {label}
      </span>
      <div className={styles.valueWrap}>
        <button
          className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
          onClick={() => onChange(!value)}
          type="button"
        >
          <span
            className={`${styles.toggleThumb} ${value ? styles.toggleThumbOn : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

/* ─── Color picker ─── */

export function ColorInput(props: {
  name: string;
  control: ColorControl;
  value: string;
  onChange: (v: string) => void;
}) {
  const { control, value, onChange, name } = props;
  const label = control.label ?? name;

  return (
    <div className={styles.row}>
      <span className={styles.label} title={label}>
        {label}
      </span>
      <div className={styles.valueWrap}>
        <div className={styles.colorWrap}>
          <div className={styles.colorSwatch}>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          <span className={styles.colorHex}>{value}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Button ─── */

export function ButtonInput(props: { control: ButtonControl }) {
  return (
    <button
      className={styles.btn}
      onClick={props.control.onClick}
      type="button"
    >
      {props.control.label}
    </button>
  );
}

/* ─── Read-only ─── */

export function ReadOnlyRow(props: {
  name: string;
  control: ReadOnlyControl;
  value: string | number;
}) {
  const { control, name } = props;
  const label = control.label ?? name;
  const displayValue =
    typeof props.value === 'number'
      ? props.value.toLocaleString()
      : props.value;

  return (
    <div className={styles.row}>
      <span className={styles.label} title={label}>
        {label}
      </span>
      <div className={styles.valueWrap}>
        <span className={styles.readOnly}>{displayValue}</span>
      </div>
    </div>
  );
}

/* ─── Select dropdown ─── */

export function SelectInput(props: {
  name: string;
  control: SelectControl;
  value: string;
  onChange: (v: string) => void;
}) {
  const { control, value, onChange, name } = props;
  const label = control.label ?? name;

  return (
    <div className={styles.row}>
      <span className={styles.label} title={label}>
        {label}
      </span>
      <div className={styles.valueWrap}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {control.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
