import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(key)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    if (!RESEND_AUDIENCE_ID) {
      return NextResponse.json({ success: true })
    }

    const resend = getResend()
    await resend.contacts.create({
      audienceId: RESEND_AUDIENCE_ID,
      email,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
