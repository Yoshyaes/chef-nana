import Card from '@/components/admin/ui/Card'

export default function SequencesPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 500, marginBottom: 16 }}>Sequences</h1>
      <Card style={{ border: '1px dashed var(--border-hairline)', padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', marginBottom: 8 }}>Coming in Phase 2</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
          Multi-step follow-up sequences with configurable delays and pre-approved templates. Leads will automatically advance through steps — with your approval at each send.
        </p>
      </Card>
    </div>
  )
}
