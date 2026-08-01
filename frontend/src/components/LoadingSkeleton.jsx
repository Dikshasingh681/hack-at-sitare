import React from 'react'

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton h-6 w-12 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-4">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-56 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="card p-5 space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-full rounded" />
        ))}
      </div>
      <p className="text-center text-sm text-slate-400">Analyzing feedback with AI — this can take a moment…</p>
    </div>
  )
}
