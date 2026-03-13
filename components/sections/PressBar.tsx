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

export default function PressBar() {
  // Double the array for seamless infinite loop
  const items = [...PUBLICATIONS, ...PUBLICATIONS]

  return (
    <div className="bg-brown overflow-hidden" style={{ paddingTop: '18px', paddingBottom: '18px' }}>
      <div className="whitespace-nowrap animate-marquee" style={{ display: 'flex', gap: '60px' }}>
        {items.map((name, i) => (
          <span
            key={i}
            className="font-cormorant text-[13px] italic tracking-[0.12em] shrink-0"
            style={{ color: 'rgba(201,151,58,0.55)' }}
          >
            {name}
            {i < items.length - 1 && (
              <span style={{ margin: '0 30px', color: 'var(--gold)' }} aria-hidden>
                ✦
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
