import React from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

export default function ErrorPage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertOctagon className="h-7 w-7 text-rose-500" />
      </div>
      <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white">Analysis failed</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
        {message || 'Something went wrong while analyzing your feedback. Please check your API key and try again.'}
      </p>
      {onRetry && (
        <button type="button" className="btn-primary mt-6" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  )
}
