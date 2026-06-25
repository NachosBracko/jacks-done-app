import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import type { Task, Project, ProjectExpense, ProjectTimeLog, ProjectMileageLog, ProjectSummary, Customer } from './types'
import { Dashboard } from './components/Dashboard'
import { ProjectsView } from './components/ProjectsView'
import { HistoryView } from './components/HistoryView'
import { ReportsView } from './components/ReportsView'
import { CustomersView } from './components/CustomersView'
import { AddTaskForm } from './components/AddTaskForm'
import { AddProjectForm } from './components/AddProjectForm'
import { LayoutGrid, FolderOpen, Clock, BarChart2, Plus, X, AlertCircle, Users } from 'lucide-react'
import { addDays, addWeeks, addMonths, format } from 'date-fns'

export type View = 'dashboard' | 'projects' | 'history' | 'reports' | 'customers'
export const FUEL_COST_PER_KM = (12 / 100) * 1.60

function computeSummary(
  project: Project,
  expenses: ProjectExpense[],
  timeLogs: ProjectTimeLog[],
  mileageLogs: ProjectMileageLog[],
  customers: Customer[]
): ProjectSummary {
  const total_expenses = expenses.reduce((s, e) => s + e.amount, 0)
  const total_fuel_cost = mileageLogs.reduce((s, m) => s + m.fuel_cost, 0)
  const total_cost = project.purchase_price + total_expenses + total_fuel_cost
  const total_hours = timeLogs.reduce((s, t) => s + t.hours, 0)
  const profit = project.sold_price != null ? project.sold_price - total_cost : null
  const hourly_rate = profit != null && total_hours > 0 ? profit / total_hours : null
  const customer = customers.find(c => c.id === project.customer_id)
  return { ...project, expenses, time_logs: timeLogs, mileage_logs: mileageLogs, total_expenses, total_fuel_cost, total_cost, total_hours, profit, hourly_rate, customer }
}

export async function completeTaskWithRecurrence(task: Task) {
  await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', task.id)
  if (task.recurrence !== 'none') {
    const base = task.due_date ? new Date(task.due_date) : new Date()
    let nextDate: Date
    if (task.recurrence === 'daily') nextDate = addDays(base, 1)
    else if (task.recurrence === 'weekly') nextDate = addWeeks(base, 1)
    else nextDate = addMonths(base, 1)
    await supabase.from('tasks').insert({
      title: task.title, category: task.category, recurrence: task.recurrence,
      due_date: format(nextDate, 'yyyy-MM-dd'), status: 'active',
      project_id: task.project_id, notes: task.notes,
    })
  }
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!isConfigured) { setError('Supabase not configured.'); setLoading(false); return }
    try {
      setError(null)
      const [t, p, e, tl, ml, c] = await Promise.all([
        supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('project_expenses').select('*'),
        supabase.from('project_time_logs').select('*'),
        supabase.from('project_mileage_logs').select('*'),
        supabase.from('customers').select('*').order('name'),
      ])
      for (const r of [t, p, e, tl, ml, c]) { if (r.error) throw r.error }
      const allCustomers: Customer[] = c.data || []
      const summaries = (p.data || []).map((proj: Project) =>
        computeSummary(proj,
          (e.data || []).filter((x: ProjectExpense) => x.project_id === proj.id),
          (tl.data || []).filter((x: ProjectTimeLog) => x.project_id === proj.id),
          (ml.data || []).filter((x: ProjectMileageLog) => x.project_id === proj.id),
          allCustomers
        )
      )
      setTasks(t.data || [])
      setProjects(summaries)
      setCustomers(allCustomers)
    } catch (err: unknown) {
      setError('Failed to load: ' + (err instanceof Error ? err.message : JSON.stringify(err)))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCompleteTask = async (task: Task) => {
    await completeTaskWithRecurrence(task)
    fetchAll()
  }

  const navItems: { id: View; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Tasks', Icon: LayoutGrid },
    { id: 'projects', label: 'Projects', Icon: FolderOpen },
    { id: 'customers', label: 'Customers', Icon: Users },
    { id: 'history', label: 'History', Icon: Clock },
    { id: 'reports', label: 'Reports', Icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">Done</h1>
        <button onClick={() => setShowAddPicker(true)}
          className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
          <Plus size={22} strokeWidth={3} />
        </button>
      </header>

      {error && (
        <div className="mx-4 mb-3 bg-red-900/50 border border-red-700 rounded-xl p-3 flex gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 pb-28">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && <Dashboard tasks={tasks.filter(t => t.status === 'active')} onComplete={handleCompleteTask} onRefresh={fetchAll} />}
            {view === 'projects' && <ProjectsView projects={projects} customers={customers} onRefresh={fetchAll} />}
            {view === 'customers' && <CustomersView customers={customers} projects={projects} onRefresh={fetchAll} />}
            {view === 'history' && <HistoryView tasks={tasks.filter(t => t.status === 'done')} projects={projects.filter(p => p.status === 'sold')} onRefresh={fetchAll} />}
            {view === 'reports' && <ReportsView tasks={tasks} projects={projects} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-900 border-t border-gray-800 flex">
        {navItems.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${view === id ? 'text-blue-400' : 'text-gray-500'}`}>
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {showAddPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowAddPicker(false)}>
          <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">What are you adding?</h2>
              <button onClick={() => setShowAddPicker(false)} className="text-gray-500"><X size={22} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowAddPicker(false); setShowAddTask(true) }}
                className="bg-blue-500/20 border border-blue-500/40 rounded-2xl p-5 text-left active:scale-95 transition-transform">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-white font-black text-lg">Task</p>
                <p className="text-blue-300 text-sm mt-1">Something to do</p>
              </button>
              <button onClick={() => { setShowAddPicker(false); setShowAddProject(true) }}
                className="bg-green-500/20 border border-green-500/40 rounded-2xl p-5 text-left active:scale-95 transition-transform">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-white font-black text-lg">Project</p>
                <p className="text-green-300 text-sm mt-1">Car flip, repair or MP flip</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTask && <AddTaskForm onClose={() => setShowAddTask(false)} onSaved={() => { setShowAddTask(false); fetchAll() }} />}
      {showAddProject && <AddProjectForm customers={customers} onClose={() => setShowAddProject(false)} onSaved={() => { setShowAddProject(false); fetchAll() }} />}
    </div>
  )
}
