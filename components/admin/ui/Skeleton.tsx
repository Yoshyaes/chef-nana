const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface-alt), #f3ece0, var(--surface-alt))',
  backgroundSize: '200% 100%',
  animation: 'admin-shimmer 1.4s ease-in-out infinite',
  borderRadius: 8,
}

export function SkeletonBase({ style }: { style?: React.CSSProperties }) {
  return (
    <>
      <style>{`
        @keyframes admin-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ ...shimmerStyle, ...style }} />
    </>
  )
}

export function SkeletonRow() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-hairline)',
      borderRadius: 14, padding: '12px 13px',
    }}>
      <SkeletonBase style={{ height: 13, width: '45%', marginBottom: 8 }} />
      <SkeletonBase style={{ height: 11, width: '70%', marginBottom: 8 }} />
      <SkeletonBase style={{ height: 10, width: '30%' }} />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-lg)', padding: 14,
    }}>
      <SkeletonBase style={{ height: 14, width: '55%', marginBottom: 10 }} />
      <SkeletonBase style={{ height: 11, width: '35%', marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <SkeletonBase style={{ height: 18, width: 60, borderRadius: 7 }} />
        <SkeletonBase style={{ height: 18, width: 80, borderRadius: 7 }} />
      </div>
    </div>
  )
}
