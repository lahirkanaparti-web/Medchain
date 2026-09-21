import React, { useState } from 'react';
import { CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, User, MapPin, AlertOctagon, Sparkles } from 'lucide-react';
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

  const recallEvent = eventMap[5]; // Recalled state

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

      {/* Recall Alert Banner inside Timeline if Recalled */}
      {recallEvent && (
        <div className="p-3 bg-red-50 border border-red-300 rounded text-xs text-red-900 flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider">Batch Recalled:</span>
            <span className="ml-1">
              On {new Date(recallEvent.timestamp * 1000).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-slate-300">
        {PHYSICAL_STAGES.map((stage, idx) => {
          const event = eventMap[stage.state];
          const isCompleted = event !== undefined;
          const isCurrent = stage.state === maxRecordedState && !recallEvent;
          const isExpanded = !!expandedStates[stage.state];

          const dateStr = event ? new Date(event.timestamp * 1000).toLocaleString() : null;
          const sequenceNumber = idx + 1;
          const hasLocation = event && event.latitude && event.longitude;

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

                    {/* Geolocation Pin Indicator */}
                    {hasLocation && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        GPS Logged
                      </span>
                    )}

                    {/* AI Defect Checkpoint Indicator */}
                    {(stage.state === 2 || stage.state === 3) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-clinical-50 text-clinical-800 border border-clinical-200">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        AI Defect Checkpoint
                      </span>
                    )}
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
                      <div className="flex items-center space-x-1.5">
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
                    </div>

                    {/* Geolocation Row */}
                    {hasLocation ? (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 font-medium flex items-center">
                          <MapPin className="w-3 h-3 text-emerald-600 mr-1" />
                          Geolocation Coordinates:
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline flex items-center font-mono text-[11px] font-semibold"
                        >
                          <span>{event.latitude}, {event.longitude}</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Geolocation:</span>
                        <span className="italic">Not provided (optional)</span>
                      </div>
                    )}

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
