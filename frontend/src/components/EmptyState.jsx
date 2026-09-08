import React from 'react';
import { PackageSearch, Search } from 'lucide-react';

export default function EmptyState({ title = "No Batch Loaded", description = "Enter a Batch ID above or scan a QR code to inspect on-chain custody details.", actionText = null, onAction = null }) {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-soft text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 bg-trust-50 text-trust-500 rounded-2xl flex items-center justify-center mx-auto border border-trust-100 shadow-sm">
        <PackageSearch className="w-8 h-8 stroke-[1.75]" />
      </div>
      <div>
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-trust-500 hover:bg-trust-600 text-white font-semibold text-xs rounded-xl shadow transition-all inline-flex items-center space-x-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
