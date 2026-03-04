import type {
  InspectorScalar,
  ObjectInspectorSurface,
} from '@lilypad/shared';
import {
  NumberInput,
  BooleanToggle,
  ColorInput,
  ButtonInput,
  ReadOnlyRow,
  SelectInput,
} from '../controls/widgets';

type Props = {
  surface: ObjectInspectorSurface;
  values: Record<string, InspectorScalar>;
  onValueChange: (key: string, value: InspectorScalar) => void;
  onButtonClick: (key: string) => void;
};

export function ObjectInspectorFields({
  surface,
  values,
  onValueChange,
  onButtonClick,
}: Props) {
  return (
    <>
      {surface.fields.map((field) => {
        if (field.kind === 'button') {
          return (
            <ButtonInput
              key={field.key}
              control={{
                type: 'button',
                label: field.label,
                onClick: () => onButtonClick(field.key),
              }}
            />
          );
        }

        if (field.kind === 'readonly') {
          const value = values[field.key] ?? field.get();
          return (
            <ReadOnlyRow
              key={field.key}
              name={field.key}
              control={{
                value: field.get(),
                editable: false,
                label: field.label,
              }}
              value={typeof value === 'number' ? value : String(value)}
            />
          );
        }

        if (field.kind === 'number') {
          const value = values[field.key] ?? field.get();
          const numericValue = typeof value === 'number' ? value : 0;
          return (
            <NumberInput
              key={field.key}
              name={field.key}
              control={{
                value: field.get(),
                min: field.min,
                max: field.max,
                step: field.step,
                label: field.label,
              }}
              value={numericValue}
              onChange={(v) => onValueChange(field.key, v)}
            />
          );
        }

        if (field.kind === 'boolean') {
          const value = values[field.key] ?? field.get();
          return (
            <BooleanToggle
              key={field.key}
              name={field.key}
              control={{
                value: field.get(),
                label: field.label,
              }}
              value={Boolean(value)}
              onChange={(v) => onValueChange(field.key, v)}
            />
          );
        }

        if (field.kind === 'color') {
          const value = values[field.key] ?? field.get();
          return (
            <ColorInput
              key={field.key}
              name={field.key}
              control={{
                value: field.get(),
                label: field.label,
              }}
              value={typeof value === 'string' ? value : '#ffffff'}
              onChange={(v) => onValueChange(field.key, v)}
            />
          );
        }

        const value = values[field.key] ?? field.get();
        return (
          <SelectInput
            key={field.key}
            name={field.key}
            control={{
              type: 'select',
              value: field.get(),
              options: field.options,
              label: field.label,
            }}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => onValueChange(field.key, v)}
          />
        );
      })}
    </>
  );
}
