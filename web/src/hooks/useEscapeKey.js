import { useEffect, useRef } from 'react';

/**
 * Calls onClose when the Escape key is pressed while `active` is true.
 * Use it to close popups/modals with the Esc key.
 */
export default function useEscapeKey(active, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);
}
