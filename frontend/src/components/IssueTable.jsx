import React, { useMemo, useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'

const PAGE_SIZE = 8

const SEVERITY_BADGE = {
  Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  High: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Medium: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  Low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
}

const COLUMNS = [
  { key: 'issue', label: 'Issue' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'category', label: 'Category' },
  { key: 'severity', label: 'Severity' },
  { key: 'priority_score', label: 'Priority' },
  { key: 'business_impact', label: 'Business Impact' },
  { key: 'engineering_effort', label: 'Eng. Effort' },
  { key: 'confidence_score', label: 'Confidence' },
]

export default function IssueTable({ clusters }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [sortKey, setSortKey] = useState('priority_score')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(clusters.map((c) => c.category)))],
    [clusters]
  )
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low']

  const filtered = useMemo(() => {
    return clusters
      .filter((c) => (categoryFilter === 'All' ? true : c.category === categoryFilter))
      .filter((c) => (severityFilter === 'All' ? true : c.severity === severityFilter))
      .filter((c) => c.issue.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        if (typeof a[sortKey] === 'string') {
          return a[sortKey].localeCompare(b[sortKey]) * dir
        }
        return (a[sortKey] - b[sortKey]) * dir
      })
  }, [clusters, search, categoryFilter, severityFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-100">
          Issues ({filtered.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search issues…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-brand-400 outline-none w-44"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            className="text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-2 outline-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
            className="text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-2 outline-none"
          >
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-y border-slate-200 dark:border-white/10">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-5 py-2.5 font-medium whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((cluster) => (
              <tr key={cluster.cluster_id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <td className="px-5 py-3 max-w-xs">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{cluster.issue}</p>
                  {cluster.root_cause && (
                    <p className="text-xs text-slate-400 truncate">{cluster.root_cause}</p>
                  )}
                </td>
                <td className="px-5 py-3 tabular-nums">{cluster.frequency}</td>
                <td className="px-5 py-3 whitespace-nowrap">{cluster.category}</td>
                <td className="px-5 py-3">
                  <span className={`badge ${SEVERITY_BADGE[cluster.severity] || ''}`}>{cluster.severity}</span>
                </td>
                <td className="px-5 py-3 tabular-nums font-semibold">{cluster.priority_score}</td>
                <td className="px-5 py-3 tabular-nums">{cluster.business_impact}/10</td>
                <td className="px-5 py-3 whitespace-nowrap">{cluster.engineering_effort}</td>
                <td className="px-5 py-3 tabular-nums">{Math.round(cluster.confidence_score * 100)}%</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-5 py-10 text-center text-slate-400">
                  No issues match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <p className="text-slate-400">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
