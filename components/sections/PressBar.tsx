const PUBLICATIONS = [
  'Bon Appétit',
  'The New York Times',
  'Forbes',
  'Eater',
  'Cherry Bombe',
  'Bravo · Top Chef S23',
  'James Beard Foundation',
  'Philadelphia Museum of Art',
]

function MarqueeGroup() {
  return (
    <div className="flex items-center shrink-0">
      {PUBLICATIONS.map((name, i) => (
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

export default function PressBar() {
  return (
    <div className="bg-brown overflow-hidden" style={{ paddingTop: '18px', paddingBottom: '18px' }}>
      <div className="flex animate-marquee whitespace-nowrap">
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  )
}
