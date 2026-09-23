import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Camera, RefreshCw, AlertOctagon, FileSpreadsheet, FileText } from 'lucide-react';
import { verifyProduct, exportBatch } from '../api/client';
import CustodyTimeline from '../components/CustodyTimeline';
import QRScannerModal from '../components/QRScannerModal';
import VerdictCard from '../components/VerdictCard';
import CameraCapture from '../components/CameraCapture';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PatientView() {
  const [batchId, setBatchId] = useState('');
  const [liveFile, setLiveFile] = useState(null);
  const [livePreview, setLivePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handlePhotoCaptured = (file, previewUrl) => {
    setLiveFile(file);
    setLivePreview(previewUrl);
    if (file) {
      toast.success('Packaging photo attached.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!batchId) {
      toast.error('Please enter a batch serial number.');
      return;
    }

    if (!liveFile) {
      toast.error('Please capture or select a photo of the medicine packaging.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyProduct(batchId, liveFile);
      setResult(res);

      const isRecalled = res.custodyHistory?.some((h) => h.state === 5);

      if (isRecalled) {
        toast.error('CRITICAL RECALL ALERT: This batch has been recalled on-chain!');
      } else if (res.verdict === 'genuine') {
        toast.success('Product verified authentic!');
      } else if (res.verdict === 'needs_review') {
        toast('Verification Inconclusive — Visual inspection recommended.', { icon: '⚠️' });
      } else {
        toast.error('Warning: Packaging features suspect!');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Product verification failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!batchId) return;
    try {
      await exportBatch(batchId, format);
      toast.success(`Downloaded batch #${batchId} ${format.toUpperCase()} record.`);
    } catch (err) {
      console.error(err);
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleScanSuccess = (scannedBatchId) => {
    setBatchId(scannedBatchId);
    toast.success(`Scanned batch code: ${scannedBatchId}`);
  };

  const isRecalled = result?.custodyHistory?.some((h) => h.state === 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Inspection Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-emerald-50 text-seal-emerald rounded border border-emerald-200 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-pharma-deep">
              Patient Product Authenticator
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Scan the code on your package and take a photo to check if your medicine is genuine and view its complete chain of custody.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Recall Banner if Recalled */}
      {isRecalled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-quarantine-crimson text-white p-5 rounded doc-panel space-y-2 shadow-md"
        >
          <div className="flex items-center space-x-2 font-bold text-sm uppercase tracking-wide">
            <AlertOctagon className="w-6 h-6 text-white shrink-0" />
            <span>CRITICAL RECALL ALERT: DO NOT CONSUME THIS MEDICINE</span>
          </div>
          <p className="text-xs text-white/95 leading-relaxed font-medium">
            Healthcare regulatory authorities have issued an official on-chain recall for this batch. Even if physical packaging appears genuine, this batch is not safe to consume.
          </p>
        </motion.div>
      )}

      {/* Verification Inspection Form */}
      <form onSubmit={handleVerify} className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-pharma-deep">
            Enter batch number & attach photo
          </h3>
          <span className="text-xs text-slate-500 font-mono">Verification protocol</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Batch serial number *
            </label>
            <input
              type="number"
              required
              placeholder="Enter batch serial number (e.g. 1)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-pharma-deep focus:border-pharma-deep text-xs outline-none font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-pharma-deep font-semibold text-xs rounded border border-slate-300 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-pharma-deep" />
            <span>Scan package code</span>
          </button>
        </div>

        {/* Real Mobile / In-Browser Camera Capture Component */}
        <CameraCapture onPhotoCaptured={handlePhotoCaptured} currentPreview={livePreview} />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-seal-emerald hover:bg-emerald-800 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying product features against verified baseline...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify authenticity</span>
            </>
          )}
        </button>
      </form>

      {/* Loading State Skeleton */}
      {loading && <SkeletonLoader type="verdict" />}

      {/* Inspection Verdict & Physical Supply Chain Manifest */}
      <AnimatePresence>
        {!loading && result && (
          <div className="space-y-6">
            <VerdictCard result={result} livePreviewUrl={livePreview} />

            {/* Custody Manifest & Export Panel */}
            <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-display font-bold text-xs text-pharma-deep">
                  Export verification audit record
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-pharma-deep font-semibold text-xs rounded border border-slate-300 flex items-center space-x-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-seal-emerald" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('pdf')}
                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-pharma-deep font-semibold text-xs rounded border border-slate-300 flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3 text-quarantine-crimson" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <CustodyTimeline history={result.custodyHistory || []} currentTxHash={result.txHash} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Barcode Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
