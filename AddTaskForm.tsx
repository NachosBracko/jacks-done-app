import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Category, Recurrence, ProjectSummary } from '../types'

interface Props {
  projects: ProjectSummary[]
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES: Category[] = ['personal', 'business', 'car', 'health', 'finance', 'other']
const RECURRENCES: Recurrence[] = ['none', 'daily', 'weekly', 'monthly']

export function AddTaskForm({ projects, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('personal')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      category,
      recurrence,
      due_date: dueDate || null,
      project_id: projectId || null,
      notes: notes || null,
      status: 'active',
    })
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">New Task</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">What needs doing?</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    category === c
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Repeat</label>
            <div className="grid grid-cols-4 gap-2">
              {RECURRENCES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRecurrence(r)}
                  className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    recurrence === r
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Link to project */}
          {projects.length > 0 && (
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Link to car project (optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details..."
              rows={2}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-500 text-white rounded-xl py-4 text-lg font-black active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
