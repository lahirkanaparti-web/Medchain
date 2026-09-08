import React from 'react';

const STATE_CONFIG = {
  0: { label: 'Manufactured', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  1: { label: 'In Transit', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  2: { label: 'At Distributor', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  3: { label: 'At Pharmacy', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  4: { label: 'Dispensed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
};

export default function StatusBadge({ state, stateName }) {
  const config = STATE_CONFIG[state] || {
    label: stateName || `State ${state}`,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.label}
    </span>
  );
}
