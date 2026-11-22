import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function CitationCard({ citation }) {
  const score = Math.round((citation.relevance_score || 0.8) * 100);

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 truncate">
          <FileText className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          <span className="truncate">{citation.candidate_name || citation.document_title}</span>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-2.5 h-2.5" />
          {score}% Match
        </span>
      </div>
      {citation.section && (
        <span className="inline-block px-1.5 py-0.5 mb-1.5 text-[10px] font-medium rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          Section: {citation.section}
        </span>
      )}
      <p className="text-slate-600 dark:text-slate-300 line-clamp-3 italic leading-relaxed">
        "{citation.snippet}"
      </p>
    </div>
  );
}
