import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/Sidebar'

export const metadata: Metadata = { title: "Georgina's Assistant" }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --gold: #C9973A;
            --gold-light: #E2B96A;
            --terracotta: #B85A35;
            --green-dark: #2D5F3D;
            --cream: #F7F1E8;
            --brown: #2C1A0E;
            --font-serif: 'Georgia', serif;
            --font-sans: system-ui, -apple-system, sans-serif;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: var(--font-sans);
            background: var(--cream);
            color: var(--brown);
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <AdminSidebar />
          <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
