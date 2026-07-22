'use client'

import { Drawer } from 'vaul'

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 301,
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'env(safe-area-inset-bottom)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ margin: '10px auto 4px', width: 36, height: 4, borderRadius: 2, background: 'var(--border-hairline)' }} />
          <div style={{ overflowY: 'auto', padding: '12px 20px 20px' }}>
            {title && (
              <Drawer.Title style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', marginBottom: 14 }}>
                {title}
              </Drawer.Title>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
