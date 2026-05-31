'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      setDark(true)
    }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        border: '2px solid var(--felt-border)',
        background: 'var(--felt-card)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease',
        cursor: 'inherit',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
