import React, { useState } from 'react';
import { Clock, ExternalLink, ChevronDown, ChevronUp, User, MapPin, AlertOctagon, Sparkles, List, Navigation } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CustodyMap from './CustodyMap';

const PHYSICAL_STAGES = [
  { state: 0, title: 'Registered by manufacturer', role: 'Origin facility' },
  { state: 1, title: 'In transit to distributor', role: 'Logistics handoff' },
  { state: 2, title: 'Received at distributor warehouse', role: 'Wholesale inventory' },
  { state: 3, title: 'Received at pharmacy', role: 'Dispensing point' },
  { state: 4, title: 'Dispensed to patient', role: 'Final patient handover' },
];

export default function CustodyTimeline({ history = [], currentTxHash = null }) {
  const [expandedStates, setExpandedStates] = useState({ 0: true });
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'timeline' | 'map'

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
    <div className="space-y-4">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
        <h4 className="font-display font-bold text-xs text-pharma-navy flex items-center">
          <MapPin className="w-3.5 h-3.5 text-pharma-navy mr-1.5" />
          Chain of custody & spatial tracking
        </h4>

        <div className="inline-flex bg-slate-200/80 p-0.5 border border-slate-300 self-start sm:self-auto text-[11px] font-medium font-mono">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2 py-1 transition-colors ${
              viewMode === 'both' ? 'bg-white text-pharma-navy font-bold shadow-xs' : 'text-slate-600 hover:text-pharma-navy'
            }`}
          >
            Combined view
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
              viewMode === 'map' ? 'bg-white text-pharma-navy font-bold shadow-xs' : 'text-slate-600 hover:text-pharma-navy'
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
              viewMode === 'timeline' ? 'bg-white text-pharma-navy font-bold shadow-xs' : 'text-slate-600 hover:text-pharma-navy'
            }`}
          >
            <List className="w-3 h-3" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Recall Alert Banner inside Timeline if Recalled */}
      {recallEvent && (
        <div className="p-3 bg-quarantine-crimson text-white rounded-none text-xs space-y-1 shadow-xs">
          <div className="flex items-center space-x-2 font-bold uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-white shrink-0" />
            <span>Batch recalled autonomously on-chain</span>
          </div>
          <p className="text-[11px] text-white/90 font-mono">
            Recall timestamp: {new Date(recallEvent.timestamp * 1000).toLocaleString()}
          </p>
        </div>
      )}

      {/* Live Custody Route Map (Phase A) */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <CustodyMap history={history} />
      )}

      {/* Chronological List Timeline Manifest */}
      {(viewMode === 'both' || viewMode === 'timeline') && (
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
                    <div className="w-5 h-5 rounded-full bg-seal-emerald border border-white text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                      {sequenceNumber}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 text-slate-500 font-semibold text-[10px] flex items-center justify-center font-mono">
                      {sequenceNumber}
                    </div>
                  )}
                </div>

                {/* Stage Card */}
                <div
                  className={`border transition-colors ${
                    isCurrent
                      ? 'bg-white border-pharma-navy shadow-xs'
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
                      <span className="font-semibold text-xs text-pharma-navy">{stage.title}</span>
                      <StatusBadge state={stage.state} stateName={stage.title} />

                      {/* Geolocation Pin Indicator */}
                      {hasLocation ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-seal-emerald border border-emerald-200 font-mono">
                          <MapPin className="w-2.5 h-2.5 mr-0.5" />
                          GPS Logged
                        </span>
                      ) : (
                        isCompleted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 font-mono italic">
                            No GPS
                          </span>
                        )
                      )}

                      {/* AI Defect Checkpoint Indicator */}
                      {(stage.state === 2 || stage.state === 3) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-pharma-cream text-pharma-navy border border-slate-300 font-mono">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          AI Checkpoint
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {dateStr && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center">
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
                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 font-medium">Custodian wallet:</span>
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={`https://sepolia.etherscan.io/address/${event.custodian}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pharma-navy hover:underline flex items-center font-mono"
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
                            <MapPin className="w-3 h-3 text-seal-emerald mr-1" />
                            GPS Coordinates:
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-seal-emerald hover:underline flex items-center font-mono text-[11px] font-semibold"
                          >
                            <span>{event.latitude}, {event.longitude}</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Location data:</span>
                          <span className="italic">Location data not available for this step</span>
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
                            className="text-seal-emerald hover:underline flex items-center font-mono text-[11px]"
                          >
                            <span>{currentTxHash.slice(0, 14)}...</span>
                            <ExternalLink className="w-3 h-3 ml-1 text-seal-emerald" />
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
      )}
    </div>
  );
}
