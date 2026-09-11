import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, Check, Barcode, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const { products, beep } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsScanning(false);
      return;
    }

    let isMounted = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startCamera = async () => {
      try {
        setCameraError(null);
        setIsScanning(true);

        const videoInputDevices = await reader.listVideoInputDevices();
        if (!isMounted) return;

        if (videoInputDevices.length === 0) {
          setCameraError('No camera detected on this system.');
          setIsScanning(false);
          return;
        }

        // Prefer back camera for mobile/tablets
        const selectedDeviceId =
          videoInputDevices.find((d) => d.label.toLowerCase().includes('back'))?.deviceId ||
          videoInputDevices[0].deviceId;

        if (videoRef.current) {
          reader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                const scannedText = result.getText();
                beep();
                onBarcodeDetected(scannedText);
                onClose();
              }
              // err is expected while seeking barcodes, do not throw
            }
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(msg || 'Camera access was denied or unavailable.');
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [isOpen, onBarcodeDetected, onClose, beep]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    beep();
    onBarcodeDetected(manualInput.trim());
    setManualInput('');
    onClose();
  };

  const handleQuickDemoScan = (product: Product) => {
    beep();
    onBarcodeDetected(product.barcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Grocery Barcode Scanner</h3>
              <p className="text-xs text-slate-400">Aim camera at product barcode or UPC/EAN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-5">
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Viewfinder Target Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-dashed border-emerald-400/80 rounded-lg relative flex items-center justify-center bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {/* Laser animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] scanner-laser-line" />

                <span className="text-[11px] font-mono tracking-wider text-emerald-300 uppercase bg-slate-950/70 px-2 py-0.5 rounded">
                  Align Barcode Here
                </span>
              </div>
            </div>

            {/* Camera error / fallback indicator */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-200">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="font-bold text-sm text-white">Camera Preview Unavailable</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">{cameraError}</p>
                <p className="text-xs text-emerald-400 mt-3">
                  You can still enter a barcode or click any quick-scan test product below!
                </p>
              </div>
            )}
          </div>

          {/* Manual Barcode Entry */}
          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or enter barcode manually (e.g. 011110416001)..."
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lookup</span>
            </button>
          </form>

          {/* Quick Demo Scan Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Test Barcodes (Click to simulate scan):</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleQuickDemoScan(p)}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-xs"
                >
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="font-mono text-[10px] text-slate-500 flex justify-between mt-0.5">
                    <span>{p.barcode}</span>
                    <span className="font-bold text-emerald-700">${p.sellingPrice.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
