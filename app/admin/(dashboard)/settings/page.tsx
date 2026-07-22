'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/admin/ui/Card'
import Button from '@/components/admin/ui/Button'

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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border-hairline)',
  borderRadius: 8, fontSize: 13, color: 'var(--brown)', background: 'var(--surface)',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }
const sectionStyle: React.CSSProperties = { padding: 24, marginBottom: 20 }

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

  if (!settings) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading…</div>

  if (settings.notConfigured) return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 500, marginBottom: 24 }}>Settings</h1>
      <Card style={{ background: '#fef2f0', border: '1px solid #f5c6bb', padding: 24 }}>
        <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>Supabase not configured</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted-2)', lineHeight: 1.7 }}>
          Add these three environment variables to Vercel to enable the assistant:
          <ul style={{ marginTop: 10, paddingLeft: 20 }}>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
          </ul>
          Find them in your Supabase project → Settings → API.
        </div>
      </Card>
    </div>
  )

  const spendPct = Math.min(100, (settings.current_month_spend / settings.monthly_budget_cap) * 100)

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 500, marginBottom: 32 }}>Settings</h1>

      <form onSubmit={handleSave}>
        <Card style={sectionStyle}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 16 }}>API Keys</div>

          {[
            { label: 'Anthropic API key', key: 'anthropic', value: anthropicKey, set: setAnthropicKey, isSet: settings.anthropicKeySet, placeholder: 'sk-ant-…' },
            { label: 'Apollo API key', key: 'apollo', value: apolloKey, set: setApolloKey, isSet: settings.apolloKeySet, placeholder: 'apollo_…' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                {f.label} {f.isSet && <span style={{ color: 'var(--success)', fontSize: 11 }}>✓ Connected</span>}
              </label>
              <input
                type="password"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.isSet ? '••••••••••••••••' : f.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-alt)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brown)', marginBottom: 8 }}>
              <span>API spend this month</span>
              <span style={{ fontWeight: 600 }}>${settings.current_month_spend.toFixed(2)} / ${settings.monthly_budget_cap}</span>
            </div>
            <div style={{ height: 6, background: 'var(--chip-bg)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${spendPct}%`, background: spendPct >= 80 ? 'var(--danger)' : 'var(--gold)', borderRadius: 3 }} />
            </div>
            {spendPct >= 80 && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>⚠ Approaching budget cap</div>}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Monthly budget cap ($)</label>
            <input type="number" value={settings.monthly_budget_cap} onChange={e => setSettings(p => p ? { ...p, monthly_budget_cap: +e.target.value } : p)}
              style={{ ...inputStyle, width: 120 }} />
          </div>
        </Card>

        <Card style={sectionStyle}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 4 }}>Your voice</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Any additional notes on tone, things to always or never say, or context about your current focus. Notes you add via the Discord &quot;Coach&quot; button land here too — edit or delete any line to stop applying it.</div>
          <textarea
            value={settings.brand_voice_notes}
            onChange={e => setSettings(p => p ? { ...p, brand_voice_notes: e.target.value } : p)}
            rows={6}
            placeholder="e.g. I'm focused on Hamptons families right now. Don't pitch corporate events unless they reach out first."
            style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="approve" checked={settings.approve_before_sending} onChange={e => setSettings(p => p ? { ...p, approve_before_sending: e.target.checked } : p)} />
            <label htmlFor="approve" style={{ fontSize: 13, color: 'var(--brown)' }}>Approve before sending (recommended)</label>
          </div>
        </Card>

        <Card style={sectionStyle}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 4 }}>Writing examples</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
            Paste 2–5 real emails you&apos;ve written — the AI will study your sentence rhythm, punctuation, and word choices and match them exactly. Include the full email text, separated by a blank line. The more varied the examples (first touch, reply, follow-up), the better.
          </div>
          <textarea
            value={settings.voice_examples}
            onChange={e => setSettings(p => p ? { ...p, voice_examples: e.target.value } : p)}
            rows={12}
            placeholder={`Paste your actual sent emails here. For example:\n\nHey Sarah,\n\nSaw the estate listing and immediately thought of the Hamptons dinners I did last summer...\n\n— Nana\n\n---\n\nHi Marcus,\n\nThanks for the quick reply. Yes, I can absolutely do 80 people for the April retreat...`}
            style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Card>

        <Card style={sectionStyle}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Email sending</div>
          <label style={labelStyle}>Sending domain</label>
          <input value={settings.sending_domain} onChange={e => setSettings(p => p ? { ...p, sending_domain: e.target.value } : p)}
            style={inputStyle} />
        </Card>

        <Button type="submit" disabled={saving}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>

      <Card style={{ ...sectionStyle, marginTop: 20 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Gmail inbox</div>
        {settings.gmailConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Connected</span>
              {settings.gmailConnectedAt && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                  since {new Date(settings.gmailConnectedAt).toLocaleDateString()}
                </span>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Checking georginasfoods@gmail.com every 10 minutes for replies from known leads.
              </div>
            </div>
            <a href="/api/admin/gmail/auth" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
              Reconnect
            </a>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted-2)', marginBottom: 12, lineHeight: 1.6 }}>
              Connect Gmail so the assistant can see replies from leads and auto-generate responses.
              Requires <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> in Vercel.
            </div>
            <a href="/api/admin/gmail/auth"><Button>Connect Gmail →</Button></a>
          </div>
        )}
      </Card>

      <Card style={{ ...sectionStyle, marginTop: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Discord notifications</div>
        {settings.discordConfigured ? (
          <div>
            <div style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              ✓ Configured — draft notifications with Approve/Reject buttons will appear in your Discord channel.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              To @-mention Nana and Jillian on every new draft (so it pings their devices),
              add <code>DISCORD_NANA_USER_ID</code> and <code>DISCORD_JILLIAN_USER_ID</code> to
              Vercel (right-click their name in Discord with Developer Mode on → Copy User ID).
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={discordTesting}
              onClick={async () => {
                setDiscordTesting(true)
                setDiscordTestResult(null)
                const res = await fetch('/api/admin/discord/test', { method: 'POST' })
                const data = await res.json()
                setDiscordTestResult(res.ok ? '✓ Test notification sent — check your Discord channel' : `✗ ${data.error}`)
                setDiscordTesting(false)
              }}
            >
              {discordTesting ? 'Sending…' : 'Send test notification →'}
            </Button>
            {discordTestResult && (
              <div style={{ fontSize: 12, marginTop: 8, color: discordTestResult.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>
                {discordTestResult}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted-2)', lineHeight: 1.7 }}>
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
      </Card>

      <Card style={{ padding: 24, marginTop: 4 }}>
        <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 12 }}>Find leads via Apollo</div>
        <form onSubmit={handleApolloSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g. estate manager Hamptons family office"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <Button type="submit" size="sm" disabled={searching || !settings.apolloKeySet}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </form>
        {!settings.apolloKeySet && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Add your Apollo API key above to enable lead search.</div>}
        {searchResult && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 12 }}>✓ Found and imported {searchResult.count} leads to your pipeline.</div>}
      </Card>
    </div>
  )
}
