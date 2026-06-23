export type Category = 'personal' | 'repairs' | 'carflips' | 'mpflips' | 'other'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'
export type TaskStatus = 'active' | 'done'
export type ProjectStatus = 'active' | 'sold'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'carflips', label: 'Car Flips' },
  { value: 'mpflips', label: 'MP Flips' },
  { value: 'other', label: 'Other' },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  personal: 'Personal',
  repairs: 'Repairs',
  carflips: 'Car Flips',
  mpflips: 'MP Flips',
  other: 'Other',
}

export interface Task {
  id: string
  title: string
  category: Category
  recurrence: Recurrence
  due_date: string | null
  status: TaskStatus
  project_id: string | null
  notes: string | null
  created_at: string
  completed_at: string | null
}

export interface Project {
  id: string
  title: string
  make: string | null
  model: string | null
  year: number | null
  purchase_price: number
  status: ProjectStatus
  sold_price: number | null
  hours_logged: number
  km_logged: number
  notes: string | null
  created_at: string
  sold_at: string | null
}

export interface ProjectExpense {
  id: string
  project_id: string
  description: string
  amount: number
  created_at: string
}

export interface ProjectTimeLog {
  id: string
  project_id: string
  hours: number
  description: string | null
  created_at: string
}

export interface ProjectMileageLog {
  id: string
  project_id: string
  km: number
  description: string | null
  fuel_cost: number
  created_at: string
}

export interface ProjectSummary extends Project {
  expenses: ProjectExpense[]
  time_logs: ProjectTimeLog[]
  mileage_logs: ProjectMileageLog[]
  total_expenses: number
  total_fuel_cost: number
  total_cost: number
  total_hours: number
  profit: number | null
  hourly_rate: number | null
}
