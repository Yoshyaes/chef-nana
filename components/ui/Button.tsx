'use client'

import Link from 'next/link'

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'green'
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export default function Button({
  variant = 'primary',
  href,
  onClick,
  type = 'button',
  disabled = false,
  children,
  className = '',
}: ButtonProps) {
  const base =
    'inline-block font-jost text-[12px] font-semibold tracking-[0.18em] uppercase px-9 py-4 transition-all duration-200 cursor-pointer border-0 hover:-translate-y-0.5'

  const variants: Record<string, string> = {
    primary: 'bg-gold text-brown hover:bg-gold-light',
    outline: 'bg-transparent text-cream border border-cream/35 hover:border-gold-light',
    green: 'bg-green text-cream hover:bg-green-light',
  }

  const classes = `${base} ${variants[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${classes} disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0`}
    >
      {children}
    </button>
  )
}
