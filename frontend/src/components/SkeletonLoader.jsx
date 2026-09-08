import React from 'react';

export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'timeline') {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
            <div className="w-5 h-5 bg-slate-300 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-slate-300 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'verdict') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl border border-slate-300" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-slate-200 rounded-xl" />
          <div className="h-48 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="h-6 w-24 bg-slate-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}
