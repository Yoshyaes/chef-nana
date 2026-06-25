'use client'

import { useEffect, useState } from 'react'

interface Settings {
  monthly_budget_cap: number
  current_month_spend: number
  brand_voice_notes: string
  approve_before_sending: boolean
  sending_domain: string
  anthropicKeySet: boolean
  apolloKeySet: boolean
  notConfigured?: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [anthropicKey, setAnthropicKey] = useState('')
  const [apolloKey, setApolloKey] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<{ count: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    const body: Record<string, unknown> = {
      monthly_budget_cap: settings.monthly_budget_cap,
      brand_voice_notes: settings.brand_voice_notes,
      approve_before_sending: settings.approve_before_sending,
      sending_domain: settings.sending_domain,
    }
    if (anthropicKey) body.anthropic_api_key = anthropicKey
    if (apolloKey) body.apollo_api_key = apolloKey
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (anthropicKey) setAnthropicKey('')
    if (apolloKey) setApolloKey('')
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings)
  }

  async function handleApolloSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    const res = await fetch('/api/admin/apollo/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, limit: 25 }),
    })
    const data = await res.json()
    setSearchResult(data)
    setSearching(false)
  }

  if (!settings) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading…</div>

  if (settings.notConfigured) return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400, marginBottom: 24 }}>Settings</h1>
      <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 600, color: '#B85A35', marginBottom: 8 }}>Supabase not configured</div>
        <div style={{ fontSize: 13, color: '#5c3a22', lineHeight: 1.7 }}>
          Add these three environment variables to Vercel to enable the assistant:
          <ul style={{ marginTop: 10, paddingLeft: 20 }}>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
          </ul>
          Find them in your Supabase project → Settings → API.
        </div>
      </div>
    </div>
  )

  const spendPct = Math.min(100, (settings.current_month_spend / settings.monthly_budget_cap) * 100)

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400, marginBottom: 32 }}>Settings</h1>

      <form onSubmit={handleSave}>
        <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 16 }}>API Keys</div>

          {[
            { label: 'Anthropic API key', key: 'anthropic', value: anthropicKey, set: setAnthropicKey, isSet: settings.anthropicKeySet, placeholder: 'sk-ant-…' },
            { label: 'Apollo API key', key: 'apollo', value: apolloKey, set: setApolloKey, isSet: settings.apolloKeySet, placeholder: 'apollo_…' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>
                {f.label} {f.isSet && <span style={{ color: '#2D5F3D', fontSize: 11 }}>✓ Connected</span>}
              </label>
              <input
                type="password"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.isSet ? '••••••••••••••••' : f.placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)' }}
              />
            </div>
          ))}

          <div style={{ marginTop: 20, padding: '16px', background: '#faf7f3', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brown)', marginBottom: 8 }}>
              <span>API spend this month</span>
              <span style={{ fontWeight: 600 }}>${settings.current_month_spend.toFixed(2)} / ${settings.monthly_budget_cap}</span>
            </div>
            <div style={{ height: 6, background: '#f0e8db', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${spendPct}%`, background: spendPct >= 80 ? '#B85A35' : 'var(--gold)', borderRadius: 3 }} />
            </div>
            {spendPct >= 80 && <div style={{ fontSize: 12, color: '#B85A35', marginTop: 8 }}>⚠ Approaching budget cap</div>}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Monthly budget cap ($)</label>
            <input type="number" value={settings.monthly_budget_cap} onChange={e => setSettings(p => p ? { ...p, monthly_budget_cap: +e.target.value } : p)}
              style={{ width: 120, padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13 }} />
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Your voice</div>
          <textarea
            value={settings.brand_voice_notes}
            onChange={e => setSettings(p => p ? { ...p, brand_voice_notes: e.target.value } : p)}
            rows={4}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="approve" checked={settings.approve_before_sending} onChange={e => setSettings(p => p ? { ...p, approve_before_sending: e.target.checked } : p)} />
            <label htmlFor="approve" style={{ fontSize: 13, color: 'var(--brown)' }}>Approve before sending (recommended)</label>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Email sending</div>
          <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Sending domain</label>
          <input value={settings.sending_domain} onChange={e => setSettings(p => p ? { ...p, sending_domain: e.target.value } : p)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)' }} />
        </section>

        <button type="submit" disabled={saving}
          style={{ padding: '10px 24px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginTop: 24 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Find leads via Apollo</div>
        <form onSubmit={handleApolloSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g. estate manager Hamptons family office"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13 }}
          />
          <button type="submit" disabled={searching || !settings.apolloKeySet}
            style={{ padding: '8px 16px', background: settings.apolloKeySet ? 'var(--gold)' : '#e5d9c9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: settings.apolloKeySet ? 'pointer' : 'not-allowed' }}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>
        {!settings.apolloKeySet && <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 8 }}>Add your Apollo API key above to enable lead search.</div>}
        {searchResult && <div style={{ fontSize: 13, color: '#2D5F3D', marginTop: 12 }}>✓ Found and imported {searchResult.count} leads to your pipeline.</div>}
      </section>
    </div>
  )
}
