'use client'

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useHaptic } from '@/hooks/useHaptic'

const THRESHOLD = 88

export default function SwipeRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = '✓ Approve',
  leftLabel = '✕ Reject',
  disabled = false,
}: {
  children: React.ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  rightLabel?: string
  leftLabel?: string
  disabled?: boolean
}) {
  const x = useMotionValue(0)
  const haptic = useHaptic()
  const rightOpacity = useTransform(x, [0, THRESHOLD], [0, 1])
  const leftOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0])

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (disabled) return
    if (info.offset.x > THRESHOLD && onSwipeRight) {
      haptic('success')
      onSwipeRight()
    } else if (info.offset.x < -THRESHOLD && onSwipeLeft) {
      haptic('warning')
      onSwipeLeft()
    }
  }

  return (
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
      {onSwipeRight && (
        <motion.div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            padding: '0 18px', background: 'var(--success)', color: '#fff',
            fontWeight: 700, fontSize: 13, opacity: rightOpacity,
          }}
        >
          {rightLabel}
        </motion.div>
      )}
      {onSwipeLeft && (
        <motion.div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 18px', background: 'var(--danger)',
            color: '#fff', fontWeight: 700, fontSize: 13, opacity: leftOpacity,
          }}
        >
          {leftLabel}
        </motion.div>
      )}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        style={{ x, position: 'relative', touchAction: 'pan-y', background: 'var(--cream)' }}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}
