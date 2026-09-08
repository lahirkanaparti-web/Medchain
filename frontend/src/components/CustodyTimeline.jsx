import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ExternalLink, ShieldAlert, Circle, User } from 'lucide-react';
import StatusBadge from './StatusBadge';

const STAGES = [
  { state: 0, title: 'Manufactured', role: 'Manufacturer' },
  { state: 1, title: 'In Transit', role: 'Logistics Partner' },
  { state: 2, title: 'At Distributor', role: 'Distributor Warehouse' },
  { state: 3, title: 'At Pharmacy', role: 'Retail Pharmacy' },
  { state: 4, title: 'Dispensed', role: 'Patient Handover' },
];

export default function CustodyTimeline({ history = [], currentTxHash = null }) {
  // Map recorded events by state integer
  const eventMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(history)) {
      history.forEach((ev) => {
        map[ev.state] = ev;
      });
    }
    return map;
  }, [history]);

  // Determine current active state index
  const maxRecordedState = React.useMemo(() => {
    if (!history || history.length === 0) return -1;
    return Math.max(...history.map((h) => h.state));
  }, [history]);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-slate-200">
      {STAGES.map((stage, idx) => {
        const event = eventMap[stage.state];
        const isCompleted = event !== undefined;
        const isCurrent = stage.state === maxRecordedState;
        const isFuture = stage.state > maxRecordedState;

        const dateStr = event ? new Date(event.timestamp * 1000).toLocaleString() : null;

        return (
          <div key={stage.state} className="relative group">
            {/* Timeline Circle Node */}
            <div className="absolute -left-6 top-1 flex items-center justify-center">
              {isCurrent ? (
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-5 h-5 rounded-full bg-trust-500 border-2 border-white text-white flex items-center justify-center shadow-trust-glow ring-4 ring-trust-100 z-10"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
              ) : isCompleted ? (
                <div className="w-5 h-5 rounded-full bg-genuine-500 border-2 border-white text-white flex items-center justify-center shadow-sm z-10">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center z-10">
                  <Circle className="w-2.5 h-2.5 fill-slate-300 stroke-none" />
                </div>
              )}
            </div>

            {/* Event Card Content */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isCurrent
                  ? 'bg-trust-50/50 border-trust-500/40 shadow-soft ring-1 ring-trust-500/20'
                  : isCompleted
                  ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">{stage.title}</span>
                  <StatusBadge state={stage.state} stateName={stage.title} />
                </div>

                {dateStr && (
                  <div className="flex items-center text-[11px] text-slate-500 space-x-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>
                )}
              </div>

              {/* Custodian Address & Explorer Links */}
              {event ? (
                <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-mono">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-500">Custodian:</span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${event.custodian}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-trust-500 hover:text-trust-700 hover:underline flex items-center font-mono font-medium transition-colors"
                      title="Inspect wallet on Sepolia Etherscan"
                    >
                      <span>{truncateAddress(event.custodian)}</span>
                      <ExternalLink className="w-3 h-3 ml-1 shrink-0 opacity-70" />
                    </a>
                  </div>

                  {currentTxHash && isCurrent && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${currentTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <span>Tx: {currentTxHash.slice(0, 10)}...</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-400 italic">
                  Pending stage sequence confirmation
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
