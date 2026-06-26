import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/Sidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export const metadata: Metadata = { title: "Georgina's Assistant" }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .admin-root {
          --gold: #C9973A;
          --gold-light: #E2B96A;
          --terracotta: #B85A35;
          --green-dark: #2D5F3D;
          --cream: #F7F1E8;
          --brown: #2C1A0E;
          --font-serif: 'Georgia', serif;
          --font-sans: system-ui, -apple-system, sans-serif;
        }
        .admin-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .admin-root {
          background: #F7F1E8; color: #2C1A0E;
          height: 100vh; overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
        }
        .admin-sidebar { flex-shrink: 0; overflow-y: auto; }
        .admin-main { flex: 1; padding: 32px; overflow-y: auto; height: 100%; }
        .admin-mobile-header { display: none; }
        .admin-mobile-nav { display: none; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-main { padding: 16px; padding-bottom: 80px; }
          .admin-mobile-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px 12px; border-bottom: 1px solid #eee5d7;
            background: #fff; margin: -16px -16px 16px;
          }
          .admin-mobile-nav { display: flex; }
        }
      `}</style>
      <div className="admin-root">
        <AdminSidebar className="admin-sidebar" />
        <main className="admin-main">
          <div className="admin-mobile-header">
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--brown)' }}>
              Georgina&apos;s Assistant
            </span>
            <span style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.06em' }}>LEAD STUDIO</span>
          </div>
          {children}
        </main>
        <MobileBottomNav className="admin-mobile-nav" />
      </div>
    </>
  )
}
