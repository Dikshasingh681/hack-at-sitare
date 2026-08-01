import React from 'react'
import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
        <Inbox className="h-7 w-7 text-brand-500" />
      </div>
      <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white">No analysis yet</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        Upload a feedback JSON file to generate a prioritized dashboard of issues, charts, and engineering tasks.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Upload feedback
      </Link>
    </div>
  )
}
