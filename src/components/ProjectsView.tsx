import { useState } from 'react'
import { Clock, Gauge, DollarSign, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ProjectSummary, ProjectType } from '../types'
import { PROJECT_TYPE_LABEL } from '../types'
import { FUEL_COST_PER_KM } from '../App'
import { format, parseISO } from 'date-fns'

interface Props {
  projects: ProjectSummary[]
  onRefresh: () => void
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtDate(s: string) {
  try { return format(parseISO(s), 'MMM d') } catch { return s }
}

const TYPE_EMOJI: Record<ProjectType, string> = {
  carflip: '🚗',
  repair: '🔧',
  mpflip: '📦',
}

type ActionTab = 'expense' | 'time' | 'mileage' | 'complete'

function ProjectCard({ project, onRefresh }: { project: ProjectSummary; onRefresh: () => void }) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<ActionTab>('expense')
  const [timeHours, setTimeHours] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [km, setKm] = useState('')
  const [kmNote, setKmNote] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expAmt, setExpAmt] = useState('')
  const [chargedAmt, setChargedAmt] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const isActive = project.status === 'active'
  const fuelPreview = km ? Number(km) * FUEL_COST_PER_KM : 0
  const isRepair = project.project_type === 'repair'

  const completeLabel = isRepair ? 'Mark Complete' : 'Mark as Sold'
  const amountLabel = isRepair ? 'Amount charged to customer' : 'Sold for'
  const amountPlaceholder = isRepair ? 'Charged $' : 'Sold for $'
  const profitLabel = isRepair ? 'Profit' : 'Profit'

  const profitPreview = chargedAmt && !isNaN(Number(chargedAmt))
    ? Number(chargedAmt) - project.total_cost : null

  const logTime = async () => {
    if (!timeHours || isNaN(Number(timeHours))) { setErr('Enter hours'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_time_logs').insert({
      project_id: project.id, hours: Number(timeHours), description: timeNote || null
    })
    if (error) setErr(error.message); else { setTimeHours(''); setTimeNote(''); onRefresh() }
    setSaving(false)
  }

  const logMileage = async () => {
    if (!km || isNaN(Number(km))) { setErr('Enter km'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_mileage_logs').insert({
      project_id: project.id, km: Number(km), description: kmNote || null, fuel_cost: fuelPreview
    })
    if (error) setErr(error.message); else { setKm(''); setKmNote(''); onRefresh() }
    setSaving(false)
  }

  const logExpense = async () => {
    if (!expDesc.trim() || !expAmt || isNaN(Number(expAmt))) { setErr('Fill all fields'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('project_expenses').insert({
      project_id: project.id, description: expDesc.trim(), amount: Number(expAmt)
    })
    if (error) setErr(error.message); else { setExpDesc(''); setExpAmt(''); onRefresh() }
    setSaving(false)
  }

  const completeProject = async () => {
    if (!chargedAmt || isNaN(Number(chargedAmt))) { setErr(`Enter ${amountLabel.toLowerCase()}`); return }
    const label = isRepair ? `Mark "${project.title}" as complete — charged ${fmt(Number(chargedAmt))}?` : `Mark "${project.title}" as sold for ${fmt(Number(chargedAmt))}?`
    if (!confirm(label)) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('projects').update({
      status: 'sold', sold_price: Number(chargedAmt), sold_at: new Date().toISOString()
    }).eq('id', project.id)
    if (error) setErr(error.message); else onRefresh()
    setSaving(false)
  }

  const deleteProject = async () => {
    if (!confirm(`Delete "${project.title}" and all its data? This cannot be undone.`)) return
    setSaving(true)
    await supabase.from('project_expenses').delete().eq('project_id', project.id)
    await supabase.from('project_time_logs').delete().eq('project_id', project.id)
    await supabase.from('project_mileage_logs').delete().eq('project_id', project.id)
    await supabase.from('projects').delete().eq('id', project.id)
    onRefresh()
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isActive ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/20'}`}>
      {/* Header */}
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-4 flex items-center justify-between active:bg-white/5">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg">{TYPE_EMOJI[project.project_type]}</span>
            <span className="text-gray-400 text-xs font-bold">{PROJECT_TYPE_LABEL[project.project_type]}</span>
          </div>
          <p className="text-white font-black text-base mt-0.5">{project.title}</p>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-500 shrink-0" /> : <ChevronDown size={18} className="text-gray-500 shrink-0" />}
      </button>

      {/* Stats bar */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center border-t border-white/5">
        <div>
          <p className="text-gray-500 text-xs">Total cost</p>
          <p className="text-white font-bold">{fmt(project.total_cost)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Hours</p>
          <p className="text-white font-bold">{project.total_hours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{project.status === 'sold' ? profitLabel : 'Spent'}</p>
          <p className={`font-bold ${project.profit != null ? (project.profit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
            {project.profit != null ? fmt(project.profit) : fmt(project.total_cost)}
          </p>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 pt-4 pb-4 space-y-4">
          {/* Cost breakdown */}
          <div className="bg-gray-800/60 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Purchase / starting cost</span><span className="text-white">{fmt(project.purchase_price)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Parts & expenses</span><span className="text-white">{fmt(project.total_expenses)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Fuel ({project.mileage_logs.reduce((s,m)=>s+m.km,0).toFixed(0)} km)</span><span className="text-white">{fmt(project.total_fuel_cost)}</span></div>
            <div className="flex justify-between font-bold border-t border-white/10 pt-1.5"><span className="text-gray-300">Total cost</span><span className="text-white">{fmt(project.total_cost)}</span></div>
            {project.sold_price != null && (<>
              <div className="flex justify-between"><span className="text-gray-400">{amountLabel}</span><span className="text-white">{fmt(project.sold_price)}</span></div>
              <div className={`flex justify-between font-black text-base ${(project.profit||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span>{profitLabel}</span><span>{fmt(project.profit||0)}</span>
              </div>
              {project.hourly_rate != null && (
                <div className="flex justify-between text-yellow-400 font-bold">
                  <span>Hourly rate</span><span>{fmt(project.hourly_rate)}/hr</span>
                </div>
              )}
            </>)}
          </div>

          {/* Expenses log */}
          {project.expenses.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wide mb-2">Expenses</p>
              {project.expenses.map(e => (
                <div key={e.id} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                  <span className="text-gray-400">{e.description} <span className="text-gray-600 text-xs">{fmtDate(e.created_at)}</span></span>
                  <span className="text-white font-medium">{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Time log */}
          {project.time_logs.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wide mb-2">Time</p>
              {project.time_logs.map(t => (
                <div key={t.id} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                  <span className="text-gray-400">{t.description || 'Work'} <span className="text-gray-600 text-xs">{fmtDate(t.created_at)}</span></span>
                  <span className="text-white font-medium">{t.hours}h</span>
                </div>
              ))}
            </div>
          )}

          {/* Mileage log */}
          {project.mileage_logs.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wide mb-2">Mileage</p>
              {project.mileage_logs.map(m => (
                <div key={m.id} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                  <span className="text-gray-400">{m.description || 'Drive'} ({m.km} km) <span className="text-gray-600 text-xs">{fmtDate(m.created_at)}</span></span>
                  <span className="text-white font-medium">{fmt(m.fuel_cost)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action tabs — active only */}
          {isActive && (<>
            <div className="grid grid-cols-4 gap-1 bg-gray-800 rounded-xl p-1">
              {([
                ['expense','💸','Expense'],
                ['time','⏱','Time'],
                ['mileage','🛣','Mileage'],
                ['complete','✅', isRepair ? 'Done' : 'Sold'],
              ] as const).map(([t, icon, label]) => (
                <button key={t} onClick={() => { setTab(t as ActionTab); setErr('') }}
                  className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition-colors ${tab === t ? 'bg-green-500 text-white' : 'text-gray-500'}`}>
                  <span>{icon}</span><span>{label}</span>
                </button>
              ))}
            </div>

            {tab === 'expense' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What for?"
                    className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                  <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="$ Amount"
                    className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <button onClick={logExpense} disabled={saving}
                  className="w-full bg-green-500 text-white rounded-xl py-3 font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <DollarSign size={16} /> Add Expense
                </button>
              </div>
            )}

            {tab === 'time' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={timeHours} onChange={e => setTimeHours(e.target.value)} placeholder="Hours"
                    className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                  <input value={timeNote} onChange={e => setTimeNote(e.target.value)} placeholder="What did you do?"
                    className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <button onClick={logTime} disabled={saving}
                  className="w-full bg-green-500 text-white rounded-xl py-3 font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Clock size={16} /> Log Time
                </button>
              </div>
            )}

            {tab === 'mileage' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="Kilometres"
                      className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                    {km && <p className="text-green-400 text-xs mt-1 ml-1">≈ {fmt(fuelPreview)} fuel</p>}
                  </div>
                  <input value={kmNote} onChange={e => setKmNote(e.target.value)} placeholder="Why?"
                    className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <p className="text-gray-600 text-xs">12L/100km @ $1.60/L</p>
                <button onClick={logMileage} disabled={saving}
                  className="w-full bg-green-500 text-white rounded-xl py-3 font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Gauge size={16} /> Log Mileage
                </button>
              </div>
            )}

            {tab === 'complete' && (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">{amountLabel}</label>
                  <input type="number" value={chargedAmt} onChange={e => setChargedAmt(e.target.value)} placeholder={amountPlaceholder}
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-xl font-bold outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                {profitPreview !== null && (
                  <div className={`rounded-xl p-3 text-center font-black text-xl ${profitPreview >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {profitPreview >= 0 ? '🎉 ' : '😬 '}{profitLabel}: {fmt(profitPreview)}
                  </div>
                )}
                <button onClick={completeProject} disabled={saving}
                  className="w-full bg-green-500 text-white rounded-xl py-3 font-black active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> {completeLabel}
                </button>
              </div>
            )}

            {err && <p className="text-red-400 text-sm">{err}</p>}
          </>)}

          {/* Delete button — always visible */}
          <button onClick={deleteProject} disabled={saving}
            className="w-full text-red-500/70 text-sm py-2 flex items-center justify-center gap-2 active:text-red-400">
            <Trash2 size={14} /> Delete project
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectsView({ projects, onRefresh }: Props) {
  const active = projects.filter(p => p.status === 'active')

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl">📋</div>
        <p className="text-gray-400 text-lg font-bold">No active projects</p>
        <p className="text-gray-600 text-sm">Tap + to start a project</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-xs font-black uppercase tracking-wide">Active ({active.length})</p>
      {active.map(p => <ProjectCard key={p.id} project={p} onRefresh={onRefresh} />)}
    </div>
  )
}
