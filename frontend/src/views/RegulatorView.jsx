import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AlertOctagon, Search, ShieldAlert, RefreshCw, FileText, Copy, Bot, ChevronDown, ChevronUp, Check, AlertTriangle, ShieldCheck, Filter, ExternalLink, Sparkles, CheckCircle2, History } from 'lucide-react';
import { getBatch, recallBatch, exportBatch, investigateBatch, getRegulatorAuditLog } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustodyTimeline from '../components/CustodyTimeline';
import SkeletonLoader from '../components/SkeletonLoader';
import { useWallet } from '../context/WalletContext';

export default function RegulatorView() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('auditLog'); // 'auditLog' | 'manual'

  // Audit Log State
  const [auditEntries, setAuditEntries] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [batchIdFilter, setBatchIdFilter] = useState('');
  const [expandedEntries, setExpandedEntries] = useState({});

  // Manual Batch Lookup & Recall State
  const [searchId, setSearchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [recallReason, setRecallReason] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [manualBrief, setManualBrief] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Fetch Audit Log
  const fetchAuditLog = async () => {
    setLogLoading(true);
    try {
      const params = {};
      if (riskFilter) params.risk_level = riskFilter;
      if (actionFilter) params.action_taken = actionFilter;
      if (batchIdFilter) params.batch_id = batchIdFilter;

      const data = await getRegulatorAuditLog(params);
      setAuditEntries(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load autonomous regulator audit log.');
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'auditLog') {
      fetchAuditLog();
    }
  }, [activeTab, riskFilter, actionFilter, batchIdFilter]);

  const toggleExpand = (entryId) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchId) {
      toast.error('Please enter a batch serial number.');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await getBatch(searchId);
      setBatch(res);
      setManualBrief(null);
      toast.success(`Loaded details for batch #${searchId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || `Batch #${searchId} not found.`);
      setBatch(null);
    } finally {
      setLookupLoading(false);
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
      if (res.recallNotice) updated.recallNotice = res.recallNotice;
      setBatch(updated);
      setRecallReason('');
      fetchAuditLog();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'On-chain recall transaction failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualInvestigate = async () => {
    if (!batch) return;
    setInvestigationLoading(true);
    toast.loading('Groq AI Agent investigating custody logs...', { id: 'investigate' });

    try {
      const brief = await investigateBatch(batch.batchId);
      setManualBrief(brief);
      toast.dismiss('investigate');
      toast.success('Investigation brief generated!');
    } catch (err) {
      console.error(err);
      toast.dismiss('investigate');
      toast.error('Failed to run investigation agent.');
    } finally {
      setInvestigationLoading(false);
    }
  };

  const handleCopyNotice = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      toast.success('Recall notice copied!');
      setTimeout(() => setCopiedNotice(false), 3000);
    }
  };

  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act === 'recalled') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-red-600 text-white flex items-center">
          <AlertOctagon className="w-3 h-3 mr-1" />
          Recalled On-Chain
        </span>
      );
    }
    if (act === 'flagged_medium') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-500 text-white flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged Medium Risk
        </span>
      );
    }
    if (act === 'logged_low') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-600 text-white flex items-center">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Logged Low Risk
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-200 text-slate-700 flex items-center">
        Passive Alert Log
      </span>
    );
  };

  const getRiskBadge = (risk) => {
    const r = (risk || 'medium').toLowerCase();
    if (r === 'high') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">
          Risk: HIGH
        </span>
      );
    }
    if (r === 'low') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
          Risk: LOW
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
        Risk: MEDIUM
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-red-50 text-red-700 rounded border border-red-200 shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Autonomous AI Regulator — Audit Log & Transparency Terminal
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Real-time observational audit log of autonomous regulatory decisions. The AI Agent automatically runs multi-tool investigations, assesses risk, and signs on-chain recall transactions when major threats are detected — no human intervention required.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-300 pb-1">
        <button
          onClick={() => setActiveTab('auditLog')}
          className={`px-4 py-2 font-bold text-xs rounded-t transition-colors flex items-center space-x-1.5 ${
            activeTab === 'auditLog'
              ? 'bg-clinical-800 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Autonomous Audit Trail Log</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 font-bold text-xs rounded-t transition-colors flex items-center space-x-1.5 ${
            activeTab === 'manual'
              ? 'bg-clinical-800 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Manual Batch Lookup & Override</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AUTONOMOUS AUDIT LOG VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'auditLog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded p-4 border border-slate-300 doc-panel flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Audit Trail Filters:</span>
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-700 focus:ring-1 focus:ring-clinical-800 outline-none"
              >
                <option value="">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-700 focus:ring-1 focus:ring-clinical-800 outline-none"
              >
                <option value="">All Actions</option>
                <option value="recalled">Recalled On-Chain</option>
                <option value="flagged_medium">Flagged Medium Risk</option>
                <option value="logged_low">Logged Low Risk</option>
                <option value="passive_alert">Passive Alert</option>
              </select>

              <input
                type="number"
                placeholder="Filter by Batch ID"
                value={batchIdFilter}
                onChange={(e) => setBatchIdFilter(e.target.value)}
                className="w-36 px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-clinical-800 outline-none"
              />

              <button
                onClick={fetchAuditLog}
                disabled={logLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-clinical-900 font-semibold rounded border border-slate-300 flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${logLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Log</span>
              </button>
            </div>
          </div>

          {/* Log Loading Skeleton */}
          {logLoading && <SkeletonLoader type="card" />}

          {/* Empty Audit Log State */}
          {!logLoading && auditEntries.length === 0 && (
            <div className="bg-white rounded p-8 border border-slate-300 text-center space-y-2 doc-panel">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-display font-semibold text-sm text-clinical-900">
                No autonomous audit entries found
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No automatic regulatory actions have been logged yet under the selected filters. Triggering a major defect inspection will automatically generate real-time audit records here.
              </p>
            </div>
          )}

          {/* Audit Entries List */}
          {!logLoading && auditEntries.map((entry) => {
            const isExpanded = !!expandedEntries[entry.id];
            const dateStr = new Date(entry.timestamp * 1000).toLocaleString();
            const brief = entry.investigation_brief || {};
            const defects = entry.defect_report?.defects_found || [];

            return (
              <div key={entry.id} className="bg-white rounded border border-slate-300 doc-panel overflow-hidden">
                {/* Entry Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-bold text-sm text-clinical-900">
                      Batch #{entry.batch_id} Audit Log
                    </span>
                    {getActionBadge(entry.action_taken)}
                    {getRiskBadge(entry.risk_level)}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="font-mono">{dateStr}</span>
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="text-clinical-800 hover:underline font-semibold flex items-center"
                    >
                      <span>{isExpanded ? 'Collapse Trace' : 'Expand Full Audit Trace'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Body Summary */}
                <div className="p-4 space-y-3 text-xs">
                  {/* Defect Context */}
                  {entry.defect_report && (
                    <div className="p-3 bg-red-50/50 rounded border border-red-200 space-y-1">
                      <span className="font-bold text-red-900 block">Trigger: Major Physical Defect Inspection Flag</span>
                      <p className="text-slate-700">{entry.defect_report.recommendation}</p>
                      {defects.length > 0 && (
                        <div className="text-[11px] font-mono text-red-800 pt-1">
                          Defects: {defects.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Investigation Summary */}
                  <div>
                    <span className="font-bold text-slate-800 block">AI Multi-Step Investigation Summary:</span>
                    <p className="text-slate-700 leading-relaxed">{brief.summary || 'Investigation completed.'}</p>
                  </div>

                  {/* On-Chain Recall Details if Recalled */}
                  {entry.action_taken === 'recalled' && (
                    <div className="p-3 bg-red-600 text-white rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center">
                          <AlertOctagon className="w-4 h-4 mr-1" />
                          AUTONOMOUS ON-CHAIN RECALL EXECUTED
                        </span>
                        {entry.tx_hash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${entry.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white underline font-mono text-[11px] flex items-center hover:opacity-90"
                          >
                            <span>Tx: {entry.tx_hash.slice(0, 10)}...</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>

                      {entry.recall_notice && (
                        <div className="pt-2 border-t border-white/20">
                          <div className="flex items-center justify-between pb-1">
                            <span className="font-semibold text-[11px]">AI Recall Notice (Agent #2):</span>
                            <button
                              onClick={() => handleCopyNotice(entry.recall_notice)}
                              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded font-mono"
                            >
                              Copy Notice Text
                            </button>
                          </div>
                          <p className="font-mono text-[11px] whitespace-pre-wrap bg-black/20 p-2.5 rounded max-h-40 overflow-y-auto">
                            {entry.recall_notice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Technical Trace */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      {/* Findings List */}
                      {brief.findings && brief.findings.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">Detailed Findings:</span>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
                            {brief.findings.map((f, idx) => (
                              <li key={idx}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tool Call Trace */}
                      {brief.tool_trace && brief.tool_trace.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">Tool Execution Trajectory:</span>
                          <div className="bg-slate-900 text-slate-200 p-3 rounded font-mono text-[11px] space-y-1.5 overflow-x-auto">
                            {brief.tool_trace.map((t, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <span className="text-emerald-400 font-bold">[{idx + 1}] {t.tool}:</span>
                                <span className="text-slate-300">{JSON.stringify(t.args || {})} &rarr; {t.result_summary || 'executed'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MANUAL LOOKUP & OVERRIDE VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="bg-white rounded p-4 border border-slate-300 doc-panel flex gap-3">
            <input
              type="number"
              placeholder="Enter batch serial number (e.g. 1)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-clinical-800 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-5 py-2 bg-clinical-800 hover:bg-clinical-900 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect batch</span>
            </button>
          </form>

          {lookupLoading && <SkeletonLoader type="card" />}

          {!lookupLoading && !batch && (
            <div className="bg-white rounded p-8 border border-slate-300 text-center space-y-2 doc-panel">
              <p className="font-display font-semibold text-sm text-clinical-900">No batch selected</p>
              <p className="text-xs text-slate-500">Enter a batch serial number above for manual compliance check.</p>
            </div>
          )}

          {!lookupLoading && batch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded p-5 border border-slate-300 doc-panel space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-display font-bold text-clinical-900">{batch.drugName}</h3>
                      <span className="text-xs font-mono text-slate-600">{batch.batchNumber}</span>
                    </div>
                    <StatusBadge state={batch.state} stateName={batch.stateName} />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleManualInvestigate}
                      disabled={investigationLoading}
                      className="px-4 py-2 bg-clinical-800 hover:bg-clinical-900 text-white font-bold text-xs rounded transition-colors flex items-center space-x-1.5"
                    >
                      {investigationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      <span>Run AI Multi-Step Investigation</span>
                    </button>
                  </div>

                  {manualBrief && (
                    <div className="p-3 bg-slate-50 rounded border border-slate-300 space-y-2 text-xs">
                      <span className="font-bold block text-clinical-900">Manual AI Investigation Brief:</span>
                      <p className="text-slate-700">{manualBrief.summary}</p>
                    </div>
                  )}

                  {/* Manual Recall Form */}
                  {!batch.isRecalled && (
                    <form onSubmit={handleRecall} className="pt-3 border-t border-slate-200 space-y-3">
                      <label className="block text-xs font-semibold text-red-900">
                        Manual Regulatory Recall Override (On-Chain)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Enter official reason for recall order..."
                        value={recallReason}
                        onChange={(e) => setRecallReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-red-600 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded flex items-center justify-center space-x-1.5"
                      >
                        {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                        <span>Issue On-Chain Recall Order</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="bg-white rounded p-5 border border-slate-300 doc-panel">
                <CustodyTimeline history={batch.custodyHistory} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
