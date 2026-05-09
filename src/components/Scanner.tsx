import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertCircle, CheckCircle2, Scan } from 'lucide-react';

interface ScannerProps {
  onScan: (id: string) => void;
  isPaused: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isPaused }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
      },
      (errorMessage) => {
        // Silent error for scanning frames
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [onScan, isPaused]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border-2 border-gray-100 shadow-xl bg-gray-50">
      <div id="qr-reader" className="w-full"></div>
      {!isPaused && (
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center gap-2">
          <Scan className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-semibold text-gray-600">Align QR code clearly</span>
        </div>
      )}
    </div>
  );
};

export default Scanner;
