import React from 'react'
import { motion } from 'framer-motion'
import { Layers, AlertTriangle, ArrowUpCircle, Bug, Lightbulb, Gauge } from 'lucide-react'

const CARD_DEFS = [
  { key: 'total_reviews', label: 'Total Reviews', icon: Layers, accent: 'text-brand-500 bg-brand-500/10' },
  { key: 'critical_issues', label: 'Critical Issues', icon: AlertTriangle, accent: 'text-rose-500 bg-rose-500/10' },
  { key: 'high_priority', label: 'High Priority', icon: ArrowUpCircle, accent: 'text-amber-500 bg-amber-500/10' },
  { key: 'bugs', label: 'Bugs', icon: Bug, accent: 'text-orange-500 bg-orange-500/10' },
  { key: 'feature_requests', label: 'Feature Requests', icon: Lightbulb, accent: 'text-violet-500 bg-violet-500/10' },
  { key: 'performance_issues', label: 'Performance Issues', icon: Gauge, accent: 'text-cyan-500 bg-cyan-500/10' },
]

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARD_DEFS.map((def, index) => {
        const Icon = def.icon
        return (
          <motion.div
            key={def.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="card p-4"
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${def.accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
              {stats[def.key] ?? 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{def.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
