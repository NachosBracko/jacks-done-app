export type Category = 'personal' | 'business'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'
export type TaskStatus = 'active' | 'done'
export type ProjectStatus = 'active' | 'sold'
export type ProjectType = 'carflip' | 'repair' | 'mpflip'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  personal: 'Personal',
  business: 'Business',
}

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  carflip: 'Car Flip',
  repair: 'Repair',
  mpflip: 'MP Flip',
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
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
  project_type: ProjectType
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
  customer_id: string | null
  vin: string | null
  mileage: number | null
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
  customer?: Customer
}
