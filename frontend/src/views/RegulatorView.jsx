import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertOctagon, Search, ShieldAlert, Download, RefreshCw, FileSpreadsheet, FileText } from 'lucide-react';
import { getBatch, recallBatch, exportBatch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';
import PinataBadge from '../components/PinataBadge';
import { useWallet } from '../context/WalletContext';

export default function RegulatorView() {
  const { account, isConnected } = useWallet();
  const [searchId, setSearchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [recallReason, setRecallReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchId) {
      toast.error('Please enter a batch serial number.');
      return;
    }

    setLoading(true);

    try {
      const res = await getBatch(searchId);
      setBatch(res);
      toast.success(`Loaded details for batch #${searchId}`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || `Batch #${searchId} not found.`;
      toast.error(errMsg);
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async (e) => {
    e.preventDefault();
    if (!batch) return;
    if (!recallReason.trim()) {
      toast.error('Please enter an official recall reason.');
      return;
    }

    setActionLoading(true);

    try {
      const res = await recallBatch(batch.batchId, recallReason.trim());
      toast.success(`Batch #${batch.batchId} RECALLED on-chain!`);
      const updated = await getBatch(batch.batchId);
      setBatch(updated);
      setRecallReason('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'On-chain recall transaction failed.';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!batch) return;
    try {
      await exportBatch(batch.batchId, format);
      toast.success(`Downloaded batch #${batch.batchId} ${format.toUpperCase()} record.`);
    } catch (err) {
      console.error(err);
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Regulatory Inspection Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-red-50 text-red-700 rounded border border-red-200 shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Regulatory Compliance & Recall Terminal
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Authorized regulatory terminal for investigating pharmaceutical batches, issuing binding on-chain recall orders, and inspecting Pinata IPFS reference packaging standards.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Lookup Input */}
      <form onSubmit={handleSearch} className="bg-white rounded p-4 border border-slate-300 doc-panel flex gap-3">
        <input
          type="number"
          placeholder="Enter batch serial number (e.g. 1)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800 text-xs outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-clinical-800 hover:bg-clinical-900 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1.5 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Inspect batch</span>
        </button>
      </form>

      {/* Loading Skeleton */}
      {loading && <SkeletonLoader type="card" />}

      {/* Role-Specific Empty State */}
      {!loading && !batch && (
        <div className="bg-white rounded p-8 border border-slate-300 text-center space-y-2 doc-panel">
          <p className="font-display font-semibold text-sm text-clinical-900">
            No batch selected
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Enter a batch serial number above to inspect compliance data, audit custody history, or execute a product recall.
          </p>
        </div>
      )}

      {/* Batch Details & Regulatory Actions */}
      {!loading && batch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Prominent Recall Alert Banner if Recalled */}
            {batch.isRecalled && (
              <div className="bg-red-600 border border-red-700 text-white p-5 rounded doc-panel space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm uppercase tracking-wide">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>CRITICAL REGULATORY RECALL ORDER IN EFFECT</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  This batch was officially recalled on-chain by healthcare regulatory authorities. All further custody transfers are permanently blocked.
                </p>
                {batch.recallReason && (
                  <div className="p-2.5 bg-black/20 rounded border border-white/20 text-xs font-mono">
                    <span className="font-bold">Official Reason:</span> {batch.recallReason}
                  </div>
                )}
              </div>
            )}

            {/* Batch Info Card */}
            <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Regulatory Audit Record
                  </span>
                  <h3 className="text-base font-display font-bold text-clinical-900">{batch.drugName}</h3>
                  <span className="text-xs font-mono text-slate-600">{batch.batchNumber}</span>
                </div>
                <StatusBadge state={batch.state} stateName={batch.stateName} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Batch serial ID:</span>
                  <span className="font-bold text-clinical-900">#{batch.batchId}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-slate-500 font-medium block">Current custodian wallet:</span>
                  <span className="font-mono text-slate-800 break-all">{batch.currentCustodian}</span>
                </div>

                {/* Pinata IPFS Gateway Reference Links */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                  <span className="text-slate-500 font-medium block">Pinata IPFS Reference Standards:</span>
                  <div className="space-y-1.5">
                    {(batch.ipfsImageHashes || [batch.ipfsImageHash]).filter(Boolean).map((cid, i) => (
                      <PinataBadge key={i} cid={cid} label={`Standard #${i + 1}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Actions (CSV / PDF) */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Export Official Audit Documentation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport('csv')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-clinical-900 font-semibold text-xs rounded border border-slate-300 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-clinical-900 font-semibold text-xs rounded border border-slate-300 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Recall Action Form (Blocked if already recalled or dispensed) */}
              {!batch.isRecalled && batch.state !== 4 && (
                <form onSubmit={handleRecall} className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center space-x-1.5 text-red-700">
                    <AlertOctagon className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      Execute On-Chain Batch Recall (REGULATOR_ROLE)
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Official Recall Justification *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Specify quality audit defect, contamination risk, or regulatory violation reason..."
                      value={recallReason}
                      onChange={(e) => setRecallReason(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting on-chain recall...</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="w-4 h-4" />
                        <span>Issue Binding Recall Order</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {batch.state === 4 && !batch.isRecalled && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 italic">
                  Dispensed batches cannot be recalled on-chain (already reached the patient).
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-4">
            <CustodyTimeline history={batch.custodyHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
