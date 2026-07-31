'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Attendee {
  id: string
  name: string
  email: string
  checked_in: boolean
  checked_in_at?: string | null
  qr_token?: string
  events?: { title: string; event_date?: string } | null
}

type Result = { kind: 'ok'; attendee: Attendee } | { kind: 'error'; message: string; attendee?: Attendee } | null

const SCANNER_ID = 'checkin-qr-scanner'

function passcodeHeader(passcode: string) {
  return { 'x-checkin-passcode': passcode, 'Content-Type': 'application/json' }
}

function PasscodeGate({ onUnlocked }: { onUnlocked: (passcode: string) => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setError(null)
    const res = await fetch('/api/checkin/verify', { method: 'POST', headers: passcodeHeader(passcode) })
    setChecking(false)
    if (!res.ok) {
      setError('Wrong passcode.')
      return
    }
    sessionStorage.setItem('checkin_passcode', passcode)
    onUnlocked(passcode)
  }

  return (
    <div className="min-h-screen bg-cream-dark flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full" style={{ maxWidth: 320 }}>
        <h1 className="font-cormorant text-brown text-[32px] mb-6 text-center">Door check-in</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full text-center text-[18px] px-4 py-4 mb-3 border border-brown-mid/30 bg-white"
        />
        {error && <p className="text-[13px] text-center mb-3" style={{ color: '#B85A35' }}>{error}</p>}
        <button
          type="submit"
          disabled={checking || !passcode}
          className="w-full bg-green text-cream text-[13px] tracking-[0.18em] uppercase px-6 py-4 disabled:opacity-60"
        >
          {checking ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

function ResultBanner({ result, onDismiss }: { result: Result; onDismiss: () => void }) {
  if (!result) return null

  const bg = result.kind === 'ok' ? 'bg-green' : 'bg-[#B85A35]'
  const heading =
    result.kind === 'ok'
      ? 'Checked in'
      : result.message === 'already_checked_in'
        ? 'Already checked in'
        : result.message === 'refunded'
          ? 'Refunded — do not admit'
          : result.message === 'not_found'
            ? 'Ticket not found'
            : 'Error'

  return (
    <div className={`${bg} text-cream p-5 mb-4`} onClick={onDismiss}>
      <div className="text-[12px] tracking-[0.18em] uppercase opacity-80 mb-1">{heading}</div>
      {result.attendee && (
        <>
          <div className="text-[20px] font-medium">{result.attendee.name}</div>
          <div className="text-[13px] opacity-80">{result.attendee.email}</div>
          {result.attendee.events?.title && (
            <div className="text-[13px] opacity-80 mt-1">{result.attendee.events.title}</div>
          )}
        </>
      )}
      <div className="text-[11px] opacity-70 mt-2">Tap to dismiss</div>
    </div>
  )
}

function Scanner({ passcode, onResult }: { passcode: string; onResult: (r: Result) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const checkInInFlight = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async decodedText => {
          if (checkInInFlight.current) return
          checkInInFlight.current = true
          await submitCheckIn(decodedText.trim(), passcode, onResult)
          checkInInFlight.current = false
        },
        () => {
          // per-frame decode failures are expected while no code is in view — ignore
        }
      )
      .catch(() => setScanError('Could not access the camera. Check permissions, or search by name below.'))

    return () => {
      scanner.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div id={SCANNER_ID} style={{ width: '100%', maxWidth: 360, margin: '0 auto' }} />
      {scanError && <p className="text-[13px] text-center mt-3" style={{ color: '#B85A35' }}>{scanError}</p>}
    </div>
  )
}

async function submitCheckIn(qrToken: string, passcode: string, onResult: (r: Result) => void) {
  const res = await fetch('/api/checkin', {
    method: 'POST',
    headers: passcodeHeader(passcode),
    body: JSON.stringify({ qr_token: qrToken }),
  })
  const body = await res.json()

  if (res.ok) {
    onResult({ kind: 'ok', attendee: body.attendee })
  } else {
    onResult({ kind: 'error', message: body.error, attendee: body.attendee })
  }
}

function NameSearch({ passcode, onResult }: { passcode: string; onResult: (r: Result) => void }) {
  const [q, setQ] = useState('')
  const [matches, setMatches] = useState<Attendee[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (q.trim().length < 2) {
        setMatches([])
        return
      }
      setSearching(true)
      const res = await fetch(`/api/checkin/search?q=${encodeURIComponent(q)}`, {
        headers: { 'x-checkin-passcode': passcode },
      })
      const body = await res.json()
      setMatches(body.attendees ?? [])
      setSearching(false)
    }, 250)
    return () => clearTimeout(timeout)
  }, [q, passcode])

  return (
    <div>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search by name"
        className="w-full text-[16px] px-4 py-3 mb-3 border border-brown-mid/30 bg-white"
      />
      {searching && <p className="text-[13px] text-brown-mid">Searching…</p>}
      <div className="flex flex-col gap-2">
        {matches.map(a => (
          <button
            key={a.id}
            onClick={() => a.qr_token && submitCheckIn(a.qr_token, passcode, onResult)}
            disabled={a.checked_in}
            className="text-left bg-white border border-brown-mid/20 px-4 py-3 disabled:opacity-50"
          >
            <div className="text-[15px] text-brown font-medium">
              {a.name} {a.checked_in && '· already checked in'}
            </div>
            <div className="text-[12px] text-brown-mid">
              {a.email} · {a.events?.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CheckinPage() {
  const [passcode, setPasscode] = useState<string | null>(null)
  const [mode, setMode] = useState<'scan' | 'search'>('scan')
  const [result, setResult] = useState<Result>(null)

  useEffect(() => {
    // Must read sessionStorage post-mount, not in a lazy useState
    // initializer, or the client's first render diverges from the
    // server-rendered (storage-less) HTML and React flags a hydration
    // mismatch.
    const stored = sessionStorage.getItem('checkin_passcode')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setPasscode(stored)
  }, [])

  if (!passcode) return <PasscodeGate onUnlocked={setPasscode} />

  return (
    <div className="min-h-screen bg-cream-dark p-4">
      <h1 className="font-cormorant text-brown text-[26px] text-center mb-4">Door check-in</h1>

      <ResultBanner result={result} onDismiss={() => setResult(null)} />

      <div className="flex gap-2 mb-4 justify-center">
        <button
          onClick={() => setMode('scan')}
          className={`px-5 py-2.5 text-[12px] tracking-[0.15em] uppercase ${mode === 'scan' ? 'bg-brown text-cream' : 'bg-white text-brown-mid'}`}
        >
          Scan
        </button>
        <button
          onClick={() => setMode('search')}
          className={`px-5 py-2.5 text-[12px] tracking-[0.15em] uppercase ${mode === 'search' ? 'bg-brown text-cream' : 'bg-white text-brown-mid'}`}
        >
          Search name
        </button>
      </div>

      {mode === 'scan' ? (
        <Scanner passcode={passcode} onResult={setResult} />
      ) : (
        <NameSearch passcode={passcode} onResult={setResult} />
      )}
    </div>
  )
}
