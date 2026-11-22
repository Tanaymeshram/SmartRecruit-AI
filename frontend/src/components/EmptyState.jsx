import React from 'react';
import { FolderSearch } from 'lucide-react';

export default function EmptyState({
  title = "No records found",
  description = "Get started by creating a new entry or adjusting your filters.",
  actionLabel,
  onAction,
  icon: Icon = FolderSearch
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
