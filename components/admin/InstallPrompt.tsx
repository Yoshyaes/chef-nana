'use client'

import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Button from '@/components/admin/ui/Button'

const DISMISS_KEY = 'admin-install-prompt-dismissed-at'
const DISMISS_DAYS = 14

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isDismissedRecently() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24)
  return days < DISMISS_DAYS
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own non-standard flag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  return /iPhone|iPad|iPod/.test(window.navigator.userAgent)
}

export default function InstallPrompt() {
  const isMobile = useIsMobile()
  const [visible, setVisible] = useState(false)
  const [ios] = useState(() => typeof window !== 'undefined' && isIos())
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone() || isDismissedRecently()) return

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    // beforeinstallprompt never fires on iOS Safari — show the manual
    // instructions there unconditionally (once, until dismissed). Deferred
    // a tick (rather than set synchronously in the effect body) so this
    // stays a callback-triggered update, not a render-cascading one, since
    // `visible` must start false to match the server-rendered markup
    // (navigator.userAgent doesn't exist during SSR).
    const iosTimeout = isIos() ? setTimeout(() => setVisible(true), 0) : null

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      if (iosTimeout) clearTimeout(iosTimeout)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  async function handleInstall() {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    const { outcome } = await deferredEvent.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') dismiss()
  }

  if (!isMobile || !visible) return null

  return (
    <div style={{
      background: 'var(--surface-alt)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown)' }}>Add Lead Studio to your home screen</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted-2)', marginTop: 2, lineHeight: 1.4 }}>
          {ios
            ? 'Tap the Share icon, then "Add to Home Screen".'
            : 'Get a real app icon and a faster, full-screen feel.'}
        </div>
      </div>
      {!ios && (
        <Button size="sm" onClick={handleInstall}>Install</Button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}
