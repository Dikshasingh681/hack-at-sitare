import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const SEVERITY_COLORS = {
  Critical: '#e11d48',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#94a3b8',
}

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Neutral: '#94a3b8',
  Negative: '#e11d48',
}

const CATEGORY_PALETTE = ['#2955f5', '#7c3aed', '#0891b2', '#f59e0b', '#e11d48', '#10b981', '#ec4899', '#64748b', '#f97316']

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.2)',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
}

export default function Charts({ charts }) {
  if (!charts) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Category Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.category_distribution} layout="vertical" margin={{ left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.1} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {charts.category_distribution.map((entry, index) => (
                <Cell key={entry.label} fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Severity Breakdown">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={charts.severity_distribution}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {charts.severity_distribution.map((entry) => (
                <Cell key={entry.label} fill={SEVERITY_COLORS[entry.label] || '#94a3b8'} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sentiment Split">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={charts.sentiment_distribution}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {charts.sentiment_distribution.map((entry) => (
                <Cell key={entry.label} fill={SENTIMENT_COLORS[entry.label] || '#94a3b8'} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Priority Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.priority_distribution} margin={{ left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#2955f5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
