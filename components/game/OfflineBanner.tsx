'use client'

import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: '#92400E',
        color: '#FEF3C7',
        textAlign: 'center',
        padding: '0.4rem 1rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
    >
      ⚠ No internet connection — reconnecting…
    </div>
  )
}
