import Card from '@/components/admin/ui/Card'
import { Chip, StagePill } from '@/components/admin/ui/Chip'
import type { Lead } from '@/hooks/admin/useLeads'

export default function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--brown)' }}>{lead.name}</div>
          {lead.organization && (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{lead.organization}</div>
          )}
        </div>
        <StagePill stage={lead.stage} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {lead.market && <Chip>{lead.market}</Chip>}
        {lead.source && <Chip>{lead.source}</Chip>}
        {lead.is_recurring && <Chip style={{ background: '#e8f0ea', color: 'var(--success)' }}>Recurring</Chip>}
      </div>
      {(lead.fit_score != null || lead.est_annual_value != null) && (
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12 }}>
          {lead.fit_score != null && (
            <span style={{ color: lead.fit_score >= 80 ? 'var(--success)' : 'var(--gold)', fontWeight: 600 }}>
              {lead.fit_score} fit
            </span>
          )}
          {lead.est_annual_value != null && (
            <span style={{ color: 'var(--text-muted)' }}>~${(lead.est_annual_value / 1000).toFixed(0)}k/yr</span>
          )}
        </div>
      )}
    </Card>
  )
}
