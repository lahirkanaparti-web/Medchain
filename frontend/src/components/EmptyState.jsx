import React from 'react';
import { PackageSearch, Search } from 'lucide-react';

export default function EmptyState({ title = "No batch loaded", description = "Enter a batch ID above or scan a QR code to inspect on-chain custody details.", actionText = null, onAction = null }) {
  return (
    <div className="doc-panel bg-white/80 p-8 sm:p-12 border border-slate-300 text-center max-w-md mx-auto space-y-4 shadow-sm rounded-none">
      <div className="w-14 h-14 bg-pharma-cream text-pharma-navy flex items-center justify-center mx-auto border border-slate-300">
        <PackageSearch className="w-7 h-7 stroke-[1.75]" />
      </div>
      <div>
        <h3 className="font-display font-bold text-base text-pharma-navy">{title}</h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-pharma-navy hover:bg-pharma-deep text-white font-medium text-xs shadow-sm transition-all inline-flex items-center space-x-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
