import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import Dashboard from './components/Dashboard'
import { useAnalysis } from './hooks/useAnalysis'
import { useToast } from './context/ToastContext'
import { getErrorMessage } from './api/client'

function UploadPage({ analysis }) {
  const navigate = useNavigate()
  const toast = useToast()

  const handleAnalyze = async (reviews) => {
    try {
      await analysis.runAnalysis(reviews)
      toast.success('Analysis complete')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="inline-block text-xs font-semibold tracking-wide uppercase text-brand-500 bg-brand-500/10 rounded-full px-3 py-1 mb-4">
          AI Product Manager Copilot
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Turn raw feedback into a prioritized backlog
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          Upload customer reviews as JSON. CursorPM clusters duplicates, scores priority, and
          drafts engineering-ready tickets — in seconds.
        </p>
      </div>
      <UploadZone onAnalyze={handleAnalyze} isAnalyzing={analysis.status === 'loading'} />
    </div>
  )
}

function DashboardPage({ analysis }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Dashboard
        status={analysis.status}
        data={analysis.data}
        error={analysis.error}
        onRetry={() => analysis.reset()}
      />
    </div>
  )
}

export default function App() {
  const analysis = useAnalysis()

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<UploadPage analysis={analysis} />} />
          <Route path="/dashboard" element={<DashboardPage analysis={analysis} />} />
        </Routes>
      </main>
    </div>
  )
}
