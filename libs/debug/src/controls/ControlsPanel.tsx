import { useState, useMemo } from 'react';
import { useControlsStore, type ControlRegistration } from './store';
import type { ControlSchema, ControlEntry, FlatValues } from './types';
import {
  isButton,
  isFolder,
  isReadOnly,
  isSelect,
  isBoolean,
  isColor,
  isNumber,
} from './types';
import {
  NumberInput,
  BooleanToggle,
  ColorInput,
  ButtonInput,
  ReadOnlyRow,
  SelectInput,
} from './widgets';
import styles from './controls.module.scss';

/* ─── Folder group ─── */

function FolderGroup(props: {
  title: string;
  collapsed?: boolean;
  controls: ControlSchema;
  values: FlatValues;
  onValueChange: (key: string, value: number | boolean | string) => void;
}) {
  const [isOpen, setIsOpen] = useState(!props.collapsed);

  return (
    <div className={styles.group}>
      <button
        className={styles.groupHeader}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span
          className={`${styles.groupChevron} ${isOpen ? styles.groupChevronOpen : ''}`}
        >
          ▶
        </span>
        {props.title}
      </button>
      {isOpen && (
        <div className={styles.groupBody}>
          <ControlEntries
            schema={props.controls}
            values={props.values}
            onValueChange={props.onValueChange}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Render a set of control entries ─── */

function ControlEntries(props: {
  schema: ControlSchema;
  values: FlatValues;
  onValueChange: (key: string, value: number | boolean | string) => void;
}) {
  const { schema, values, onValueChange } = props;

  return (
    <>
      {Object.entries(schema).map(([key, entry]) => {
        if (isButton(entry)) {
          return <ButtonInput key={key} control={entry} />;
        }
        if (isFolder(entry)) {
          return (
            <FolderGroup
              key={key}
              title={entry.title}
              collapsed={entry.collapsed}
              controls={entry.controls}
              values={values}
              onValueChange={onValueChange}
            />
          );
        }
        if (isReadOnly(entry)) {
          return (
            <ReadOnlyRow
              key={key}
              name={key}
              control={entry}
              value={(values[key] ?? entry.value) as string | number}
            />
          );
        }
        if (isSelect(entry)) {
          return (
            <SelectInput
              key={key}
              name={key}
              control={entry}
              value={(values[key] as string) ?? entry.value}
              onChange={(v) => onValueChange(key, v)}
            />
          );
        }
        if (isBoolean(entry)) {
          return (
            <BooleanToggle
              key={key}
              name={key}
              control={entry}
              value={(values[key] as boolean) ?? entry.value}
              onChange={(v) => onValueChange(key, v)}
            />
          );
        }
        if (isColor(entry)) {
          return (
            <ColorInput
              key={key}
              name={key}
              control={entry}
              value={(values[key] as string) ?? entry.value}
              onChange={(v) => onValueChange(key, v)}
            />
          );
        }
        if (isNumber(entry)) {
          return (
            <NumberInput
              key={key}
              name={key}
              control={entry}
              value={(values[key] as number) ?? entry.value}
              onChange={(v) => onValueChange(key, v)}
            />
          );
        }
        return null;
      })}
    </>
  );
}

/* ─── Single registration group ─── */

function RegistrationGroup(props: { reg: ControlRegistration }) {
  const { reg } = props;
  const setValue = useControlsStore((s) => s.setValue);

  return (
    <div className={styles.group}>
      <div className={styles.groupHeader} style={{ cursor: 'default' }}>
        {reg.id}
      </div>
      <div className={styles.groupBody}>
        <ControlEntries
          schema={reg.schema}
          values={reg.values}
          onValueChange={(key, value) => setValue(reg.id, key, value)}
        />
      </div>
    </div>
  );
}

/* ─── Controls panel (built-in panel for DebugOverlay) ─── */

export function ControlsPanel() {
  const registrations = useControlsStore((s) => s.registrations);

  const sorted = useMemo(() => {
    const arr = Array.from(registrations.values());
    arr.sort((a, b) => a.order - b.order);
    return arr;
  }, [registrations]);

  if (sorted.length === 0) {
    return <div className={styles.empty}>No controls registered</div>;
  }

  return (
    <div style={{ maxHeight: 400, overflow: 'auto', paddingRight: 4 }}>
      {sorted.map((reg, i) => (
        <div key={reg.id}>
          {i > 0 && <div className={styles.divider} />}
          <RegistrationGroup reg={reg} />
        </div>
      ))}
    </div>
  );
}
