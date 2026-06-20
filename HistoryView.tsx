import { useState } from 'react'
import { Edit2, RotateCcw, Car, X, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Task, ProjectSummary, Category } from '../types'
import { format, parseISO } from 'date-fns'

interface Props {
  tasks: Task[]
  projects: ProjectSummary[]
  onRefresh: () => void
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const CATEGORIES: Category[] = ['personal', 'business', 'car', 'health', 'finance', 'other']

function EditTaskModal({ task, onClose, onSaved }: { task: Task; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(task.title)
  const [category, setCategory] = useState<Category>(task.category)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!title.trim()) { setErr('Title required'); return }
    setSaving(true)
    const { error } = await supabase.from('tasks').update({ title: title.trim(), category }).eq('id', task.id)
    if (error) { setErr(error.message); setSaving(false); return }
    onSaved()
  }

  const reopen = async () => {
    setSaving(true)
    const { error } = await supabase.from('tasks').update({ status: 'active', completed_at: null }).eq('id', task.id)
    if (error) { setErr(error.message); setSaving(false); return }
    onSaved()
  }

  const remove = async () => {
    if (!confirm('Delete this task permanently?')) return
    setSaving(true)
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) { setErr(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Edit Task</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`py-2.5 rounded-xl text-sm font-semibold capitalize ${category === c ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button onClick={save} disabled={saving} className="w-full bg-blue-500 text-white rounded-xl py-4 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18} /> Save Changes
          </button>
          <button onClick={reopen} disabled={saving} className="w-full bg-gray-800 text-white rounded-xl py-3 font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reopen Task
          </button>
          <button onClick={remove} disabled={saving} className="w-full text-red-400 py-2 text-sm font-medium">
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}

export function HistoryView({ tasks, projects, onRefresh }: Props) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  if (tasks.length === 0 && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">📋</div>
        <p className="text-gray-400 text-lg font-medium">No history yet</p>
        <p className="text-gray-600 text-sm">Completed tasks and sold cars show up here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {projects.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Sold Projects ({projects.length})</p>
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-gray-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Car size={16} className="text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-gray-500 text-xs">{p.sold_at ? format(parseISO(p.sold_at), 'MMM d, yyyy') : ''}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm shrink-0 ${(p.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(p.profit || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Completed Tasks ({tasks.length})</p>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="bg-gray-800/30 rounded-xl p-3 flex items-center justify-between border border-gray-800">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate line-through decoration-gray-600">{t.title}</p>
                  <p className="text-gray-500 text-xs capitalize">{t.category} · {t.completed_at ? format(parseISO(t.completed_at), 'MMM d') : ''}</p>
                </div>
                <button onClick={() => setEditingTask(t)} className="text-gray-500 p-2 shrink-0">
                  <Edit2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => { setEditingTask(null); onRefresh() }}
        />
      )}
    </div>
  )
}
