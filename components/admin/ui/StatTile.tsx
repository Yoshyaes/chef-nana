export default function StatTile({
  value,
  label,
  accent = false,
  onClick,
}: {
  value: React.ReactNode
  label: string
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        padding: '13px 14px',
        boxShadow: '0 1px 2px rgba(42,35,32,.04), 0 6px 20px rgba(42,35,32,.06)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 27, fontWeight: 500, lineHeight: 1, color: accent ? 'var(--gold)' : 'var(--brown)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted-2)', marginTop: 6, letterSpacing: 0.2 }}>
        {label}
      </div>
    </div>
  )
}
