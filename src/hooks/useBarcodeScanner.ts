import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) { // Assume minimum length for barcode
          onScan(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Append character to buffer
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;

        // Reset buffer if no key is pressed within 50ms (typing is slower than scanning)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}
