import React from 'react'
import { motion } from 'framer-motion'
import StatCards from './StatCards'
import PmSummary from './PmSummary'
import Charts from './Charts'
import IssueTable from './IssueTable'
import ExportButtons from './ExportButtons'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import ErrorPage from './ErrorPage'

export default function Dashboard({ status, data, error, onRetry }) {
  if (status === 'loading') return <LoadingSkeleton />
  if (status === 'error') return <ErrorPage message={error} onRetry={onRetry} />
  if (status === 'idle' || !data) return <EmptyState />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Feedback Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.stats.total_reviews} reviews analyzed into {data.clusters.length} prioritized issues
          </p>
        </div>
        <ExportButtons analysis={data} />
      </div>

      <StatCards stats={data.stats} />
      <PmSummary summary={data.pm_summary} />
      <Charts charts={data.charts} />
      <IssueTable clusters={data.clusters} />
    </motion.div>
  )
}
