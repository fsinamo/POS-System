import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { X, QrCode, Camera, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, addToCart } = usePOS();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [scannedProductInfo, setScannedProductInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedProductInfo(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } else {
        setCameraError('Kamera tidak didukung di peramban ini.');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Izin akses kamera belum diberikan atau kamera sedang dipakai aplikasi lain.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleBarcodeFound = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    const matched = products.find(
      (p) => p.barcode.toLowerCase() === trimmed.toLowerCase() || p.id === trimmed
    );

    if (matched) {
      if (matched.stock <= 0) {
        setScannedProductInfo(`⚠️ "${matched.name}" Stok Habis!`);
      } else {
        addToCart(matched, 1);
        setScannedProductInfo(`✅ Berhasil menambahkan "${matched.name}" ke keranjang!`);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } else {
      setScannedProductInfo(`❌ Produk dengan barcode "${trimmed}" tidak ditemukan.`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeFound(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Scanner Barcode Produk</h3>
              <p className="text-xs text-slate-400">Arahkan kamera ke barcode barang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera Viewfinder Box */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
            {cameraError ? (
              <div className="p-4 text-center text-slate-300 space-y-2">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs leading-relaxed">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center gap-1 mt-2"
                >
                  <RefreshCw className="w-3 h-3" /> Coba Lagi
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Target Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                </div>
                <div className="absolute bottom-2 px-3 py-1 bg-slate-950/70 backdrop-blur-xs rounded-full text-[11px] text-slate-200 font-mono">
                  Posisikan Barcode di Tengah Kotak
                </div>
              </>
            )}
          </div>

          {/* Feedback Message */}
          {scannedProductInfo && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                scannedProductInfo.startsWith('✅')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {scannedProductInfo}
            </div>
          )}

          {/* Quick Simulation / Manual Code Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Input / Tes Barcode Manual
            </label>
            <div className="flex gap-2">
              <input
                id="input-manual-barcode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan / ketik barcode..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Quick Click Sample Barcodes */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Klik Cepat Barcode Sampel:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleBarcodeFound(p.barcode)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 font-mono transition-colors text-left truncate max-w-full"
                  title={`${p.name} (${p.barcode})`}
                >
                  {p.icon || '📦'} {p.name.slice(0, 16)}...
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
