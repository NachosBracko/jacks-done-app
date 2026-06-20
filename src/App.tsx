import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import type { Task, Project, ProjectExpense, ProjectTimeLog, ProjectMileageLog, ProjectSummary } from './types'
import { Dashboard } from './components/Dashboard'
import { AddTaskForm } from './components/AddTaskForm'
import { ProjectsView } from './components/ProjectsView'
import { AddProjectForm } from './components/AddProjectForm'
import { HistoryView } from './components/HistoryView'
import { ReportsView } from './components/ReportsView'
import { LayoutGrid, FolderOpen, Clock, BarChart2, AlertCircle } from 'lucide-react'

export type View = 'dashboard' | 'projects' | 'history' | 'reports'

// Fuel cost: 12L/100km @ $1.60/L
export const FUEL_COST_PER_KM = (12 / 100) * 1.60

function computeProjectSummary(
  project: Project,
  expenses: ProjectExpense[],
  timeLogs: ProjectTimeLog[],
  mileageLogs: ProjectMileageLog[]
): ProjectSummary {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalFuelCost = mileageLogs.reduce((s, m) => s + m.fuel_cost, 0)
  const totalCost = project.purchase_price + totalExpenses + totalFuelCost
  const profit = project.sold_price != null ? project.sold_price - totalCost : null
  const totalHours = timeLogs.reduce((s, t) => s + t.hours, 0)
  const hourlyRate = profit != null && totalHours > 0 ? profit / totalHours : null

  return {
    ...project,
    expenses,
    time_logs: timeLogs,
    mileage_logs: mileageLogs,
    total_expenses: totalExpenses,
    total_fuel_cost: totalFuelCost,
    total_cost: totalCost,
    profit,
    hourly_rate: hourlyRate,
  }
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!isConfigured) {
      setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    try {
      setError(null)
      const [tasksRes, projectsRes, expensesRes, timeLogsRes, mileageLogsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('project_expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('project_time_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('project_mileage_logs').select('*').order('created_at', { ascending: false }),
      ])

      for (const res of [tasksRes, projectsRes, expensesRes, timeLogsRes, mileageLogsRes]) {
        if (res.error) throw res.error
      }

      const rawProjects: Project[] = projectsRes.data || []
      const allExpenses: ProjectExpense[] = expensesRes.data || []
      const allTimeLogs: ProjectTimeLog[] = timeLogsRes.data || []
      const allMileageLogs: ProjectMileageLog[] = mileageLogsRes.data || []

      const summaries: ProjectSummary[] = rawProjects.map((p) =>
        computeProjectSummary(
          p,
          allExpenses.filter((e) => e.project_id === p.id),
          allTimeLogs.filter((t) => t.project_id === p.id),
          allMileageLogs.filter((m) => m.project_id === p.id)
        )
      )

      setTasks(tasksRes.data || [])
      setProjects(summaries)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError('Failed to load data: ' + msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const completeTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) fetchAll()
  }

  const navItems: { id: View; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Tasks', Icon: LayoutGrid },
    { id: 'projects', label: 'Projects', Icon: FolderOpen },
    { id: 'history', label: 'History', Icon: Clock },
    { id: 'reports', label: 'Reports', Icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white">Done</h1>
        <div className="flex gap-2">
          {view === 'dashboard' && (
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              + Task
            </button>
          )}
          {view === 'projects' && (
            <button
              onClick={() => setShowAddProject(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              + Car
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-4 bg-red-900/50 border border-red-700 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard
                tasks={tasks.filter((t) => t.status === 'active')}
                projects={projects.filter((p) => p.status === 'active')}
                onComplete={completeTask}
                onRefresh={fetchAll}
              />
            )}
            {view === 'projects' && (
              <ProjectsView
                projects={projects}
                onRefresh={fetchAll}
              />
            )}
            {view === 'history' && (
              <HistoryView
                tasks={tasks.filter((t) => t.status === 'done')}
                projects={projects.filter((p) => p.status === 'sold')}
                onRefresh={fetchAll}
              />
            )}
            {view === 'reports' && (
              <ReportsView tasks={tasks} projects={projects} />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-900 border-t border-gray-800 flex">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              view === id ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showAddTask && (
        <AddTaskForm
          projects={projects.filter((p) => p.status === 'active')}
          onClose={() => setShowAddTask(false)}
          onSaved={() => { setShowAddTask(false); fetchAll() }}
        />
      )}
      {showAddProject && (
        <AddProjectForm
          onClose={() => setShowAddProject(false)}
          onSaved={() => { setShowAddProject(false); fetchAll() }}
        />
      )}
    </div>
  )
}
