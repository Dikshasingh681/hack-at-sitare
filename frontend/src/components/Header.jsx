import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-surface-dark/70 border-b border-slate-200/70 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(41,85,245,0.6)] group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-semibold text-slate-900 dark:text-white text-sm">CursorPM</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
              AI Product Manager Copilot
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`btn-ghost text-sm ${location.pathname === '/' ? 'text-brand-600 dark:text-brand-300' : ''}`}
          >
            Upload
          </Link>
          <Link
            to="/dashboard"
            className={`btn-ghost text-sm ${location.pathname === '/dashboard' ? 'text-brand-600 dark:text-brand-300' : ''}`}
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="ml-2 h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  )
}
