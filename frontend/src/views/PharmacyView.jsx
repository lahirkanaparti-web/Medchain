import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Search, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { getBatch, transferCustody } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';

const DEFAULT_PHARMACY_ADDR = '0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd';
const DEFAULT_PATIENT_ADDR = '0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd';

export default function PharmacyView() {
  const [searchId, setSearchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [pharmacyAddress, setPharmacyAddress] = useState(DEFAULT_PHARMACY_ADDR);
  const [patientAddress, setPatientAddress] = useState(DEFAULT_PATIENT_ADDR);
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

  const handleTransfer = async (targetState, recipientAddr) => {
    if (!batch) return;
    setActionLoading(true);

    try {
      const res = await transferCustody(batch.batchId, recipientAddr, targetState);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clinical Pharmacy Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-clinical-50 text-clinical-800 rounded border border-clinical-200 shrink-0 mt-0.5">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Accredited Pharmacy Terminal
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Ingest inventory from authorized distributors, inspect complete chain-of-custody logs, and record prescription dispensing to patients.
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
            Enter a batch serial number above to inspect pharmacy inventory or execute patient dispensing.
          </p>
        </div>
      )}

      {/* Batch Inspection View */}
      {!loading && batch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Pharmacy inventory details
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
                  Pharmacy store wallet
                </label>
                <input
                  type="text"
                  value={pharmacyAddress}
                  onChange={(e) => setPharmacyAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-clinical-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-semibold">
                  Patient wallet address (For dispensing)
                </label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-clinical-800 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700">
                Pharmacy custody transitions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleTransfer(3, pharmacyAddress)}
                  disabled={actionLoading || batch.state >= 3}
                  className="px-4 py-2.5 bg-clinical-800 hover:bg-clinical-900 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-3.5 h-3.5 mr-1" />
                      <span>Receive: At pharmacy (3)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleTransfer(4, patientAddress)}
                  disabled={actionLoading || batch.state < 3 || batch.state >= 4}
                  className="px-4 py-2.5 bg-genuine-600 hover:bg-genuine-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      <span>Dispense to patient (4)</span>
                    </>
                  )}
                </button>
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
