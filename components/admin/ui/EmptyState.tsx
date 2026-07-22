export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
      {icon && (
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--surface-alt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', marginBottom: 14, fontSize: 22,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', marginBottom: subtitle ? 6 : 0 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--text-muted-2)', lineHeight: 1.5, maxWidth: 280 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
