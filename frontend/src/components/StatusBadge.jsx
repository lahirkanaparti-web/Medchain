import React from 'react';

const STATE_CONFIG = {
  0: { label: 'Manufactured', bg: 'bg-clinical-50', text: 'text-clinical-900', border: 'border-clinical-200' },
  1: { label: 'In transit', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  2: { label: 'At distributor', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  3: { label: 'At pharmacy', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' },
  4: { label: 'Dispensed', bg: 'bg-genuine-50', text: 'text-genuine-700', border: 'border-genuine-200' },
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
}
