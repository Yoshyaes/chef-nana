'use client'
import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    // Deliberately not a lazy useState initializer: many callers branch
    // between structurally different trees (card list vs. table, segmented
    // pager vs. kanban) based on this value. Reading matchMedia at first
    // client render would diverge from the false-on-server value on any
    // actual mobile device, causing a real hydration mismatch across a
    // different subtree per page — not just the deferred-update cascade
    // this lint rule is guarding against on the general case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
