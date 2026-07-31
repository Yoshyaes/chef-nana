interface SeatsLeftProps {
  capacity: number
  seatsSold: number
}

export default function SeatsLeft({ capacity, seatsSold }: SeatsLeftProps) {
  const left = Math.max(capacity - seatsSold, 0)
  const low = left > 0 && left <= Math.max(Math.round(capacity * 0.15), 3)

  return (
    <span
      className={`inline-block text-[12px] tracking-[0.15em] uppercase px-4 py-2 ${
        left === 0 ? 'bg-brown-mid text-cream' : low ? 'bg-gold text-brown' : 'bg-green text-cream'
      }`}
    >
      {left === 0 ? 'Sold out' : `${left} of ${capacity} seats left`}
    </span>
  )
}
