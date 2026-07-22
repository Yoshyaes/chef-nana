import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/Sidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'
import AdminProviders from '@/components/admin/Providers'

export const metadata: Metadata = { title: "Georgina's Assistant" }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <div className="admin-root admin-scope">
        <AdminSidebar className="admin-sidebar" />
        <main className="admin-main">
          <div className="admin-mobile-header">
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--brown)' }}>
              Georgina&apos;s Assistant
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>LEAD STUDIO</span>
          </div>
          {children}
        </main>
        <MobileBottomNav className="admin-mobile-nav" />
      </div>
    </AdminProviders>
  )
}
