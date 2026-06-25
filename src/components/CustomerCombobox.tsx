import { useState, useRef, useEffect } from 'react'
import { User, Phone, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'

interface Props {
  customers: Customer[]
  selected: Customer | null
  onSelect: (c: Customer | null) => void
  onCreated: (c: Customer) => void
}

export function CustomerCombobox({ customers, selected, onSelect, onCreated }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.length === 0 ? customers : customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.phone || '').includes(query)
  )

  const handleSelect = (c: Customer) => {
    onSelect(c)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
  }

  const createCustomer = async () => {
    if (!newName.trim()) { setCreateErr('Name required'); return }
    setCreating(true); setCreateErr('')
    const { data, error } = await supabase.from('customers').insert({
      name: newName.trim(),
      phone: newPhone.trim() || null,
    }).select().single()
    if (error) { setCreateErr(error.message); setCreating(false); return }
    onCreated(data as Customer)
    onSelect(data as Customer)
    setShowCreate(false)
    setNewName(''); setNewPhone('')
    setOpen(false)
    setCreating(false)
  }

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  if (selected) {
    return (
      <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={16} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">{selected.name}</p>
            {selected.phone && <p className="text-gray-400 text-xs flex items-center gap-1"><Phone size={10} />{selected.phone}</p>}
          </div>
        </div>
        <button onClick={handleClear} className="text-gray-500 p-1 active:text-gray-300">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 gap-2">
        <User size={16} className="text-gray-500 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search or add customer..."
          className="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-500"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 && query && (
            <p className="text-gray-500 text-sm px-4 py-3">No match for "{query}"</p>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => handleSelect(c)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-700 active:bg-gray-700 border-b border-gray-700/50 last:border-0">
              <User size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">{c.name}</p>
                {c.phone && <p className="text-gray-400 text-xs">{c.phone}</p>}
              </div>
            </button>
          ))}
          <button onClick={() => { setShowCreate(true); setOpen(false); setNewName(query) }}
            className="w-full px-4 py-3 flex items-center gap-2 text-blue-400 font-bold text-sm border-t border-gray-700">
            <Plus size={14} /> New customer
          </button>
        </div>
      )}

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-gray-900 rounded-t-3xl w-full max-w-lg mx-auto p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">New Customer</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Full name *"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500" />
              {createErr && <p className="text-red-400 text-sm">{createErr}</p>}
              <button onClick={createCustomer} disabled={creating}
                className="w-full bg-blue-500 text-white rounded-xl py-4 font-black active:scale-95 transition-transform disabled:opacity-50">
                {creating ? 'Saving...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
