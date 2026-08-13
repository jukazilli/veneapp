import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: { default: 'Veneapp', template: '%s · Veneapp' },
  description: 'Agenda, atendimento e comissões em sincronia.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Veneapp',
  appleWebApp: {
    capable: true,
    title: 'Veneapp',
    statusBarStyle: 'black-translucent',
  },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0b0f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={nunito.variable}><body>{children}</body></html>
}
