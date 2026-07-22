import type { DraftListItem } from '@/hooks/admin/useDrafts'

export default function DraftRow({ draft, selected }: { draft: DraftListItem; selected?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 14,
        padding: '12px 13px',
        boxShadow: '0 1px 2px rgba(42,35,32,.04), 0 6px 20px rgba(42,35,32,.06)',
        border: selected ? '1px solid var(--gold)' : '1px solid var(--border-hairline)',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--brown)' }}>
        {draft.leads?.name ?? 'Unknown lead'}
        {draft.leads?.organization && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {draft.leads.organization}</span>
        )}
      </div>
      <div style={{
        fontSize: 12.5, color: 'var(--text-muted-2)', marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {draft.subject}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {draft.channel} · {draft.status === 'edited' ? 'edited' : 'pending'}
      </div>
    </div>
  )
}
