import { useDebugStore } from '../core/store';
import { ObjectInspectorPanel } from './ObjectInspectorPanel';
import styles from './PropertiesPanel.module.scss';

export function PropertiesPanel() {
  const selectedUuid = useDebugStore((s) => s.selectedObjectUuid);

  return (
    <div className={styles.wrapper}>
      <ObjectInspectorPanel
        objectUuid={selectedUuid}
        emptyMessage="Select an object above"
        missingMessage="Object not found"
      />
    </div>
  );
}
