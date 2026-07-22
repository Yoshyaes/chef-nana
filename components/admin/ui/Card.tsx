export default function Card({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 1px 2px rgba(42,35,32,.04), 0 6px 20px rgba(42,35,32,.06)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
