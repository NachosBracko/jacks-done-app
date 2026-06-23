import { useState } from 'react'
import { CheckCircle2, Calendar, RefreshCw, Edit2 } from 'lucide-react'
import type { Task, Category } from '../types'
import { CATEGORY_LABEL } from '../types'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { EditTaskModal } from './EditTaskModal'

interface Props {
  tasks: Task[]
  onComplete: (task: Task) => void
  onRefresh: () => void
}

const CATEGORY_COLOR: Record<Category, string> = {
  personal: 'bg-purple-500/20 border-purple-500/40',
  business: 'bg-blue-500/20 border-blue-500/40',
}

const CATEGORY_DOT: Record<Category, string> = {
  personal: 'bg-purple-400',
  business: 'bg-blue-400',
}

function dueLabel(dateStr: string | null): { text: string; urgent: boolean } | null {
  if (!dateStr) return null
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return { text: 'Overdue', urgent: true }
  if (isToday(d)) return { text: 'Today', urgent: true }
  if (isTomorrow(d)) return { text: 'Tomorrow', urgent: false }
  return { text: format(d, 'MMM d'), urgent: false }
}

export function Dashboard({ tasks, onComplete, onRefresh }: Props) {
  const [editing, setEditing] = useState<Task | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">✅</div>
        <p className="text-gray-400 text-lg font-bold">All clear!</p>
        <p className="text-gray-600 text-sm">Tap + to add a task</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm font-medium">{tasks.length} active</p>
        <button onClick={onRefresh} className="text-gray-600 active:text-gray-400 p-1">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => {
          const due = dueLabel(task.due_date)
          return (
            <div key={task.id} className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${CATEGORY_COLOR[task.category]}`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_DOT[task.category]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-snug">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-xs">{CATEGORY_LABEL[task.category]}</span>
                  {due && (
                    <>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className={`text-xs flex items-center gap-1 ${due.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                        <Calendar size={10} />{due.text}
                      </span>
                    </>
                  )}
                  {task.recurrence !== 'none' && (
                    <>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-gray-500 text-xs capitalize">{task.recurrence}</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(task)} className="text-gray-600 active:text-gray-400 p-1 shrink-0">
                <Edit2 size={16} />
              </button>
              <button onClick={() => onComplete(task)} className="text-gray-500 active:text-green-400 transition-colors shrink-0">
                <CheckCircle2 size={28} />
              </button>
            </div>
          )
        })}
      </div>

      {editing && (
        <EditTaskModal task={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh() }} />
      )}
    </div>
  )
}
