import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Search, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { getBatch, transferCustody } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

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
      toast.error('Please enter a valid Batch ID.');
      return;
    }

    setLoading(true);

    try {
      const res = await getBatch(searchId);
      setBatch(res);
      toast.success(`Loaded details for Batch #${searchId}`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || `Batch #${searchId} not found on chain.`;
      toast.error(errMsg);
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (targetState) => {
    if (!batch) return;
    setActionLoading(true);

    try {
      const res = await transferCustody(batch.batchId, distributorAddress, targetState);
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
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Distributor Operations Hub</h2>
            <p className="text-sm text-slate-500">
              Inspect incoming shipments, record warehouse receipt, and update transit status on-chain.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex gap-3">
        <input
          type="number"
          placeholder="Enter Batch ID to inspect (e.g. 1)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Inspect Batch</span>
        </button>
      </form>

      {/* Loading Skeleton */}
      {loading && <SkeletonLoader type="card" />}

      {/* Empty State */}
      {!loading && !batch && (
        <EmptyState
          title="No Batch Inspecting"
          description="Enter a Batch ID above to verify custodian state and execute warehouse transfers."
        />
      )}

      {/* Batch Inspection View */}
      {!loading && batch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Batch Details
                </span>
                <h3 className="text-xl font-bold text-slate-900">{batch.drugName}</h3>
                <span className="text-xs font-mono text-slate-500">{batch.batchNumber}</span>
              </div>
              <StatusBadge state={batch.state} stateName={batch.stateName} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block uppercase">Current Custodian Wallet</span>
                <span className="font-mono text-slate-800 break-all">{batch.currentCustodian}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1.5">
                  Distributor Wallet Address (Target Custodian)
                </label>
                <input
                  type="text"
                  value={distributorAddress}
                  onChange={(e) => setDistributorAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Blockchain Custody Transitions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleTransfer(1)}
                  disabled={actionLoading || batch.state >= 1}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming on-chain...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Dispatch: In Transit (1)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleTransfer(2)}
                  disabled={actionLoading || batch.state >= 2}
                  className="px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming on-chain...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Receive: At Distributor (2)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              On-Chain Custody Audit Log
            </h3>
            <CustodyTimeline history={batch.custodyHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
