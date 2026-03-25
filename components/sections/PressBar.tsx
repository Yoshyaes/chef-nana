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
    <div className="flex shrink-0" style={{ gap: 'clamp(24px, 5vw, 60px)' }}>
      {PUBLICATIONS.map((name, i) => (
        <span
          key={i}
          className="font-cormorant text-[13px] italic tracking-[0.12em] shrink-0"
          style={{ color: 'rgba(201,151,58,0.55)' }}
        >
          {name}
          <span style={{ margin: '0 clamp(10px, 2.5vw, 30px)', color: 'var(--gold)' }} aria-hidden>
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
