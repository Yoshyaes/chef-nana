import Button from '@/components/admin/ui/Button'

export default function QueryError({
  message = "Couldn't load this — check your connection and try again.",
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '32px 24px', gap: 12,
    }}>
      <div style={{ fontSize: 13, color: 'var(--danger)' }}>{message}</div>
      <Button size="sm" variant="ghost" onClick={onRetry}>Try again</Button>
    </div>
  )
}
