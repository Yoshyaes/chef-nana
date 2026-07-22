'use client'

import BottomSheet from '@/components/admin/ui/BottomSheet'
import { STAGES } from '@/lib/admin/stages'

export default function StageSheet({
  open,
  onOpenChange,
  currentStage,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStage?: string
  onSelect: (stage: string) => void
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Change stage">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => {
              onSelect(s.key)
              onOpenChange(false)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: currentStage === s.key ? 'var(--chip-bg)' : 'transparent',
              fontSize: 14, fontWeight: currentStage === s.key ? 600 : 400, color: 'var(--brown)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            {s.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
