const DEFAULT_PUBLICATIONS = [
  'Bon Appétit',
  'The New York Times',
  'Forbes',
  'Eater',
  'Cherry Bombe',
  'Bravo · Top Chef S23',
  'James Beard Foundation',
  'Philadelphia Museum of Art',
]

function MarqueeGroup({ names }: { names: string[] }) {
  return (
    <div className="flex items-center shrink-0">
      {names.map((name, i) => (
        <span key={i} className="flex items-center shrink-0">
          <span
            className="font-cormorant text-[13px] italic tracking-[0.12em]"
            style={{ color: 'rgba(201,151,58,0.55)' }}
          >
            {name}
          </span>
          <span
            className="text-[8px] leading-none"
            style={{ margin: '0 clamp(16px, 3vw, 40px)', color: 'var(--gold)' }}
            aria-hidden
          >
            ✦
          </span>
        </span>
      ))}
    </div>
  )
}

interface PressBarProps {
  pressItems?: { name: string }[] | null
}

export default function PressBar({ pressItems }: PressBarProps) {
  const names = pressItems?.length ? pressItems.map((p) => p.name) : DEFAULT_PUBLICATIONS

  return (
    <a
      href="#press"
      onClick={(e) => {
        e.preventDefault()
        document.getElementById('press')?.scrollIntoView({ behavior: 'smooth' })
      }}
      className="block bg-brown overflow-hidden cursor-pointer no-underline"
      style={{ paddingTop: '18px', paddingBottom: '18px' }}
    >
      <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        <MarqueeGroup names={names} />
        <MarqueeGroup names={names} />
        <MarqueeGroup names={names} />
      </div>
    </a>
  )
}
