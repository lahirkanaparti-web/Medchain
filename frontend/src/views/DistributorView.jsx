import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Search, CheckCircle2, RefreshCw, AlertOctagon, MapPin, FileSpreadsheet, FileText } from 'lucide-react';
import { getBatch, transferCustody, exportBatch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';

const DEFAULT_DISTRIBUTOR_ADDR = '0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd';

export default function DistributorView() {
  const [searchId, setSearchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [distributorAddress, setDistributorAddress] = useState(DEFAULT_DISTRIBUTOR_ADDR);
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

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: '', longitude: '' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6)
          });
        },
        (err) => {
          console.warn('Geolocation permission denied or unavailable:', err.message);
          resolve({ latitude: '', longitude: '' });
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  };

  const handleTransfer = async (targetState) => {
    if (!batch) return;
    if (batch.isRecalled || batch.state === 5) {
      toast.error('Cannot transfer custody of a RECALLED batch.');
      return;
    }

    setActionLoading(true);

    try {
      toast('Requesting browser geolocation permission...', { icon: '📍' });
      const coords = await getCoordinates();

      if (coords.latitude && coords.longitude) {
        toast.success(`GPS Location attached: ${coords.latitude}, ${coords.longitude}`);
      }

      const res = await transferCustody(batch.batchId, distributorAddress, targetState, coords.latitude, coords.longitude);
      toast.success(`Custody updated to ${res.newStateName}!`);
      const updated = await getBatch(batch.batchId);
      setBatch(updated);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Custody transfer transaction failed.';
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
      {/* Clinical Logistics Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-clinical-50 text-clinical-800 rounded border border-clinical-200 shrink-0 mt-0.5">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Distributor Logistics Terminal
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Inspect incoming batch shipments, record GPS-tagged warehouse receipt, and transfer custody to accredited pharmacy networks.
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
            Enter a batch serial number above to inspect its origin record and execute logistics handoff.
          </p>
        </div>
      )}

      {/* Batch Inspection View */}
      {!loading && batch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Prominent Recall Banner if Recalled */}
            {(batch.isRecalled || batch.state === 5) && (
              <div className="bg-red-600 border border-red-700 text-white p-5 rounded doc-panel space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm uppercase tracking-wide">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>CRITICAL RECALL WARNING: BATCH RECALLED ON-CHAIN</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  This batch was officially RECALLED by regulatory authorities. All further custody transfers are permanently blocked.
                </p>
                {batch.recallReason && (
                  <div className="p-2.5 bg-black/20 rounded border border-white/20 text-xs font-mono">
                    <span className="font-bold">Reason:</span> {batch.recallReason}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Batch details
                  </span>
                  <h3 className="text-base font-display font-bold text-clinical-900">{batch.drugName}</h3>
                  <span className="text-xs font-mono text-slate-600">{batch.batchNumber}</span>
                </div>
                <StatusBadge state={batch.state} stateName={batch.stateName} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-slate-500 font-medium block">Current custodian wallet:</span>
                  <span className="font-mono text-slate-800 break-all">{batch.currentCustodian}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold">
                    Distributor wallet address (Target custodian)
                  </label>
                  <input
                    type="text"
                    value={distributorAddress}
                    onChange={(e) => setDistributorAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-clinical-800 outline-none"
                  />
                </div>
              </div>

              {/* Custody Actions */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700">
                    Custody transitions (GPS Location-Enabled)
                  </h4>
                  <span className="text-[11px] text-emerald-700 flex items-center font-medium">
                    <MapPin className="w-3 h-3 mr-1" />
                    Auto-requests location
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTransfer(1)}
                    disabled={actionLoading || batch.state >= 1 || batch.isRecalled}
                    className="px-4 py-2.5 bg-clinical-800 hover:bg-clinical-900 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Dispatch: In transit (1)</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleTransfer(2)}
                    disabled={actionLoading || batch.state >= 2 || batch.isRecalled}
                    className="px-4 py-2.5 bg-genuine-600 hover:bg-genuine-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Receive: At distributor (2)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Export Actions */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Export Batch Record</span>
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
