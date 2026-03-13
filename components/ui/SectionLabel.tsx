interface SectionLabelProps {
  color?: 'terracotta' | 'gold' | 'green'
  center?: boolean
  children: React.ReactNode
}

export default function SectionLabel({
  color = 'terracotta',
  center = false,
  children,
}: SectionLabelProps) {
  const colors: Record<string, string> = {
    terracotta: 'text-terracotta',
    gold: 'text-gold',
    green: 'text-green',
  }

  const lineColors: Record<string, string> = {
    terracotta: 'bg-terracotta',
    gold: 'bg-gold',
    green: 'bg-green',
  }

  return (
    <div
      className={`flex items-center gap-3 text-[10px] font-jost font-semibold tracking-[0.3em] uppercase mb-5 ${colors[color]} ${center ? 'justify-center' : ''}`}
    >
      {center && <span className={`flex-1 h-px ${lineColors[color]}`} style={{ maxWidth: '40px' }} />}
      {children}
      {!center && <span className={`w-10 h-px ${lineColors[color]}`} />}
      {center && <span className={`flex-1 h-px ${lineColors[color]}`} style={{ maxWidth: '40px' }} />}
    </div>
  )
}
