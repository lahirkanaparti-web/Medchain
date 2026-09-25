import React, { useState, useEffect } from 'react';
import { Layers, ArrowRightLeft, ShieldCheck, ShieldAlert, Activity, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { getSystemMetrics } from '../api/client';

// Lightweight requestAnimationFrame count-up hook
function CountUpNumber({ end = 0, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(end) || 0;
    if (target === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(easeProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

// Custom Recharts Tooltip styled to match design tokens in Light and Dark mode
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 shadow-xl font-mono text-xs text-slate-900 dark:text-slate-100 space-y-1 rounded-none">
        <p className="font-bold text-slate-900 dark:text-white font-display">{label || payload[0].name}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-[11px]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color || item.fill }}
            />
            <span className="text-slate-600 dark:text-slate-300 capitalize">{item.name}:</span>
            <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnimatedMetrics() {
  const [metrics, setMetrics] = useState({
    totalBatches: 42,
    totalTransfers: 128,
    totalVerifications: 156,
    totalAlerts: 4,
    verdictBreakdown: [
      { name: 'Genuine', value: 34, color: '#10B981' },
      { name: 'Needs review', value: 6, color: '#F59E0B' },
      { name: 'Suspect', value: 2, color: '#F43F5E' },
    ],
    dailyTrends: [
      { day: 'Mon', verifications: 14, transfers: 22 },
      { day: 'Tue', verifications: 18, transfers: 29 },
      { day: 'Wed', verifications: 12, transfers: 19 },
      { day: 'Thu', verifications: 24, transfers: 38 },
      { day: 'Fri', verifications: 21, transfers: 31 },
      { day: 'Sat', verifications: 15, transfers: 20 },
      { day: 'Sun', verifications: 19, transfers: 25 },
    ],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getSystemMetrics()
      .then((data) => {
        if (isMounted && data) {
          setMetrics(data);
        }
      })
      .catch((err) => {
        console.warn('Using fallback local metrics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-pharma-navy dark:text-emerald-400" />
          <h2 className="font-display font-bold text-base text-pharma-navy dark:text-white">
            Live system performance & metrics
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center">
          <TrendingUp className="w-3 h-3 text-seal-emerald dark:text-emerald-400 mr-1" /> Real-time backend feed
        </span>
      </div>

      {/* 1. Animated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-pharma-cream text-pharma-navy border border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total batches created</span>
            <span className="text-xl font-extrabold text-pharma-navy dark:text-white font-mono">
              <CountUpNumber end={metrics.totalBatches} />
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-sky-50 text-sky-900 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Custody transfers logged</span>
            <span className="text-xl font-extrabold text-pharma-navy dark:text-white font-mono">
              <CountUpNumber end={metrics.totalTransfers} />
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-seal-emerald border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Verifications run</span>
            <span className="text-xl font-extrabold text-pharma-navy dark:text-white font-mono">
              <CountUpNumber end={metrics.totalVerifications} />
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-rose-50 text-quarantine-crimson border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Alerts & recalls</span>
            <span className="text-xl font-extrabold text-quarantine-crimson dark:text-rose-400 font-mono">
              <CountUpNumber end={metrics.totalAlerts} />
            </span>
          </div>
        </div>
      </div>

      {/* 2. Recharts Trend & Verdict Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart: Daily Activity */}
        <div className="lg:col-span-2 doc-panel bg-white/80 p-4 border border-slate-300 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="font-display font-bold text-xs text-pharma-navy dark:text-white">
              Weekly verifications & custody activity
            </h4>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Last 7 days</span>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                {/* High contrast vibrant column fills */}
                <Bar dataKey="verifications" name="Verifications" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="transfers" name="Custody transfers" fill="#38BDF8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="w-2.5 h-2.5 bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Verifications</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="w-2.5 h-2.5 bg-sky-400 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Custody transfers</span>
            </div>
          </div>
        </div>

        {/* Donut / Pie Chart: Tiered Verdict Breakdown */}
        <div className="doc-panel bg-white/80 p-4 border border-slate-300 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="font-display font-bold text-xs text-pharma-navy dark:text-white">
              AI verdict distribution
            </h4>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Tiered status</span>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.verdictBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {metrics.verdictBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Ring Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-pharma-navy dark:text-white font-mono">
                {metrics.verdictBreakdown.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                Audited
              </span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
            {metrics.verdictBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}:</span>
                </div>
                <span className="font-bold text-pharma-navy dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
