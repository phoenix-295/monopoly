import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from './ThemeToggle'

export const metadata: Metadata = {
  title: 'Monopoly Online',
  description: 'Multiplayer Monopoly — play with friends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
