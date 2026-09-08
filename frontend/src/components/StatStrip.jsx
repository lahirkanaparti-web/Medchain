import React from 'react';
import { ShieldCheck, Layers, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export default function StatStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex items-center space-x-3.5">
        <div className="p-3 bg-trust-50 text-trust-500 rounded-xl border border-trust-100 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
          <span className="text-xl font-extrabold text-slate-900">42 Batches</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex items-center space-x-3.5">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
          <ArrowRightLeft className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custody Logged</span>
          <span className="text-xl font-extrabold text-slate-900">128 Transfers</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex items-center space-x-3.5">
        <div className="p-3 bg-genuine-50 text-genuine-600 rounded-xl border border-genuine-100 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Verifications</span>
          <span className="text-xl font-extrabold text-slate-900">99.4% Authenticity</span>
        </div>
      </div>
    </div>
  );
}
