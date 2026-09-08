import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Camera, RefreshCw } from 'lucide-react';
import { verifyProduct } from '../api/client';
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
      toast.success('Packaging sample photograph attached.');
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
      if (res.verdict === 'genuine') {
        toast.success('Product verified authentic!');
      } else {
        toast.error('Warning: Physical packaging features suspect!');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Product verification failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (scannedBatchId) => {
    setBatchId(scannedBatchId);
    toast.success(`Scanned batch code: ${scannedBatchId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clinical Inspection Station Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-clinical-50 text-clinical-800 rounded border border-clinical-200 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Patient Medicine Authenticator
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Scan the code on your package and take a photo to check if your medicine is genuine.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Inspection Form */}
      <form onSubmit={handleVerify} className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-clinical-900">
            Identify batch serial & attach photo
          </h3>
          <span className="text-xs text-slate-500">Official verification protocol</span>
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
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800 text-xs outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-clinical-900 font-semibold text-xs rounded border border-slate-300 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-clinical-800" />
            <span>Scan package code</span>
          </button>
        </div>

        {/* Real Mobile / In-Browser Camera Capture Component */}
        <CameraCapture onPhotoCaptured={handlePhotoCaptured} currentPreview={livePreview} />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-genuine-600 hover:bg-genuine-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying product features...</span>
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

            {/* Custody Manifest Panel */}
            <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-4">
              <CustodyTimeline history={result.history || []} currentTxHash={result.txHash} />
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
