import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID
const MAX_SHORT_FIELD = 100

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const firstName = String(raw.firstName ?? '').trim()
    const lastName = String(raw.lastName ?? '').trim()
    const email = String(raw.email ?? '').trim()
    const phone = String(raw.phone ?? '').trim()
    const eventType = String(raw.eventType ?? '').trim()
    const eventDate = String(raw.eventDate ?? '').trim()
    const guestCount = String(raw.guestCount ?? '').trim()
    const location = String(raw.location ?? '').trim()
    const vision = String(raw.vision ?? '').trim()
    const website = String(raw.website ?? '').trim() // honeypot

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

    if ([firstName, lastName, phone, location].some(f => f.length > MAX_SHORT_FIELD)) {
      return NextResponse.json(
        { success: false, message: 'One of the fields is too long.' },
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

    if (vision.length > 2000) {
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

    // Create (or find) the lead and route this inquiry into the same reply pipeline used for
    // genuine email replies — this is the source of truth, independent of whether any email
    // below actually sends. Previously this endpoint only sent transactional emails and relied
    // on the Gmail inbox poller to somehow reconstruct a lead afterwards; since the notification
    // email's sender identity ("Chef Nana Website <...>") isn't the client, every inquiry ended
    // up misattributed to a single bogus lead and any approved reply went nowhere.
    const supabase = await createServiceClient()

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let leadId: string
    if (existingLead) {
      leadId = existingLead.id as string
    } else {
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: `${firstName} ${lastName}`,
          email,
          type: eventType,
          market: location || null,
          source: 'website_contact_form',
        })
        .select('id')
        .single()

      if (leadError || !newLead) throw new Error(leadError?.message ?? 'Failed to create lead')
      leadId = newLead.id as string
    }

    const inquiryDetails = [
      `Event type: ${eventType}`,
      eventDate && `Event date: ${eventDate}`,
      guestCount && `Guest count: ${guestCount}`,
      location && `Location: ${location}`,
      phone && `Phone: ${phone}`,
      `Email: ${email}`,
    ].filter(Boolean).join('\n')

    const inquiryBody = `New booking inquiry submitted through chefnanawilmot.com.\n\n${inquiryDetails}${vision ? `\n\nTheir vision:\n${vision}` : ''}`

    await inngest.send({
      name: 'email/inbound.received',
      data: {
        leadId,
        from: email,
        subject: `New Booking Inquiry — ${eventType} — ${firstName} ${lastName}`,
        body: inquiryBody,
        gmailMessageId: `contact-form-${randomUUID()}`,
      },
    }).catch(() => { /* lead is saved regardless — draft generation can be retriggered from the admin */ })

    // Build confirmation email HTML (includes inquiry details) — best-effort, never blocks the
    // lead from being recorded above.
    const confirmationHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #F7F1E8; color: #1E1008;">
        <h1 style="font-size: 28px; font-weight: 300; margin-bottom: 8px; color: #2C1A0E;">
          We received your inquiry, ${escapeHtml(firstName)}.
        </h1>
        <p style="font-size: 16px; line-height: 1.8; color: #5C3A22; margin: 24px 0; font-style: italic;">
          Thank you for reaching out. I will be in touch within 24 hours to discuss your event and how we can make it something your guests will never forget.
        </p>
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #5C3A22; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Inquiry Details</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold; width: 140px;">Name</td><td>${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Email</td><td>${escapeHtml(email)}</td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Phone</td><td>${escapeHtml(phone)}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Type</td><td>${escapeHtml(eventType)}</td></tr>
          ${eventDate ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Event Date</td><td>${escapeHtml(eventDate)}</td></tr>` : ''}
          ${guestCount ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Guest Count</td><td>${escapeHtml(guestCount)}</td></tr>` : ''}
          ${location ? `<tr><td style="padding: 8px 0; color: #5C3A22; font-weight: bold;">Location</td><td>${escapeHtml(location)}</td></tr>` : ''}
        </table>
        ${vision ? `
        <hr style="border: none; border-top: 1px solid rgba(201,151,58,0.3); margin: 24px 0;" />
        <p style="font-size: 12px; color: #5C3A22; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Vision</p>
        <p style="font-size: 14px; line-height: 1.7; color: #2C1A0E;">${escapeHtml(vision)}</p>
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

    const resend = getResend()
    await resend.emails.send({
      from: 'Chef Nana Araba Wilmot <onboarding@resend.dev>',
      to: [email],
      subject: `We received your inquiry, ${firstName}`,
      html: confirmationHtml,
    }).catch(() => { /* best-effort — the lead and draft are already saved */ })

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
