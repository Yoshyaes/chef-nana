interface EventCardProps {
  date: string
  location: string
  title: string
  price: string
}

export default function EventCard({ date, location, title, price }: EventCardProps) {
  return (
    <div
      className="border border-gold/20 mb-2.5 flex justify-between items-center backdrop-blur-sm"
      style={{
        background: 'rgba(14,36,22,0.8)',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '18px',
        paddingBottom: '18px',
      }}
    >
      <div>
        <div className="text-[12px] tracking-[0.15em] text-gold uppercase mb-1">
          {date} · {location}
        </div>
        <div className="font-cormorant text-[18px] text-cream italic">{title}</div>
      </div>
      <div className="text-[15px] font-semibold text-gold-light ml-4 shrink-0">{price}</div>
    </div>
  )
}
