import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Search, CheckCircle2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [manualBatchId, setManualBatchId] = useState('');
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsSuccessFlash(false);

    let scanner = null;

    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 15, qrbox: { width: 220, height: 220 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          const extractedBatchId = parseBatchId(decodedText);
          if (extractedBatchId) {
            // Flash success animation
            setIsSuccessFlash(true);
            toast.success(`Scanned Batch ID #${extractedBatchId}`);
            
            setTimeout(() => {
              try { scanner.clear(); } catch (e) {}
              onScanSuccess(extractedBatchId);
              onClose();
            }, 600);
          } else {
            toast.error(`Invalid QR format: '${decodedText}'`);
          }
        },
        (error) => {
          // Silent scan error
        }
      );
    } catch (err) {
      console.warn("QR Scanner initialization notice:", err);
    }

    return () => {
      if (scanner) {
        try { scanner.clear(); } catch (e) {}
      }
    };
  }, [isOpen]);

  const parseBatchId = (text) => {
    if (!text) return null;
    const match = text.match(/\/verify\/(\d+)/i) || text.match(/^(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBatchId.trim()) return;
    const parsed = parseInt(manualBatchId.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onScanSuccess(parsed);
      toast.success(`Loaded Batch ID #${parsed}`);
      onClose();
    } else {
      toast.error('Please enter a valid numeric Batch ID.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center space-x-2 text-slate-800">
              <Camera className="w-5 h-5 text-trust-500" />
              <h3 className="font-bold text-base">Scan Product QR Code</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Viewport */}
          <div className="p-6 space-y-5">
            <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-950 flex items-center justify-center">
              <div id="qr-reader-container" className="w-full text-white text-xs"></div>

              {/* Bracket Frame Overlay & Laser Line */}
              {!isSuccessFlash ? (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-trust-500/60 rounded-2xl relative">
                    {/* Bracket Corners */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-trust-500 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-trust-500 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-trust-500 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-trust-500 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <motion.div
                      animate={{ y: [10, 200, 10] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]"
                    />
                  </div>
                </div>
              ) : (
                /* Success Flash Animation */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white space-y-2 backdrop-blur-sm z-30"
                >
                  <CheckCircle2 className="w-16 h-16 text-white stroke-[2.5]" />
                  <span className="font-extrabold text-lg tracking-wide">QR Code Verified!</span>
                </motion.div>
              )}
            </div>

            {/* Manual Input Fallback */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2 text-center">
                Or enter Batch ID manually:
              </p>
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <input
                  type="number"
                  value={manualBatchId}
                  onChange={(e) => setManualBatchId(e.target.value)}
                  placeholder="e.g. 1"
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-trust-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-trust-500 hover:bg-trust-600 text-white font-semibold text-sm rounded-xl transition-all shadow flex items-center space-x-1"
                >
                  <Search className="w-4 h-4" />
                  <span>Inspect</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
