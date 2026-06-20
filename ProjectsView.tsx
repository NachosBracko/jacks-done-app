import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Gauge, DollarSign, CheckCircle, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ProjectSummary } from '../types'
import { FUEL_COST_PER_KM } from '../App'
import { format, parseISO } from 'date-fns'

interface Props {
  projects: ProjectSummary[]
  onRefresh: () => void
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function ProjectCard({ project, onRefresh }: { project: ProjectSummary; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'time' | 'mileage' | 'expense' | 'sell'>('time')
  const [timeHours, setTimeHours] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [km, setKm] = useState('')
  const [kmNote, setKmNote] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [soldPrice, setSoldPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const fuelCost = km ? Number(km) * FUEL_COST_PER_KM : 0
  const isActive = project.status === 'active'

  const logTime = async () => {
    if (!timeHours || isNaN(Number(timeHours))) { setErr('Enter hours'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_time_logs').insert({
      project_id: project.id,
      hours: Number(timeHours),
      description: timeNote || null,
    })
    if (error) { setErr(error.message) } else { setTimeHours(''); setTimeNote(''); onRefresh() }
    setSaving(false)
  }

  const logMileage = async () => {
    if (!km || isNaN(Number(km))) { setErr('Enter km'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_mileage_logs').insert({
      project_id: project.id,
      km: Number(km),
      description: kmNote || null,
      fuel_cost: Number(km) * FUEL_COST_PER_KM,
    })
    if (error) { setErr(error.message) } else { setKm(''); setKmNote(''); onRefresh() }
    setSaving(false)
  }

  const logExpense = async () => {
    if (!expDesc.trim() || !expAmount || isNaN(Number(expAmount))) { setErr('Fill in all fields'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_expenses').insert({
      project_id: project.id,
      description: expDesc.trim(),
      amount: Number(expAmount),
    })
    if (error) { setErr(error.message) } else { setExpDesc(''); setExpAmount(''); onRefresh() }
    setSaving(false)
  }

  const sellProject = async () => {
    if (!soldPrice || isNaN(Number(soldPrice))) { setErr('Enter sold price'); return }
    if (!confirm(`Mark "${project.title}" as sold for ${fmt(Number(soldPrice))}?`)) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('projects').update({
      status: 'sold',
      sold_price: Number(soldPrice),
      sold_at: new Date().toISOString(),
    }).eq('id', project.id)
    if (error) { setErr(error.message) } else { onRefresh() }
    setSaving(false)
  }

  const totalHours = project.time_logs.reduce((s, t) => s + t.hours, 0)
  const totalKm = project.mileage_logs.reduce((s, m) => s + m.km, 0)

  return (
    <div className={`rounded-2xl border overflow-hidden ${isActive ? 'border-orange-500/40 bg-orange-500/5' : 'border-gray-700 bg-gray-800/30'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-start justify-between text-left active:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {isActive ? 'ACTIVE' : 'SOLD'}
            </span>
            {project.year && <span className="text-gray-500 text-xs">{project.year}</span>}
          </div>
          <p className="text-white font-bold text-base mt-1">{project.title}</p>
          {project.make && <p className="text-gray-400 text-sm">{project.make} {project.model}</p>}
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-500 mt-1 shrink-0" /> : <ChevronDown size={18} className="text-gray-500 mt-1 shrink-0" />}
      </button>

      {/* Summary bar */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center border-t border-white/5">
        <div>
          <p className="text-gray-500 text-xs">Cost</p>
          <p className="text-white font-bold text-sm">{fmt(project.total_cost)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Hours</p>
          <p className="text-white font-bold text-sm">{totalHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{project.status === 'sold' ? 'Profit' : 'Invested'}</p>
          <p className={`font-bold text-sm ${project.profit != null ? (project.profit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
            {project.profit != null ? fmt(project.profit) : fmt(project.purchase_price)}
          </p>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pt-4 pb-4 space-y-4">
          {/* Cost breakdown */}
          <div className="bg-gray-800/50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Purchase</span><span className="text-white">{fmt(project.purchase_price)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Parts & expenses</span><span className="text-white">{fmt(project.total_expenses)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Fuel ({totalKm.toFixed(0)} km)</span><span className="text-white">{fmt(project.total_fuel_cost)}</span></div>
            <div className="flex justify-between font-bold border-t border-white/10 pt-1 mt-1"><span className="text-gray-300">Total cost</span><span className="text-white">{fmt(project.total_cost)}</span></div>
            {project.sold_price != null && (
              <>
                <div className="flex justify-between"><span className="text-gray-400">Sold for</span><span className="text-white">{fmt(project.sold_price)}</span></div>
                <div className={`flex justify-between font-black text-base ${(project.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <span>Profit</span><span>{fmt(project.profit || 0)}</span>
                </div>
                {project.hourly_rate != null && (
                  <div className="flex justify-between text-yellow-400 font-bold">
                    <span>Hourly rate</span><span>{fmt(project.hourly_rate)}/hr</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Logs list */}
          {project.time_logs.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Time logs</p>
              {project.time_logs.map((t) => (
                <div key={t.id} className="flex justify-between text-sm py-1 border-b border-white/5">
                  <span className="text-gray-400">{t.description || format(parseISO(t.created_at), 'MMM d')}</span>
                  <span className="text-white font-medium">{t.hours}h</span>
                </div>
              ))}
            </div>
          )}

          {project.mileage_logs.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Mileage logs</p>
              {project.mileage_logs.map((m) => (
                <div key={m.id} className="flex justify-between text-sm py-1 border-b border-white/5">
                  <span className="text-gray-400">{m.description || format(parseISO(m.created_at), 'MMM d')} ({m.km} km)</span>
                  <span className="text-white font-medium">{fmt(m.fuel_cost)}</span>
                </div>
              ))}
            </div>
          )}

          {project.expenses.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">Expenses</p>
              {project.expenses.map((e) => (
                <div key={e.id} className="flex justify-between text-sm py-1 border-b border-white/5">
                  <span className="text-gray-400">{e.description}</span>
                  <span className="text-white font-medium">{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action tabs - only for active projects */}
          {isActive && (
            <>
              <div className="grid grid-cols-4 gap-1 bg-gray-800 rounded-xl p-1">
                {(['time', 'mileage', 'expense', 'sell'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setErr('') }}
                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
                  >
                    {t === 'time' ? '⏱' : t === 'mileage' ? '🛣' : t === 'expense' ? '💸' : '✅'}
                  </button>
                ))}
              </div>

              {tab === 'time' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={timeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                      placeholder="Hours"
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      value={timeNote}
                      onChange={(e) => setTimeNote(e.target.value)}
                      placeholder="What did you do?"
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button onClick={logTime} disabled={saving} className="w-full bg-orange-500 text-white rounded-xl py-3 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    <Clock size={16} /> Log Time
                  </button>
                </div>
              )}

              {tab === 'mileage' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        placeholder="Kilometres"
                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {km && <p className="text-orange-400 text-xs mt-1 ml-1">≈ {fmt(fuelCost)} fuel</p>}
                    </div>
                    <input
                      value={kmNote}
                      onChange={(e) => setKmNote(e.target.value)}
                      placeholder="Trip reason"
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-gray-600 text-xs">12L/100km @ $1.60/L auto-calculated</p>
                  <button onClick={logMileage} disabled={saving} className="w-full bg-orange-500 text-white rounded-xl py-3 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    <Gauge size={16} /> Log Mileage
                  </button>
                </div>
              )}

              {tab === 'expense' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="What for?"
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="Amount $"
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button onClick={logExpense} disabled={saving} className="w-full bg-orange-500 text-white rounded-xl py-3 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    <DollarSign size={16} /> Add Expense
                  </button>
                </div>
              )}

              {tab === 'sell' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Sold price</label>
                    <input
                      type="number"
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                      placeholder="$0"
                      className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-xl font-bold outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {soldPrice && !isNaN(Number(soldPrice)) && (
                    <div className={`rounded-xl p-3 text-center font-black text-xl ${Number(soldPrice) - project.total_cost >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {Number(soldPrice) - project.total_cost >= 0 ? '🎉 ' : '😬 '}
                      Profit: {fmt(Number(soldPrice) - project.total_cost)}
                    </div>
                  )}
                  <button onClick={sellProject} disabled={saving} className="w-full bg-green-500 text-white rounded-xl py-3 font-black active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Mark as Sold
                  </button>
                </div>
              )}

              {err && <p className="text-red-400 text-sm">{err}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectsView({ projects, onRefresh }: Props) {
  const active = projects.filter((p) => p.status === 'active')
  const sold = projects.filter((p) => p.status === 'sold')

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">🚗</div>
        <p className="text-gray-400 text-lg font-medium">No car projects yet</p>
        <p className="text-gray-600 text-sm">Tap + Car to start tracking a flip</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Active ({active.length})</p>
          {active.map((p) => <ProjectCard key={p.id} project={p} onRefresh={onRefresh} />)}
        </>
      )}
      {sold.length > 0 && (
        <>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mt-6">Sold ({sold.length})</p>
          {sold.map((p) => <ProjectCard key={p.id} project={p} onRefresh={onRefresh} />)}
        </>
      )}
    </div>
  )
}
