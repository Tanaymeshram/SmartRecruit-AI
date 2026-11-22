import React from 'react';

export default function MatchScoreBadge({ score, size = 'md' }) {
  const numScore = parseFloat(score || 0);

  let colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
  if (numScore >= 80) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  } else if (numScore >= 65) {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
  } else if (numScore >= 45) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  }

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-base px-3.5 py-1.5 font-bold' 
    : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border shadow-2xs font-mono tracking-tight ${colorClasses} ${sizeClasses}`}>
      <span className="font-bold">{numScore.toFixed(0)}%</span>
      <span className="text-[10px] font-sans font-medium uppercase opacity-75">Match</span>
    </span>
  );
}
