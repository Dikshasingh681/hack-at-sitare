import React from 'react'
import { NotebookPen } from 'lucide-react'

export default function PmSummary({ summary }) {
  if (!summary) return null
  return (
    <div className="card p-5 border-l-4 border-l-brand-500">
      <div className="flex items-center gap-2 mb-2">
        <NotebookPen className="h-4 w-4 text-brand-500" />
        <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-100">PM Summary</h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{summary}</p>
    </div>
  )
}
