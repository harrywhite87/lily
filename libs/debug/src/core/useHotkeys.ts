import { useEffect } from 'react';
import { useDebugStore } from './store';

export function useHotkeys(): void {
  const isOpen = useDebugStore((s) => s.isOpen);
  const setOpen = useDebugStore((s) => s.setOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') setOpen(!isOpen);
      if (e.key === 'Escape' && isOpen) setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpen]);
}
