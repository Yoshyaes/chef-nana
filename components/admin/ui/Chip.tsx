import { stageMeta } from '@/lib/admin/stages'

export function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: 'var(--chip-bg)',
        color: 'var(--text-muted-2)',
        fontSize: 10.5,
        fontWeight: 600,
        padding: '4px 9px',
        borderRadius: 7,
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function StagePill({ stage }: { stage: string }) {
  const meta = stageMeta(stage)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 100,
        background: meta.bg,
        color: meta.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label}
    </span>
  )
}
