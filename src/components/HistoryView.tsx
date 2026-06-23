import { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import type { Task, ProjectSummary, ProjectType } from '../types'
import { CATEGORY_LABEL, PROJECT_TYPE_LABEL } from '../types'
import { format, parseISO } from 'date-fns'
import { EditTaskModal } from './EditTaskModal'
import { supabase } from '../lib/supabase'

interface Props {
  tasks: Task[]
  projects: ProjectSummary[]
  onRefresh: () => void
}

const TYPE_EMOJI: Record<ProjectType, string> = {
  carflip: '🚗',
  repair: '🔧',
  mpflip: '📦',
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtDate(s: string | null) {
  if (!s) return ''
  try { return format(parseISO(s), 'MMM d, yyyy') } catch { return s }
}

export function HistoryView({ tasks, projects, onRefresh }: Props) {
  const [editing, setEditing] = useState<Task | null>(null)

  const deleteProject = async (p: ProjectSummary) => {
    if (!confirm(`Delete "${p.title}" permanently? This removes all expenses, time and mileage logs too.`)) return
    await supabase.from('project_expenses').delete().eq('project_id', p.id)
    await supabase.from('project_time_logs').delete().eq('project_id', p.id)
    await supabase.from('project_mileage_logs').delete().eq('project_id', p.id)
    await supabase.from('projects').delete().eq('id', p.id)
    onRefresh()
  }

  const reopenProject = async (p: ProjectSummary) => {
    if (!confirm(`Reopen "${p.title}" as active?`)) return
    await supabase.from('projects').update({ status: 'active', sold_price: null, sold_at: null }).eq('id', p.id)
    onRefresh()
  }

  if (tasks.length === 0 && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">📋</div>
        <p className="text-gray-400 text-lg font-bold">No history yet</p>
        <p className="text-gray-600 text-sm">Completed tasks and projects show here</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {projects.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-wide mb-2">Completed Projects ({projects.length})</p>
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="bg-gray-800/30 rounded-xl p-3 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{TYPE_EMOJI[p.project_type]}</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                      <p className="text-gray-500 text-xs">{PROJECT_TYPE_LABEL[p.project_type]} · {fmtDate(p.sold_at)}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm shrink-0 ml-2 ${(p.profit||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(p.profit||0)}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => reopenProject(p)}
                    className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-1.5 active:text-gray-300">
                    Reopen
                  </button>
                  <button onClick={() => deleteProject(p)}
                    className="text-xs text-red-500/70 bg-gray-800 rounded-lg px-3 py-1.5 active:text-red-400 flex items-center gap-1">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-wide mb-2">Completed Tasks ({tasks.length})</p>
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-gray-800">
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium text-sm truncate line-through">{t.title}</p>
                  <p className="text-gray-600 text-xs capitalize">
                    {CATEGORY_LABEL[t.category]} · {fmtDate(t.completed_at)}
                  </p>
                </div>
                <button onClick={() => setEditing(t)} className="text-gray-600 active:text-gray-400 p-2 shrink-0 ml-2">
                  <Edit2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <EditTaskModal task={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh() }} />
      )}
    </div>
  )
}
