import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const BOOKING_EMAIL = process.env.BOOKING_EMAIL ?? 'nana@georginasfoods.com'
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(key)
}

// Simple in-memory rate limiter: max 5 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const VALID_EVENT_TYPES = new Set([
  'Private Chef Dinner',
  'Love That I Knead Supper Club',
  'Travel Chef',
  'Menu Consulting',
  'Cooking Experience',
])

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (record.count >= 5) return false

  record.count++
  return true
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      eventType,
      eventDate,
      guestCount,
      location,
      vision,
      website, // honeypot
    } = body

    // Honeypot check — silently discard spam
    if (website) {
      return NextResponse.json({ success: true, message: 'Your inquiry has been received.' })
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'First and last name are required.' },
        { status: 400 }
      )
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid event type.' },
        { status: 400 }
      )
    }

    if (vision && vision.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Vision field exceeds maximum length.' },
        { status: 400 }
      )
    }

    // Rate limiting
    const ip = getIp(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again in an hour.' },
        { status: 429 }
      )
    }

    // Build notification email HTML
    const notificationHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #F7F1E8; color: #1E1008;">
        <h1 style="font-size: 28px; font-weight: 300; margin-bottom: 8px; color: #2C1A0E;">
          New Booking Inquiry
        </h1>
        <p style="font-size: 14px; color: #8C3F22; margin-bottom: 32px; font-style: italic;">
          ${eventType} — ${firstName} ${lastName}
        </p>
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin-bottom: 32px;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold; width: 140px;">Name</td><td>${firstName} ${lastName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Email</td><td><a href="mailto:${email}" style="color: #C9973A;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Phone</td><td>${phone}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Type</td><td>${eventType}</td></tr>
          ${eventDate ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Date</td><td>${eventDate}</td></tr>` : ''}
          ${guestCount ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Guest Count</td><td>${guestCount}</td></tr>` : ''}
          ${location ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Location</td><td>${location}</td></tr>` : ''}
        </table>
        ${vision ? `
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #5C3A22; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Their Vision</p>
        <p style="font-size: 14px; line-height: 1.7; color: #2C1A0E;">${vision}</p>
        ` : ''}
      </div>
    `

    // Build confirmation email HTML (includes inquiry details)
    const confirmationHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #F7F1E8; color: #1E1008;">
        <h1 style="font-size: 28px; font-weight: 300; margin-bottom: 8px; color: #2C1A0E;">
          We received your inquiry, ${firstName}.
        </h1>
        <p style="font-size: 16px; line-height: 1.8; color: #5C3A22; margin: 24px 0; font-style: italic;">
          Thank you for reaching out. I will be in touch within 24 hours to discuss your event and how we can make it something your guests will never forget.
        </p>
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #5C3A22; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Inquiry Details</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold; width: 140px;">Name</td><td>${firstName} ${lastName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Email</td><td>${email}</td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Phone</td><td>${phone}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Type</td><td>${eventType}</td></tr>
          ${eventDate ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Date</td><td>${eventDate}</td></tr>` : ''}
          ${guestCount ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Guest Count</td><td>${guestCount}</td></tr>` : ''}
          ${location ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Location</td><td>${location}</td></tr>` : ''}
        </table>
        ${vision ? `
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #5C3A22; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Vision</p>
        <p style="font-size: 14px; line-height: 1.7; color: #2C1A0E;">${vision}</p>
        ` : ''}
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 14px; line-height: 1.8; color: #5C3A22; margin: 16px 0;">
          In the meantime, feel free to explore upcoming <a href="https://chefnanawilmot.com/#supper" style="color: #C9973A;">Love That I Knead</a> events.
        </p>
        <p style="font-size: 15px; color: #2C1A0E; margin-top: 32px;">
          With warmth,
          <br />
          <em style="font-size: 18px;">— Nana</em>
        </p>
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 32px 0;" />
        <p style="font-size: 11px; color: #8C3F22; letter-spacing: 0.1em; text-transform: uppercase;">
          Chef Nana Araba Wilmot &nbsp;·&nbsp; New York &nbsp;·&nbsp; Philadelphia &nbsp;·&nbsp; Accra
        </p>
      </div>
    `

    // Send both emails in parallel
    const resend = getResend()
    const [notificationResult] = await Promise.allSettled([
      resend.emails.send({
        from: 'Chef Nana Website <onboarding@resend.dev>',
        to: [BOOKING_EMAIL],
        subject: `New Booking Inquiry — ${eventType} — ${firstName} ${lastName}`,
        html: notificationHtml,
        replyTo: email,
      }),
      resend.emails.send({
        from: 'Chef Nana Araba Wilmot <onboarding@resend.dev>',
        to: [email],
        subject: `We received your inquiry, ${firstName}`,
        html: confirmationHtml,
      }),
    ])

    if (notificationResult.status === 'rejected') {
      throw new Error('Failed to send notification email')
    }

    // Add to newsletter audience (non-blocking — don't fail the request if this errors)
    if (RESEND_AUDIENCE_ID) {
      resend.contacts.create({
        audienceId: RESEND_AUDIENCE_ID,
        email,
        firstName,
        lastName,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been received.',
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
