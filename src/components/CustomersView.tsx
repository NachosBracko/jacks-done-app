import { useState, useMemo } from 'react'
import { Search, User, Phone, ChevronRight, X, Save, Trash2, Car } from 'lucide-react'
import type { Customer, ProjectSummary } from '../types'
import { PROJECT_TYPE_LABEL } from '../types'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

interface Props {
  customers: Customer[]
  projects: ProjectSummary[]
  onRefresh: () => void
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  try { return format(parseISO(s), 'MMM d, yyyy') } catch { return s }
}

function CustomerDetail({ customer, projects, onClose, onRefresh }: {
  customer: Customer
  projects: ProjectSummary[]
  onClose: () => void
  onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone || '')
  const [notes, setNotes] = useState(customer.notes || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const repairProjects = projects.filter(p => p.customer_id === customer.id)
  const completedRepairs = repairProjects.filter(p => p.status === 'sold')
  const lifetimeRevenue = completedRepairs.reduce((s, p) => s + (p.sold_price || 0), 0)
  const lifetimeProfit = completedRepairs.reduce((s, p) => s + (p.profit || 0), 0)
  const lastService = completedRepairs.length > 0
    ? completedRepairs.sort((a, b) => new Date(b.sold_at || 0).getTime() - new Date(a.sold_at || 0).getTime())[0].sold_at
    : null

  const saveEdits = async () => {
    if (!name.trim()) { setErr('Name required'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('customers').update({
      name: name.trim(), phone: phone.trim() || null, notes: notes.trim() || null
    }).eq('id', customer.id)
    if (error) { setErr(error.message); setSaving(false); return }
    setEditing(false); onRefresh()
    setSaving(false)
  }

  const deleteCustomer = async () => {
    if (!confirm(`Delete ${customer.name}? Their repair history will remain but won't be linked to this customer.`)) return
    await supabase.from('projects').update({ customer_id: null }).eq('customer_id', customer.id)
    await supabase.from('customers').delete().eq('id', customer.id)
    onClose(); onRefresh()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50">
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
              <User size={22} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{customer.name}</h2>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="text-blue-400 text-sm flex items-center gap-1">
                  <Phone size={12} />{customer.phone}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 p-1 mt-1"><X size={22} /></button>
        </div>

        {/* Lifetime stats */}
        <div className="px-5 pb-3 grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-gray-500 text-xs">Visits</p>
            <p className="text-white font-black text-xl">{repairProjects.length}</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-gray-500 text-xs">Revenue</p>
            <p className="text-green-400 font-black text-lg">{fmt(lifetimeRevenue)}</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-gray-500 text-xs">Profit</p>
            <p className="text-yellow-400 font-black text-lg">{fmt(lifetimeProfit)}</p>
          </div>
        </div>
        {lastService && (
          <p className="px-5 text-gray-500 text-xs pb-3 shrink-0">Last service: {fmtDate(lastService)}</p>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {/* Edit profile */}
          {!editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm font-bold active:bg-gray-700">
                Edit Profile
              </button>
              <button onClick={deleteCustomer}
                className="bg-gray-800 text-red-400 rounded-xl px-4 py-2.5 text-sm font-bold active:bg-gray-700 flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-gray-800/40 rounded-2xl p-4 border border-gray-700">
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
                type="tel"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..."
                rows={2} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              {err && <p className="text-red-400 text-sm">{err}</p>}
              <div className="flex gap-2">
                <button onClick={saveEdits} disabled={saving}
                  className="flex-1 bg-blue-500 text-white rounded-xl py-3 font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-gray-700 text-gray-300 rounded-xl px-4 py-3 font-bold">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes display */}
          {customer.notes && !editing && (
            <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Notes</p>
              <p className="text-gray-300 text-sm">{customer.notes}</p>
            </div>
          )}

          {/* Service history */}
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wide mb-3">
              Service History ({repairProjects.length})
            </p>
            {repairProjects.length === 0 ? (
              <p className="text-gray-600 text-sm">No repairs yet</p>
            ) : (
              <div className="space-y-2">
                {[...repairProjects]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(p => (
                    <div key={p.id} className={`rounded-xl p-3 border ${p.status === 'active' ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/30'}`}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                              {p.status === 'active' ? 'ACTIVE' : 'DONE'}
                            </span>
                            <span className="text-gray-500 text-xs">{PROJECT_TYPE_LABEL[p.project_type]}</span>
                          </div>
                          <p className="text-white font-semibold text-sm mt-1">{p.title}</p>
                          {(p.vin || p.mileage) && (
                            <div className="flex gap-3 mt-0.5">
                              {p.vin && <p className="text-gray-500 text-xs flex items-center gap-1"><Car size={10} />{p.vin}</p>}
                              {p.mileage && <p className="text-gray-500 text-xs">{p.mileage.toLocaleString()} km</p>}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          {p.status === 'sold' && p.profit != null ? (
                            <>
                              <p className="text-gray-400 text-xs">{fmt(p.sold_price || 0)}</p>
                              <p className={`font-bold text-sm ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(p.profit)}</p>
                            </>
                          ) : (
                            <p className="text-gray-500 text-xs">{fmt(p.total_cost)} in</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-600">
                        <span>{fmtDate(p.status === 'sold' ? p.sold_at : p.created_at)}</span>
                        <span>{p.total_hours.toFixed(1)}h</span>
                        {p.expenses.length > 0 && <span>{p.expenses.length} expense{p.expenses.length !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CustomersView({ customers, projects, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
    )
  }, [customers, search])

  const getStats = (c: Customer) => {
    const repairs = projects.filter(p => p.customer_id === c.id)
    const completed = repairs.filter(p => p.status === 'sold')
    const revenue = completed.reduce((s, p) => s + (p.sold_price || 0), 0)
    const lastDate = completed.length > 0
      ? completed.sort((a, b) => new Date(b.sold_at || 0).getTime() - new Date(a.sold_at || 0).getTime())[0].sold_at
      : null
    return { count: repairs.length, revenue, lastDate }
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">👥</div>
        <p className="text-gray-400 text-lg font-bold">No customers yet</p>
        <p className="text-gray-600 text-sm">Customers are added when you create a repair</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 gap-2">
        <Search size={16} className="text-gray-500 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-500" />
        {search && <button onClick={() => setSearch('')} className="text-gray-500"><X size={16} /></button>}
      </div>

      <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">{filtered.length} customers</p>

      {/* Customer cards */}
      <div className="space-y-2">
        {filtered.map(c => {
          const stats = getStats(c)
          return (
            <button key={c.id} onClick={() => setSelected(c)}
              className="w-full bg-gray-800/40 border border-gray-800 rounded-2xl p-4 flex items-center justify-between text-left active:bg-gray-800/70 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <User size={18} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-base truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.phone && <span className="text-gray-500 text-xs">{c.phone}</span>}
                    {c.phone && stats.count > 0 && <span className="text-gray-700 text-xs">·</span>}
                    {stats.count > 0 && <span className="text-gray-500 text-xs">{stats.count} repair{stats.count !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {stats.revenue > 0 && (
                  <p className="text-green-400 font-bold text-sm">{fmt(stats.revenue)}</p>
                )}
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <CustomerDetail
          customer={selected}
          projects={projects}
          onClose={() => setSelected(null)}
          onRefresh={() => { setSelected(null); onRefresh() }}
        />
      )}
    </div>
  )
}
