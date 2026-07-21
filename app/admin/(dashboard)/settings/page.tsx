'use client'

import { useEffect, useState } from 'react'

interface Settings {
  monthly_budget_cap: number
  current_month_spend: number
  brand_voice_notes: string
  voice_examples: string
  approve_before_sending: boolean
  sending_domain: string
  anthropicKeySet: boolean
  apolloKeySet: boolean
  gmailConnected: boolean
  gmailConnectedAt: string | null
  discordConfigured: boolean
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
  const [discordTesting, setDiscordTesting] = useState(false)
  const [discordTestResult, setDiscordTestResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings)
    // Show flash messages from OAuth redirects
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmailConnected')) window.history.replaceState({}, '', '/admin/settings')
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    const body: Record<string, unknown> = {
      monthly_budget_cap: settings.monthly_budget_cap,
      brand_voice_notes: settings.brand_voice_notes,
      voice_examples: settings.voice_examples,
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
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 4 }}>Your voice</div>
          <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 10 }}>Any additional notes on tone, things to always or never say, or context about your current focus. Notes you add via the Discord &quot;Coach&quot; button land here too — edit or delete any line to stop applying it.</div>
          <textarea
            value={settings.brand_voice_notes}
            onChange={e => setSettings(p => p ? { ...p, brand_voice_notes: e.target.value } : p)}
            rows={6}
            placeholder="e.g. I'm focused on Hamptons families right now. Don't pitch corporate events unless they reach out first."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="approve" checked={settings.approve_before_sending} onChange={e => setSettings(p => p ? { ...p, approve_before_sending: e.target.checked } : p)} />
            <label htmlFor="approve" style={{ fontSize: 13, color: 'var(--brown)' }}>Approve before sending (recommended)</label>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 4 }}>Writing examples</div>
          <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 10, lineHeight: 1.6 }}>
            Paste 2–5 real emails you&apos;ve written — the AI will study your sentence rhythm, punctuation, and word choices and match them exactly. Include the full email text, separated by a blank line. The more varied the examples (first touch, reply, follow-up), the better.
          </div>
          <textarea
            value={settings.voice_examples}
            onChange={e => setSettings(p => p ? { ...p, voice_examples: e.target.value } : p)}
            rows={12}
            placeholder={`Paste your actual sent emails here. For example:\n\nHey Sarah,\n\nSaw the estate listing and immediately thought of the Hamptons dinners I did last summer...\n\n— Nana\n\n---\n\nHi Marcus,\n\nThanks for the quick reply. Yes, I can absolutely do 80 people for the April retreat...`}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
          />
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

      {/* Gmail integration */}
      <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginTop: 20 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Gmail inbox</div>
        {settings.gmailConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: '#2D5F3D', fontSize: 13, fontWeight: 500 }}>✓ Connected</span>
              {settings.gmailConnectedAt && (
                <span style={{ color: '#9a7d5a', fontSize: 12, marginLeft: 8 }}>
                  since {new Date(settings.gmailConnectedAt).toLocaleDateString()}
                </span>
              )}
              <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 4 }}>
                Checking georginasfoods@gmail.com every 10 minutes for replies from known leads.
              </div>
            </div>
            <a href="/api/admin/gmail/auth"
              style={{ fontSize: 12, color: '#9a7d5a', textDecoration: 'underline', cursor: 'pointer' }}>
              Reconnect
            </a>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: '#7a6652', marginBottom: 12, lineHeight: 1.6 }}>
              Connect Gmail so the assistant can see replies from leads and auto-generate responses.
              Requires <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> in Vercel.
            </div>
            <a href="/api/admin/gmail/auth">
              <button
                disabled={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                style={{ padding: '9px 20px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Connect Gmail →
              </button>
            </a>
          </div>
        )}
      </section>

      {/* Discord integration */}
      <section style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginTop: 20 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Discord notifications</div>
        {settings.discordConfigured ? (
          <div>
            <div style={{ color: '#2D5F3D', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              ✓ Configured — draft notifications with Approve/Reject buttons will appear in your Discord channel.
            </div>
            <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 12 }}>
              To @-mention Nana and Jillian on every new draft (so it pings their devices),
              add <code>DISCORD_NANA_USER_ID</code> and <code>DISCORD_JILLIAN_USER_ID</code> to
              Vercel (right-click their name in Discord with Developer Mode on → Copy User ID).
            </div>
            <button
              onClick={async () => {
                setDiscordTesting(true)
                setDiscordTestResult(null)
                const res = await fetch('/api/admin/discord/test', { method: 'POST' })
                const data = await res.json()
                setDiscordTestResult(res.ok ? '✓ Test notification sent — check your Discord channel' : `✗ ${data.error}`)
                setDiscordTesting(false)
              }}
              disabled={discordTesting}
              style={{ padding: '8px 16px', background: '#f0e8db', color: 'var(--brown)', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
            >
              {discordTesting ? 'Sending…' : 'Send test notification →'}
            </button>
            {discordTestResult && (
              <div style={{ fontSize: 12, marginTop: 8, color: discordTestResult.startsWith('✓') ? '#2D5F3D' : '#B85A35' }}>
                {discordTestResult}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#7a6652', lineHeight: 1.7 }}>
            Not configured. Add these to Vercel to enable Discord notifications:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><code>DISCORD_BOT_TOKEN</code></li>
              <li><code>DISCORD_PUBLIC_KEY</code></li>
              <li><code>DISCORD_APPLICATION_ID</code></li>
              <li><code>DISCORD_CHANNEL_ID</code></li>
              <li><code>DISCORD_NANA_USER_ID</code> <em>(optional, @-mentions Nana on new drafts)</em></li>
              <li><code>DISCORD_JILLIAN_USER_ID</code> <em>(optional, @-mentions Jillian on new drafts)</em></li>
            </ul>
            Set Interactions Endpoint URL in Discord Developer Portal to{' '}
            <code>https://www.chefnanawilmot.com/api/discord/interactions</code>
          </div>
        )}
      </section>

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
