import { CheckCircle2, Car, Calendar, RefreshCw } from 'lucide-react'
import type { Task, ProjectSummary, Category } from '../types'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

interface Props {
  tasks: Task[]
  projects: ProjectSummary[]
  onComplete: (id: string) => void
  onRefresh: () => void
}

const CATEGORY_COLORS: Record<Category, string> = {
  personal: 'bg-purple-500/20 border-purple-500/40',
  business: 'bg-blue-500/20 border-blue-500/40',
  car: 'bg-orange-500/20 border-orange-500/40',
  health: 'bg-green-500/20 border-green-500/40',
  finance: 'bg-yellow-500/20 border-yellow-500/40',
  other: 'bg-gray-500/20 border-gray-500/40',
}

const CATEGORY_DOT: Record<Category, string> = {
  personal: 'bg-purple-400',
  business: 'bg-blue-400',
  car: 'bg-orange-400',
  health: 'bg-green-400',
  finance: 'bg-yellow-400',
  other: 'bg-gray-400',
}

function dueDateLabel(dateStr: string | null): { text: string; urgent: boolean } {
  if (!dateStr) return { text: '', urgent: false }
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return { text: 'Overdue', urgent: true }
  if (isToday(d)) return { text: 'Today', urgent: true }
  if (isTomorrow(d)) return { text: 'Tomorrow', urgent: false }
  return { text: format(d, 'MMM d'), urgent: false }
}

export function Dashboard({ tasks, projects, onComplete, onRefresh }: Props) {
  // Active project tasks appear first, then regular tasks, capped at 12
  const projectTasks: (Task & { _isProject?: true; _project?: ProjectSummary })[] = projects.map((p) => ({
    id: 'project-' + p.id,
    title: p.title + (p.make ? ` – ${p.make} ${p.model || ''}` : ''),
    category: 'car' as Category,
    recurrence: 'none' as const,
    due_date: null,
    status: 'active' as const,
    project_id: p.id,
    notes: null,
    created_at: p.created_at,
    completed_at: null,
    _isProject: true,
    _project: p,
  }))

  const allCards = [...projectTasks, ...tasks].slice(0, 12)

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">✅</div>
        <p className="text-gray-400 text-lg font-medium">Nothing on the list!</p>
        <p className="text-gray-600 text-sm">Tap + Task to add something</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{allCards.length} active</p>
        <button onClick={onRefresh} className="text-gray-600 active:text-gray-400 transition-colors p-1">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {allCards.map((card) => {
          const due = dueDateLabel(card.due_date)
          const isProject = Boolean('_isProject' in card && card._isProject)
          const colorClass = CATEGORY_COLORS[card.category]
          const dotClass = CATEGORY_DOT[card.category]

          return (
            <div
              key={card.id}
              className={`relative rounded-2xl border p-4 min-h-[100px] flex flex-col justify-between ${colorClass} tap-card`}
            >
              {/* Category dot */}
              <div className="flex items-start justify-between gap-2">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotClass}`} />
                {isProject && <Car size={14} className="text-orange-400 shrink-0" />}
              </div>

              <p className="text-white font-semibold text-sm leading-snug mt-2 flex-1">{card.title}</p>

              <div className="flex items-center justify-between mt-3">
                {due.text ? (
                  <span className={`text-xs font-medium flex items-center gap-1 ${due.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                    <Calendar size={10} />
                    {due.text}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 capitalize">
                    {card.recurrence !== 'none' ? card.recurrence : card.category}
                  </span>
                )}

                {!isProject && (
                  <button
                    onClick={() => onComplete(card.id)}
                    className="text-gray-500 active:text-green-400 transition-colors -mr-1 -mb-1 p-1"
                  >
                    <CheckCircle2 size={22} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
