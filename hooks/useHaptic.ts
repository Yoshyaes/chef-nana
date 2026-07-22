'use client'

import { useCallback } from 'react'

type HapticKind = 'success' | 'warning' | 'light'

// iOS Safari/PWA has no Vibration API — this becomes a safe no-op there.
// Android Chrome vibrates; callers should still pair every haptic with a
// visible motion/color cue so iOS users get equivalent feedback.
const PATTERNS: Record<HapticKind, number | number[]> = {
  success: 15,
  warning: [20, 40, 20],
  light: 8,
}

export function useHaptic() {
  return useCallback((kind: HapticKind = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(PATTERNS[kind])
      } catch {
        // no-op — unsupported or blocked by the browser
      }
    }
  }, [])
}
