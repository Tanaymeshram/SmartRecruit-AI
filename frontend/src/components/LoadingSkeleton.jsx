import React from 'react';

export default function LoadingSkeleton({ lines = 4 }) {
  return (
    <div className="w-full p-6 space-y-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
