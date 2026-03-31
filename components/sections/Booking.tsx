'use client'

import { useState } from 'react'
import FadeIn from '@/components/ui/FadeIn'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventType: string
  eventDate: string
  guestCount: string
  location: string
  vision: string
  website: string // honeypot
}

const EVENT_TYPES = [
  'Private Chef Dinner',
  'Love That I Knead Supper Club',
  'Travel Chef',
  'Menu Consulting',
  'Cooking Experience',
]

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventType: '',
  eventDate: '',
  guestCount: '',
  location: '',
  vision: '',
  website: '',
}

export default function Booking() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const inputClass =
    'form-field bg-transparent border border-brown/20 px-[18px] py-3.5 font-jost text-[14px] text-brown outline-none transition-[border-color] duration-200 focus:border-gold placeholder:text-brown-mid/40 w-full'

  return (
    <section
      id="booking"
      className="bg-cream relative overflow-hidden"
      style={{
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(64px, 8.5vw, 120px)',
        paddingBottom: 'clamp(64px, 8.5vw, 120px)',
      }}
    >
      {/* Ghost SAVOR text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-cormorant font-semibold whitespace-nowrap pointer-events-none select-none leading-none"
        style={{ fontSize: 'clamp(80px, 20vw, 200px)', color: 'rgba(201,151,58,0.04)' }}
        aria-hidden
      >
        SAVOR
      </div>

      <div
        className="text-center relative z-10"
        style={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <FadeIn>
          <p className="font-cormorant text-[20px] italic text-terracotta mb-4 tracking-[0.05em]">
            Reserve Your Experience
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="font-cormorant font-light text-brown leading-[1.1] mb-7"
            style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}
          >
            Let&rsquo;s create something
            <br />
            <em className="italic text-terracotta">extraordinary</em> together
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p
            className="text-[16px] leading-[1.8] text-brown-mid font-light"
            style={{ marginBottom: '50px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}
          >
            Whether you&rsquo;re planning an intimate dinner, a wedding, or a culinary experience
            unlike anything you&rsquo;ve had — Nana is available for private events across New
            York, Philadelphia, and Accra.
          </p>
        </FadeIn>

        {status === 'success' ? (
          <FadeIn>
            <div className="py-16 text-center">
              <p className="font-cormorant text-[28px] italic text-terracotta mb-4">
                Your inquiry has been received.
              </p>
              <p className="text-[15px] text-brown-mid font-light">
                Nana will be in touch within 24 hours.
              </p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.3}>
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot — hidden from users, visible to bots */}
              <div style={{ display: 'none' }} aria-hidden>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-5">
                {/* First Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    First Name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Last Name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Email <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (000) 000-0000"
                    className={inputClass}
                  />
                </div>

                {/* Event Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Event Type <span className="text-terracotta">*</span>
                  </label>
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    required
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>
                      Select a service
                    </option>
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Event Date
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={form.eventDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Guest Count */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    name="guestCount"
                    value={form.guestCount}
                    onChange={handleChange}
                    placeholder="Number of guests"
                    min="1"
                    className={inputClass}
                  />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Location / City
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="New York, Philadelphia, Accra, or Other"
                    className={inputClass}
                  />
                </div>

                {/* Vision — full width */}
                <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-brown-mid font-semibold">
                    Tell Nana About Your Vision
                  </label>
                  <textarea
                    name="vision"
                    value={form.vision}
                    onChange={handleChange}
                    placeholder="Share details about your event, dietary needs, or what you're hoping to experience..."
                    rows={4}
                    maxLength={2000}
                    className={`${inputClass} resize-y min-h-[100px]`}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-[13px] text-terracotta mb-4 text-left">{errorMsg}</p>
              )}

              <div className="text-center mt-2.5">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-gold text-brown border-0 font-jost text-[13px] font-semibold tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 hover:bg-gold-light hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{ paddingLeft: 'clamp(32px, 6vw, 60px)', paddingRight: 'clamp(32px, 6vw, 60px)', paddingTop: '18px', paddingBottom: '18px' }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </FadeIn>
        )}
      </div>
    </section>
  )
}
