'use client'

import { useState } from 'react'
import BottomSheet from '@/components/admin/ui/BottomSheet'
import Button from '@/components/admin/ui/Button'
import { useAddLead } from '@/hooks/admin/useLeads'

const MARKETS = ['Corporate events', 'Private dining', 'Weddings', 'Meal prep', 'Retreats', 'Other']

export default function AddLeadSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addLead = useAddLead()
  const [form, setForm] = useState({ name: '', organization: '', email: '', market: '', type: 'one-off' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    addLead.mutate(form, {
      onSuccess: () => {
        setForm({ name: '', organization: '', email: '', market: '', type: 'one-off' })
        onOpenChange(false)
      },
    })
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add a lead">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Organization</label>
          <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
            placeholder="Acme Corp"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="jane@example.com"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Market</label>
            <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14, background: 'var(--surface)' }}>
              <option value="">Select…</option>
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14, background: 'var(--surface)' }}>
              <option value="one-off">One-off</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} style={{ flex: 1 }}>Cancel</Button>
          <Button type="submit" disabled={addLead.isPending} style={{ flex: 1 }}>
            {addLead.isPending ? 'Adding…' : 'Add lead'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}
