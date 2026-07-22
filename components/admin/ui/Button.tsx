'use client'

type Variant = 'brass' | 'green' | 'ghost' | 'danger'

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  brass: { background: 'var(--gold)', color: '#fff', border: 'none' },
  green: { background: 'var(--success)', color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: 'var(--brown)', border: '1px solid var(--border-hairline)' },
  danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--border-hairline)' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
}

export default function Button({ variant = 'brass', size = 'md', style, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...VARIANT_STYLES[variant],
        borderRadius: size === 'sm' ? 'var(--radius-sm)' : 'var(--radius-md)',
        padding: size === 'sm' ? '8px 13px' : '11px 18px',
        fontSize: size === 'sm' ? 12.5 : 14,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s, box-shadow 0.15s',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
