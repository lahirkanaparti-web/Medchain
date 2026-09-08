import React, { useState } from 'react';
import { CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, User, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';

const PHYSICAL_STAGES = [
  { state: 0, title: 'Registered by manufacturer', role: 'Origin facility' },
  { state: 1, title: 'In transit to distributor', role: 'Logistics handoff' },
  { state: 2, title: 'Received at distributor warehouse', role: 'Wholesale inventory' },
  { state: 3, title: 'Received at pharmacy', role: 'Dispensing point' },
  { state: 4, title: 'Dispensed to patient', role: 'Final patient handover' },
];

export default function CustodyTimeline({ history = [], currentTxHash = null }) {
  const [expandedStates, setExpandedStates] = useState({ 0: true });

  const toggleExpand = (stateInt) => {
    setExpandedStates((prev) => ({
      ...prev,
      [stateInt]: !prev[stateInt],
    }));
  };

  const eventMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(history)) {
      history.forEach((ev) => {
        map[ev.state] = ev;
      });
    }
    return map;
  }, [history]);

  const maxRecordedState = React.useMemo(() => {
    if (!history || history.length === 0) return -1;
    return Math.max(...history.map((h) => h.state));
  }, [history]);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="font-display font-bold text-sm text-clinical-900 flex items-center">
          <MapPin className="w-4 h-4 text-clinical-800 mr-1.5" />
          Physical supply chain custody manifest
        </h4>
        <span className="text-xs text-slate-500">Click stage to expand details</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-slate-300">
        {PHYSICAL_STAGES.map((stage, idx) => {
          const event = eventMap[stage.state];
          const isCompleted = event !== undefined;
          const isCurrent = stage.state === maxRecordedState;
          const isExpanded = !!expandedStates[stage.state];

          const dateStr = event ? new Date(event.timestamp * 1000).toLocaleString() : null;
          const sequenceNumber = idx + 1;

          return (
            <div key={stage.state} className="relative">
              {/* Sequence Marker Badge */}
              <div className="absolute -left-6 top-1 flex items-center justify-center">
                {isCompleted ? (
                  <div className="w-5 h-5 rounded-full bg-genuine-600 border border-white text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                    {sequenceNumber}
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 text-slate-500 font-semibold text-[10px] flex items-center justify-center">
                    {sequenceNumber}
                  </div>
                )}
              </div>

              {/* Stage Card */}
              <div
                className={`rounded border transition-colors ${
                  isCurrent
                    ? 'bg-white border-clinical-800 shadow-sm'
                    : isCompleted
                    ? 'bg-white border-slate-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Header row click to expand */}
                <div
                  onClick={() => isCompleted && toggleExpand(stage.state)}
                  className={`p-3 flex items-center justify-between cursor-pointer select-none ${
                    isCompleted ? 'hover:bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-clinical-900">{stage.title}</span>
                    <StatusBadge state={stage.state} stateName={stage.title} />
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {dateStr && (
                      <span className="text-[11px] text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 text-slate-400 mr-1" />
                        {dateStr}
                      </span>
                    )}
                    {isCompleted && (
                      <button type="button" className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Details Drawer */}
                {isCompleted && isExpanded && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 font-medium">Custodian wallet:</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${event.custodian}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-clinical-800 hover:underline flex items-center font-mono"
                      >
                        <User className="w-3 h-3 text-slate-400 mr-1" />
                        <span>{truncateAddress(event.custodian)}</span>
                        <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                      </a>
                    </div>

                    {event.blockNumber && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 font-medium">Sepolia block height:</span>
                        <span className="font-mono text-slate-800">#{event.blockNumber}</span>
                      </div>
                    )}

                    {currentTxHash && isCurrent && (
                      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                        <span className="text-slate-500 font-medium">Transaction hash:</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${currentTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline flex items-center font-mono text-[11px]"
                        >
                          <span>{currentTxHash.slice(0, 14)}...</span>
                          <ExternalLink className="w-3 h-3 ml-1 text-emerald-600" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
