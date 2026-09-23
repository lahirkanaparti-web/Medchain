import React from 'react';

const STATE_CONFIG = {
  0: { label: 'Manufactured', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' },
  1: { label: 'In transit', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' },
  2: { label: 'At distributor', bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-300' },
  3: { label: 'At pharmacy', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' },
  4: { label: 'Dispensed', bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-300' },
  5: { label: 'Recalled', bg: 'bg-rose-100', text: 'text-rose-950', border: 'border-rose-400 font-bold' },
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
      className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
}
