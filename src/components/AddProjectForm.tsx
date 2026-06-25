import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ProjectType, Customer } from '../types'
import { CustomerCombobox } from './CustomerCombobox'

interface Props {
  customers: Customer[]
  onClose: () => void
  onSaved: () => void
}

const PROJECT_TYPES: { value: ProjectType; label: string; emoji: string; desc: string }[] = [
  { value: 'carflip', label: 'Car Flip', emoji: '🚗', desc: 'Buy and sell a vehicle' },
  { value: 'repair', label: 'Repair', emoji: '🔧', desc: 'Fix it for a customer' },
  { value: 'mpflip', label: 'MP Flip', emoji: '📦', desc: 'Buy and resell an item' },
]

export function AddProjectForm({ customers: initialCustomers, onClose, onSaved }: Props) {
  const [type, setType] = useState<ProjectType | null>(null)
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(initialCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [itemName, setItemName] = useState('')
  const [vin, setVin] = useState('')
  const [mileage, setMileage] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!type) { setError('Pick a project type'); return }
    let title = ''
    let make_val: string | null = null
    let model_val: string | null = null
    let year_val: number | null = null

    if (type === 'carflip') {
      if (!make.trim()) { setError('Enter the make'); return }
      make_val = make.trim(); model_val = model.trim() || null; year_val = year ? Number(year) : null
      title = [year_val, make_val, model_val].filter(Boolean).join(' ')
    } else if (type === 'repair') {
      if (!selectedCustomer && !customerName.trim()) { setError('Select or enter a customer'); return }
      title = selectedCustomer ? selectedCustomer.name : customerName.trim()
    } else {
      if (!itemName.trim()) { setError('Enter item name'); return }
      title = itemName.trim()
    }

    setSaving(true); setError('')
    const { error } = await supabase.from('projects').insert({
      project_type: type, title, make: make_val, model: model_val, year: year_val,
      purchase_price: Number(purchasePrice) || 0, status: 'active',
      hours_logged: 0, km_logged: 0, notes: notes || null,
      customer_id: selectedCustomer?.id || null,
      vin: vin.trim() || null,
      mileage: mileage ? Number(mileage) : null,
    })
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">New Project</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">What type?</label>
            <div className="grid grid-cols-3 gap-2">
              {PROJECT_TYPES.map(pt => (
                <button key={pt.value} onClick={() => { setType(pt.value); setError('') }}
                  className={`rounded-2xl p-3 text-center transition-colors active:scale-95 ${type === pt.value ? 'bg-green-500/30 border-2 border-green-500' : 'bg-gray-800 border-2 border-transparent'}`}>
                  <div className="text-2xl mb-1">{pt.emoji}</div>
                  <p className="text-white font-bold text-xs">{pt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {type === 'carflip' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Make *</label>
                  <input value={make} onChange={e => setMake(e.target.value)} placeholder="Honda"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Model</label>
                  <input value={model} onChange={e => setModel(e.target.value)} placeholder="Civic"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Year</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2018"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Purchase price</label>
                <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="$0"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </>
          )}

          {type === 'repair' && (
            <>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Customer *</label>
                <CustomerCombobox
                  customers={localCustomers}
                  selected={selectedCustomer}
                  onSelect={setSelectedCustomer}
                  onCreated={c => setLocalCustomers(prev => [...prev, c])}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">VIN</label>
                  <input value={vin} onChange={e => setVin(e.target.value)} placeholder="Vehicle VIN"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Odometer (km)</label>
                  <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="e.g. 145000"
                    className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </>
          )}

          {type === 'mpflip' && (
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Item name *</label>
              <input autoFocus value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Riding mower"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}

          {(type === 'repair' || type === 'mpflip') && (
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Starting cost</label>
              <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="$0"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}

          {type && (
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details..."
                rows={2} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {type && (
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-green-500 text-white rounded-xl py-4 text-lg font-black active:scale-95 transition-transform disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
