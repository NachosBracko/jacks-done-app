import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Category, Recurrence } from '../types'
import { CATEGORIES } from '../types'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function AddTaskForm({ onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('personal')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('Enter a task name'); return }
    setSaving(true)
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(), category, recurrence,
      due_date: dueDate || null, status: 'active',
    })
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">New Task</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="What needs doing?"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`py-3 rounded-xl text-sm font-bold transition-colors ${category === c.value ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Repeat</label>
              <div className="grid grid-cols-2 gap-1">
                {RECURRENCES.map(r => (
                  <button key={r.value} onClick={() => setRecurrence(r.value)}
                    className={`py-3 rounded-xl text-xs font-bold transition-colors ${recurrence === r.value ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-500 text-white rounded-xl py-4 text-lg font-black active:scale-95 transition-transform disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
