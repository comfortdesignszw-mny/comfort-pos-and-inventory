import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerModalProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        });
      },
      (errorMessage) => {
        // We can ignore most scan errors as they just mean a code isn't in frame
      }
    ).catch((err) => {
      setError("Error accessing camera. Please ensure permissions are granted.");
      console.error(err);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full mx-4 overflow-hidden relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Scan Barcode</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 relative">
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
          <p className="text-center text-sm text-slate-500 mt-4">Point your camera at a barcode.</p>
        </div>
      </div>
    </div>
  );
}
