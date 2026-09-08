import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Search, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { getBatch, transferCustody } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const DEFAULT_PHARMACY_ADDR = '0x3C44CdD4191fC0294516EEA6774579D64894f28c';
const DEFAULT_PATIENT_ADDR = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

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
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shadow-sm">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pharmacy Counter & Dispensing</h2>
            <p className="text-sm text-slate-500">
              Confirm batch receipt at retail pharmacy and log final patient dispensing on-chain.
            </p>
          </div>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex gap-3">
        <input
          type="number"
          placeholder="Enter Batch ID (e.g. 1)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm outline-none transition-all"
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
          description="Enter a Batch ID above to verify pharmacy inventory status or execute patient dispensing."
        />
      )}

      {/* Inspection View */}
      {!loading && batch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Pharmacy Inventory
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
                <label className="block text-slate-700 font-bold uppercase mb-1">
                  Pharmacy Store Wallet
                </label>
                <input
                  type="text"
                  value={pharmacyAddress}
                  onChange={(e) => setPharmacyAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">
                  Patient Wallet Address (For Dispensing)
                </label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pharmacy Custody Transitions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleTransfer(3, pharmacyAddress)}
                  disabled={actionLoading || batch.state >= 3}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming on-chain...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Receive At Pharmacy (3)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleTransfer(4, patientAddress)}
                  disabled={actionLoading || batch.state < 3 || batch.state >= 4}
                  className="px-4 py-3 bg-genuine-500 hover:bg-genuine-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming on-chain...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Dispense to Patient (4)</span>
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
