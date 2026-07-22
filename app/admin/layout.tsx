import type { Metadata, Viewport } from 'next'
import './admin-theme.css'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: '/admin-icons/icon-192.png',
    apple: '/admin-icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#C9973A',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
