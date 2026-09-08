import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Camera, Upload, RefreshCw, Layers } from 'lucide-react';
import { verifyProduct, getBatch } from '../api/client';
import CustodyTimeline from '../components/CustodyTimeline';
import QRScannerModal from '../components/QRScannerModal';
import VerdictCard from '../components/VerdictCard';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PatientView() {
  const [batchId, setBatchId] = useState('');
  const [liveFile, setLiveFile] = useState(null);
  const [livePreview, setLivePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLiveFile(file);
      setLivePreview(URL.createObjectURL(file));
      toast.success('Live photo attached for visual AI analysis.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!batchId) {
      toast.error('Please enter or scan a valid Batch ID.');
      return;
    }

    if (!liveFile) {
      toast.error('Please capture or upload a live photograph of the physical medicine packaging.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyProduct(batchId, liveFile);
      setResult(res);
      if (res.verdict === 'genuine') {
        toast.success('Product verified authentic!');
      } else {
        toast.error('Warning: Physical features suspect!');
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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-genuine-50 text-genuine-600 rounded-xl border border-genuine-100 shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Product Authenticator</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Scan packaging QR barcode, upload physical photo, and run MobileNetV2 AI physical verification & on-chain provenance audit.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Step Input Form */}
      <form onSubmit={handleVerify} className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-soft space-y-6">
        <h3 className="font-bold text-base sm:text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Identify Product & Upload Physical Photo</span>
          <span className="text-xs text-trust-500 font-medium">Dual Verification Layer</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Batch ID Serial *
            </label>
            <input
              type="number"
              required
              placeholder="Enter Batch ID (e.g. 1)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-trust-500 focus:border-trust-500 text-sm outline-none transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow flex items-center justify-center space-x-2"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Scan QR Barcode</span>
          </button>
        </div>

        {/* Live Photo Upload Field with Framing Overlay */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Live Product Photo (Packaging Feature Extraction) *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-trust-500 transition-colors bg-slate-50 relative overflow-hidden">
            {livePreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img src={livePreview} alt="Live Photo Preview" className="max-h-48 mx-auto rounded-xl shadow-md border" />
                  {/* Framing Guide Overlay */}
                  <div className="absolute inset-2 border-2 border-emerald-500/80 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] bg-slate-900/80 text-white px-2 py-0.5 rounded font-mono">
                      Framing Aligned
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-mono">{liveFile?.name}</p>
                <button
                  type="button"
                  onClick={() => { setLiveFile(null); setLivePreview(null); }}
                  className="text-xs text-red-600 font-medium hover:underline block mx-auto"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-trust-500" />
                <span className="text-sm font-semibold text-slate-700">Click or capture live photo of packaging</span>
                <span className="text-xs text-slate-400">Center packaging clearly under bright light</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-trust-500 hover:bg-trust-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing MobileNetV2 Physical Features & On-Chain Audit...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Run AI Authenticity & Provenance Audit</span>
            </>
          )}
        </button>
      </form>

      {/* Loading Skeleton */}
      {loading && <SkeletonLoader type="verdict" />}

      {/* Verdict & Details Display Component */}
      <AnimatePresence>
        {!loading && result && (
          <div className="space-y-6">
            <VerdictCard result={result} livePreviewUrl={livePreview} />

            {/* On-Chain Provenance Log Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-trust-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Complete Supply Chain On-Chain Provenance Log
                </h3>
              </div>
              <CustodyTimeline history={result.custodyHistory} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
