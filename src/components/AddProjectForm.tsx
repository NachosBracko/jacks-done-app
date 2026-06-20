import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function AddProjectForm({ onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('Name is required'); return }
    if (!purchasePrice || isNaN(Number(purchasePrice))) { setError('Purchase price is required'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('projects').insert({
      title: title.trim(),
      make: make || null,
      model: model || null,
      year: year ? Number(year) : null,
      purchase_price: Number(purchasePrice),
      status: 'active',
      hours_logged: 0,
      km_logged: 0,
      notes: notes || null,
    })
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">New Car Project</h2>
          <button onClick={onClose} className="text-gray-500 p-1"><X size={22} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Project name *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blue WRX Flip"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Make</label>
              <input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Subaru"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="WRX"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2018"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Purchase price *</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="$0"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condition, issues, source..."
              rows={2}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 text-white rounded-xl py-4 text-lg font-black active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
