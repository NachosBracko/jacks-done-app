import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import type { Task, Project, ProjectExpense, ProjectTimeLog, ProjectMileageLog, ProjectSummary } from './types'
import { Dashboard } from './components/Dashboard'
import { ProjectsView } from './components/ProjectsView'
import { HistoryView } from './components/HistoryView'
import { ReportsView } from './components/ReportsView'
import { AddTaskForm } from './components/AddTaskForm'
import { AddProjectForm } from './components/AddProjectForm'
import { LayoutGrid, FolderOpen, Clock, BarChart2, Plus, X, AlertCircle } from 'lucide-react'

export type View = 'dashboard' | 'projects' | 'history' | 'reports'
export const FUEL_COST_PER_KM = (12 / 100) * 1.60

function computeSummary(
  project: Project,
  expenses: ProjectExpense[],
  timeLogs: ProjectTimeLog[],
  mileageLogs: ProjectMileageLog[]
): ProjectSummary {
  const total_expenses = expenses.reduce((s, e) => s + e.amount, 0)
  const total_fuel_cost = mileageLogs.reduce((s, m) => s + m.fuel_cost, 0)
  const total_cost = project.purchase_price + total_expenses + total_fuel_cost
  const total_hours = timeLogs.reduce((s, t) => s + t.hours, 0)
  const profit = project.sold_price != null ? project.sold_price - total_cost : null
  const hourly_rate = profit != null && total_hours > 0 ? profit / total_hours : null
  return { ...project, expenses, time_logs: timeLogs, mileage_logs: mileageLogs, total_expenses, total_fuel_cost, total_cost, total_hours, profit, hourly_rate }
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)

  const fetchAll = useCallback(async () => {
    if
