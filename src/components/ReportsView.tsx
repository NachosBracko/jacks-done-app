import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Task, ProjectSummary } from '../types'
import { CATEGORY_LABEL } from '../types'
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

interface Props {
  tasks: Task[]
  projects: ProjectSummary[]
}

type SortKey = 'profit' | 'hourly' | 'recent'
type Range = 'month' | 'all'

function fmt(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function ReportsView({ tasks, projects }: Props) {
  const [range, setRange] = useState<Range>('month')
  const [sort, setSort] = useState<SortKey>('recent')

  const now = new Date()
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) }

  const inRange = (dateStr: string | null) => {
    if (!dateStr) return false
    try {
      return range === 'all' || isWithinInterval(parseISO(dateStr), monthInterval)
    } catch { return false }
  }

  const soldProjects = useMemo(() =>
    projects.filter(p => p.status === 'sold' && inRange(p.sold_at)),
    [projects, range]
  )

  const activeProjects = projects.filter(p => p.status === 'active')

  const sortedProjects = useMemo(() => {
    return [...soldProjects].sort((a, b) => {
      if (sort === 'profit') return (b.profit || 0) - (a.profit || 0)
      if (sort === 'hourly') return (b.hourly_rate || 0) - (a.hourly_rate || 0)
      return new Date(b.sold_at || 0).getTime() - new Date(a.sold_at || 0).getTime()
    })
  }, [soldProjects, sort])

  const totals = useMemo(() => ({
    revenue: soldProjects.reduce((s, p) => s + (p.sold_price || 0), 0),
    cost: soldProjects.reduce((s, p) => s + p.total_cost, 0),
    profit: soldProjects.reduce((s, p) => s + (p.profit || 0), 0),
    hours: soldProjects.reduce((s, p) => s + p.total_hours, 0),
  }), [soldProjects])

  const avgHourly = totals.hours > 0 ? totals.profit / totals.hours : 0

  const completedTasks = useMemo(() =>
    tasks.filter(t => t.status === 'done' && inRange(t.completed_at)),
    [tasks, range]
  )

  const tasksByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    completedTasks.forEach(t => { map[t.category] = (map[t.category] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [completedTasks])

  const activeInvested = activeProjects.reduce((s, p) => s + p.total_cost, 0)

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="grid grid-cols-2 gap-2 bg-gray-800 rounded-xl p-1">
        {(['month', 'all'] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${range === r ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>
            {r === 'month' ? 'Month to Date' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Money summary */}
      <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs font-black uppercase tracking-wide mb-3">
          Financials — {soldProjects.length} project{soldProjects.length !== 1 ? 's' : ''} sold
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Revenue" value={fmt(totals.revenue)} />
          <Stat label="Costs" value={fmt(totals.cost)} />
          <Stat label="Profit" value={fmt(totals.profit)} highlight={totals.profit >= 0 ? 'green' : 'red'} />
          <Stat label="Avg $/hr" value={totals.hours > 0 ? fmt(avgHourly) + '/hr' : '—'} highlight="yellow" />
        </div>
        <p className="text-gray-600 text-xs mt-2">{totals.hours.toFixed(1)} hours total</p>
      </div>

      {/* Active money tied up */}
      {activeInvested > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-orange-300 text-sm font-bold">Tied up in active projects</p>
            <p className="text-gray-500 text-xs">{activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''}</p>
          </div>
          <p className="text-white font-black text-xl">{fmt(activeInvested)}</p>
        </div>
      )}

      {/* Per-project breakdown */}
      {soldProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs font-black uppercase tracking-wide">By Project</p>
            <div className="flex gap-1">
              {([['profit','$ Profit'],['hourly','$/hr'],['recent','Recent']] as [SortKey,string][]).map(([s, label]) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${sort === s ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sortedProjects.map(p => (
              <div key={p.id} className="bg-gray-800/30 rounded-xl p-3 border border-gray-800">
                <div className="flex justify-between items-start">
                  <p className="text-white font-semibold text-sm flex-1 mr-2">{p.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {(p.profit || 0) >= 0 ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                    <span className={`font-black text-sm ${(p.profit||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(p.profit||0)}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>Cost {fmt(p.total_cost)}</span>
                  <span>{p.total_hours.toFixed(1)}h</span>
                  {p.hourly_rate != null && <span className="text-yellow-500 font-bold">{fmt(p.hourly_rate)}/hr</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks completed */}
      <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs font-black uppercase tracking-wide mb-3">Tasks Completed</p>
        <p className="text-white font-black text-3xl mb-3">{completedTasks.length}</p>
        {tasksByCategory.length > 0 ? (
          <div className="space-y-2">
            {tasksByCategory.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 shrink-0">{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] || cat}</span>
                <div className="h-2 bg-gray-700 rounded-full flex-1 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / completedTasks.length) * 100}%` }} />
                </div>
                <span className="text-white font-bold w-5 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No tasks completed yet</p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'yellow' }) {
  const color = highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : highlight === 'yellow' ? 'text-yellow-400' : 'text-white'
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`font-black text-xl ${color}`}>{value}</p>
    </div>
  )
}
