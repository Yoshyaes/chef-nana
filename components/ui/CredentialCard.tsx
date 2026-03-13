interface CredentialCardProps {
  year: string
  name: string
}

export default function CredentialCard({ year, name }: CredentialCardProps) {
  return (
    <div
      className="relative border border-gold/20 bg-gold/[0.03] overflow-hidden"
      style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '28px', paddingRight: '24px' }}
    >
      {/* Gold left accent bar */}
      <div className="absolute top-0 left-0 h-full bg-gold" style={{ width: '3px' }} />
      <div className="text-[11px] tracking-[0.15em] text-gold font-semibold mb-2">{year}</div>
      <div
        className="font-cormorant text-[16px] font-medium text-brown leading-snug"
        dangerouslySetInnerHTML={{ __html: name }}
      />
    </div>
  )
}
