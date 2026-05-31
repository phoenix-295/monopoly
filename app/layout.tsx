import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from './ThemeToggle'

import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Monopoly Online',
  description: 'Multiplayer Monopoly — play with friends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col">
        {/* Prevent flash of wrong theme on reload */}
        <Script
          id="theme-toggle-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})()`,
          }}
        />
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
