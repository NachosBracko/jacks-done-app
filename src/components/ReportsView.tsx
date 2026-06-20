import { useState, useMemo } from 'react'
import type { Task, ProjectSummary } from '../types'
import { format, parseISO, isSameMonth, startOfMonth } from 'date-fns'

interface Props {
  tasks: Task[]
  projects: ProjectSummary[]
}

function fmt(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function ReportsView({ tasks, projects }: Props) {
  const [range, setRange] = useState<'month' | 'all'>('month')

  const soldProjects = useMemo(() => {
    const filtered = projects.filter((p) => p.status === 'sold' && p.sold_at)
    if (range === 'all') return filtered
    const now = new Date()
    return filtered.filter((p) => isSameMonth(parseISO(p.sold_at!), now))
  }, [projects, range])

  const totals = useMemo(() => {
    const revenue = soldProjects.reduce((s, p) => s + (p.sold_price || 0), 0)
    const cost = soldProjects.reduce((s, p) => s + p.total_cost, 0)
    const profit = soldProjects.reduce((s, p) => s + (p.profit || 0), 0)
    const hours = soldProjects.reduce((s, p) => s + p.time_logs.reduce((a, t) => a + t.hours, 0), 0)
    const avgHourly = hours > 0 ? profit / hours : 0
    return { revenue, cost, profit, hours, avgHourly }
  }, [soldProjects])

  const taskStats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'done' && t.completed_at)
    const inRange = range === 'all'
      ? completed
      : completed.filter((t) => isSameMonth(parseISO(t.completed_at!), new Date()))

    const byCategory: Record<string, number> = {}
    inRange.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    })
    return { count: inRange.length, byCategory }
  }, [tasks, range])

  const activeInvested = useMemo(() => {
    return projects.filter((p) => p.status === 'active').reduce((s, p) => s + p.total_cost, 0)
  }, [projects])

  return (
    <div className="space-y-5">
      {/* Range toggle */}
      <div className="grid grid-cols-2 gap-2 bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setRange('month')}
          className={`py-2.5 rounded-lg text-sm font-bold ${range === 'month' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
        >
          This Month
        </button>
        <button
          onClick={() => setRange('all')}
          className={`py-2.5 rounded-lg text-sm font-bold ${range === 'all' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
        >
          All Time
        </button>
      </div>

      <p className="text-gray-500 text-xs">{range === 'month' ? format(startOfMonth(new Date()), 'MMMM yyyy') : 'All time'}</p>

      {/* Money summary */}
      <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">Car Flip Money</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs">Revenue</p>
            <p className="text-white font-black text-xl">{fmt(totals.revenue)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Costs</p>
            <p className="text-white font-black text-xl">{fmt(totals.cost)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Profit</p>
            <p className={`font-black text-xl ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(totals.profit)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Avg hourly rate</p>
            <p className="text-yellow-400 font-black text-xl">{totals.hours > 0 ? fmt(totals.avgHourly) + '/hr' : '—'}</p>
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-3">{soldProjects.length} car{soldProjects.length !== 1 ? 's' : ''} sold · {totals.hours.toFixed(1)} hours logged</p>
      </div>

      {/* Currently invested */}
      {activeInvested > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-orange-300 text-sm font-medium">Currently invested in active projects</p>
          <p className="text-white font-black text-lg">{fmt(activeInvested)}</p>
        </div>
      )}

      {/* Per-project breakdown */}
      {soldProjects.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">By Project</p>
          <div className="space-y-2">
            {soldProjects.map((p) => (
              <div key={p.id} className="bg-gray-800/30 rounded-xl p-3 border border-gray-800">
                <div className="flex justify-between items-center">
                  <p className="text-white font-semibold text-sm">{p.title}</p>
                  <span className={`font-bold text-sm ${(p.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(p.profit || 0)}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>{p.time_logs.reduce((a, t) => a + t.hours, 0).toFixed(1)}h</span>
                  {p.hourly_rate != null && <span className="text-yellow-500">{fmt(p.hourly_rate)}/hr</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks by category */}
      <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">Tasks Completed</p>
        <p className="text-white font-black text-2xl mb-3">{taskStats.count}</p>
        {Object.keys(taskStats.byCategory).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(taskStats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{cat}</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="h-1.5 bg-gray-700 rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / taskStats.count) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-white font-bold w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No tasks completed in this period</p>
        )}
      </div>
    </div>
  )
}
