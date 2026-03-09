import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from 'react';

export interface ModelUploadState {
  /** Blob URL of the file currently being previewed (null when using context model). */
  previewUrl: string | null;
  /** Original filename of the uploaded file. */
  fileName: string | null;
  /** Whether a file is currently being dragged over the drop zone. */
  dragOver: boolean;
  /** Ref to attach to a hidden `<input type="file">`. */
  fileInputRef: React.RefObject<HTMLInputElement>;

  /* Handlers */
  handleDragOver: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleReset: () => void;
}

/**
 * Encapsulates drag-and-drop + file-input upload logic for .glb/.gltf models.
 *
 * @param resetModel – callback to reset the global model context back to its default.
 */
export function useModelUpload(resetModel: () => void): ModelUploadState {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const replacePreviewUrl = useCallback((nextUrl: string | null) => {
    setPreviewUrl((current) => {
      if (current && current !== nextUrl) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
  }, []);

  const loadFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
      alert('Please provide a .glb or .gltf file.');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    replacePreviewUrl(blobUrl);
    setFileName(file.name);
  }, [replacePreviewUrl]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleReset = useCallback(() => {
    replacePreviewUrl(null);
    setFileName(null);
    resetModel();
  }, [replacePreviewUrl, resetModel]);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  return {
    previewUrl,
    fileName,
    dragOver,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleReset,
  };
}
