import { useState } from 'react'
import { X, Save, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Task, Category, Recurrence } from '../types'
import { CATEGORIES } from '../types'

interface Props {
  task: Task
  onClose: () => void
  onSaved: () => void
}

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function EditTaskModal({ task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task.title)
  const [category, setCategory] = useState<Category>(task.category)
  const [recurrence, setRecurrence] = useState<Recurrence>(task.recurrence)
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!title.trim()) { setErr('Title required'); return }
    setSaving(true)
    const { error } = await supabase.from('tasks').update({
      title: title.trim(), category, recurrence, due_date: dueDate || null
    }).eq('id', task.id)
    if (error) { setErr(error.message); setSaving(false); return }
    onSaved()
  }

  const reopen = async () => {
    setSaving(true)
    await supabase.from('tasks').update({ status: 'active', completed_at: null }).eq('id', task.id)
    onSaved()
  }

  const remove = async () => {
    if (!confirm('Delete this task permanently?')) return
    setSaving(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Edit Task</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${category === c.value ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Repeat</label>
            <div className="grid grid-cols-4 gap-2">
              {RECURRENCES.map(r => (
                <button key={r.value} onClick={() => setRecurrence(r.value)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${recurrence === r.value ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <button onClick={save} disabled={saving}
            className="w-full bg-blue-500 text-white rounded-xl py-4 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18} /> Save Changes
          </button>

          {task.status === 'done' && (
            <button onClick={reopen} disabled={saving}
              className="w-full bg-gray-800 text-white rounded-xl py-3 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Reopen Task
            </button>
          )}

          <button onClick={remove} disabled={saving}
            className="w-full text-red-400 py-2 text-sm font-medium flex items-center justify-center gap-2">
            <Trash2 size={14} /> Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}
