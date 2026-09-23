import React from 'react';
import { Layers, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export default function StatStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-sm flex items-center space-x-3.5">
        <div className="p-3 bg-pharma-cream text-pharma-navy border border-slate-300 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 block">Total registered</span>
          <span className="text-lg font-extrabold text-pharma-navy font-display">42 batches</span>
        </div>
      </div>

      <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-sm flex items-center space-x-3.5">
        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
          <ArrowRightLeft className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 block">Custody logged</span>
          <span className="text-lg font-extrabold text-pharma-navy font-display">128 transfers</span>
        </div>
      </div>

      <div className="doc-panel bg-white/80 p-4 border border-slate-300 shadow-sm flex items-center space-x-3.5">
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 block">AI verifications</span>
          <span className="text-lg font-extrabold text-pharma-navy font-display">99.4% authenticity</span>
        </div>
      </div>
    </div>
  );
}
