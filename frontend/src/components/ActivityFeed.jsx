import React, { useState, useEffect } from 'react';
import { Radio, Factory, ArrowRightLeft, ShieldCheck, ShieldAlert, AlertTriangle, Layers, Clock, RefreshCw } from 'lucide-react';
import { getActivityFeed } from '../api/client';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - timestamp);
  if (diff < 30) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEventIcon(type, level) {
  switch (type) {
    case 'batch_created':
      return <Factory className="w-3.5 h-3.5 text-pharma-navy shrink-0" />;
    case 'custody_transferred':
      return <ArrowRightLeft className="w-3.5 h-3.5 text-sky-900 shrink-0" />;
    case 'verification_genuine':
      return <ShieldCheck className="w-3.5 h-3.5 text-seal-emerald shrink-0" />;
    case 'batch_recalled':
      return <ShieldAlert className="w-3.5 h-3.5 text-quarantine-crimson shrink-0" />;
    case 'alert_raised':
    default:
      return level === 'warning' ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      ) : (
        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      );
  }
}

export default function ActivityFeed({ limit = 12, autoPoll = true }) {
  const [feed, setFeed] = useState([
    {
      id: 'init_1',
      type: 'verification_genuine',
      batchId: 1,
      description: 'Batch #1 verified — genuine packaging match (98.4% confidence)',
      timestamp: Math.floor(Date.now() / 1000) - 120,
      badge: 'Genuine',
      level: 'success',
    },
    {
      id: 'init_2',
      type: 'custody_transferred',
      batchId: 2,
      description: 'Batch #2 custody transferred to Pharmacy inventory',
      timestamp: Math.floor(Date.now() / 1000) - 450,
      badge: 'At pharmacy',
      level: 'info',
    },
    {
      id: 'init_3',
      type: 'batch_created',
      batchId: 3,
      description: 'Batch #3 registered by Manufacturer (Amoxicillin 500mg)',
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      badge: 'Manufactured',
      level: 'success',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await getActivityFeed(limit);
      if (Array.isArray(data) && data.length > 0) {
        setFeed(data);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      console.warn('Using existing feed state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();

    if (!autoPoll) return;

    // Polling every 12 seconds
    const interval = setInterval(() => {
      loadFeed();
    }, 12000);

    return () => clearInterval(interval);
  }, [limit, autoPoll]);

  return (
    <div className="doc-panel bg-white/80 p-4 border border-slate-300 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seal-emerald opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-seal-emerald" />
          </span>
          <h3 className="font-display font-bold text-xs text-pharma-navy">
            Live system activity stream
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
          <span>Polls every 12s</span>
          <button
            type="button"
            onClick={loadFeed}
            disabled={loading}
            className="text-slate-400 hover:text-pharma-navy transition-colors"
            title="Refresh stream now"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scrollable Single-Line Activity Feed */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {feed.map((item) => {
          const relativeTime = formatRelativeTime(item.timestamp);
          const icon = getEventIcon(item.type, item.level);

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 hover:bg-slate-50 border border-slate-200/60 rounded-none text-xs transition-colors group"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="p-1 bg-slate-100 border border-slate-200 rounded-none">
                  {icon}
                </div>
                <span className="truncate text-slate-800 font-medium text-[11px] group-hover:text-pharma-navy">
                  {item.description}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px]">
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-none font-semibold border ${
                      item.level === 'error'
                        ? 'bg-rose-50 text-quarantine-crimson border-rose-300'
                        : item.level === 'warning'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : item.level === 'success'
                        ? 'bg-emerald-50 text-seal-emerald border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <span className="text-slate-500 flex items-center">
                  <Clock className="w-2.5 h-2.5 text-slate-400 mr-0.5" />
                  {relativeTime}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
        <span>Showing {feed.length} recent system events</span>
        <span>Aggregated blockchain & AI logs</span>
      </div>
    </div>
  );
}
