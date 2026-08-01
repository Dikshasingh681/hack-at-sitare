import React, { useState } from 'react'
import { FileJson, FileSpreadsheet, FileText, ListChecks, Loader2 } from 'lucide-react'
import { exportAnalysis, getErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'

const EXPORTS = [
  { format: 'json', label: 'analysis.json', icon: FileJson },
  { format: 'csv', label: 'analysis.csv', icon: FileSpreadsheet },
  { format: 'xlsx', label: 'analysis.xlsx', icon: FileSpreadsheet },
  { format: 'prd', label: 'PRD.md', icon: FileText },
  { format: 'tasks', label: 'EngineeringTasks.json', icon: ListChecks },
]

export default function ExportButtons({ analysis }) {
  const [pending, setPending] = useState(null)
  const toast = useToast()

  const handleExport = async (format) => {
    setPending(format)
    try {
      await exportAnalysis(format, analysis)
      toast.success(`Downloaded ${EXPORTS.find((e) => e.format === format).label}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EXPORTS.map(({ format, label, icon: Icon }) => (
        <button
          key={format}
          type="button"
          className="btn-secondary text-xs"
          onClick={() => handleExport(format)}
          disabled={pending !== null}
        >
          {pending === format ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
          {label}
        </button>
      ))}
    </div>
  )
}
