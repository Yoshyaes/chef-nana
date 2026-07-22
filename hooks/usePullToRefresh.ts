'use client'

import { useRef, useState, useCallback } from 'react'

const TRIGGER_DISTANCE = 64
const MAX_PULL = 96

function isScrolledToTop(target: EventTarget | null): boolean {
  let el = target instanceof HTMLElement ? target : null
  while (el) {
    if (el.scrollHeight > el.clientHeight) {
      const overflowY = getComputedStyle(el).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') return el.scrollTop <= 0
    }
    el = el.parentElement
  }
  return true
}

// Hand-rolled rather than a library: only needs to trigger a refetch when the
// user pulls down from the top of a scroll container, which is a small,
// self-contained touch-event state machine. Walks up from the touch target to
// find the actual scrolling ancestor (usually the shared .admin-main layout
// element, not the page's own wrapper div) rather than requiring a ref on it.
export function usePullToRefresh(onRefresh: () => Promise<unknown> | void) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = isScrolledToTop(e.target) ? e.touches[0].clientY : null
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current == null || refreshing) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, MAX_PULL))
    }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= TRIGGER_DISTANCE * 0.5 && !refreshing) {
      setRefreshing(true)
      setPullDistance(TRIGGER_DISTANCE * 0.5)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
    startY.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullDistance, refreshing])

  return {
    pullDistance,
    refreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
