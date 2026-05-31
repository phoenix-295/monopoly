'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'guest'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function ensureProfile(userId: string, name: string) {
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: name }),
    })
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!username.trim()) { setError('Username required'); setLoading(false); return }
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (data.user) await ensureProfile(data.user.id, username.trim())
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      }
      router.push('/lobby')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) setError(err.message)
  }

  async function handleGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setError('Username required'); return }
    setError('')
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signInAnonymously()
      if (err) throw err
      if (data.user) await ensureProfile(data.user.id, username.trim())
      router.push('/lobby')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join as guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Corner decorations */}
      <div className="fixed top-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-blue)' }}>♠</div>
      <div className="fixed top-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-red)' }}>♥</div>
      <div className="fixed bottom-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-green)' }}>♣</div>
      <div className="fixed bottom-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-orange)' }}>♦</div>

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🎲</span>
          </div>
          <h1
            className="text-5xl font-black italic mb-1"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--gold)' }}
          >
            Monopoly
          </h1>
          <p className="text-sm tracking-[0.25em] uppercase" style={{ color: 'var(--cream-dim)' }}>
            Online Edition
          </p>
          <div className="gold-rule mt-4" />
        </div>

        {/* Tab switcher */}
        <div
          className="felt-card p-0 mb-0"
          style={{ borderBottom: 'none', borderRadius: '12px 12px 0 0' }}
        >
          <div className="grid grid-cols-3">
            {(['login', 'signup', 'guest'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="py-3 text-sm tracking-[0.12em] uppercase"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '0.72rem',
                  background: mode === m ? 'var(--felt-card)' : 'var(--felt-raised)',
                  color: mode === m ? 'var(--gold)' : 'var(--cream-dim)',
                  borderBottom: mode === m ? '2px solid var(--gold)' : '2px solid transparent',
                  borderRight: m !== 'guest' ? '1px solid var(--felt-border)' : 'none',
                  transition: 'color 150ms ease, border-color 150ms ease, background 150ms ease',
                }}
              >
                {m === 'login' ? 'Sign In' : m === 'signup' ? 'Register' : 'Guest'}
              </button>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div
          className="felt-card p-8"
          style={{ borderTop: 'none', borderRadius: '0 0 12px 12px' }}
        >
          {/* Error */}
          {error && (
            <div
              className="error-banner mb-5 px-4 py-3 text-sm rounded"
              style={{
                background: 'rgba(192,57,43,0.15)',
                border: '1px solid rgba(192,57,43,0.4)',
                color: '#f87171',
                fontFamily: 'Crimson Pro, serif',
              }}
            >
              {error}
            </div>
          )}

          {/* EMAIL/PASSWORD FORM */}
          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--cream-dim)', fontFamily: 'Playfair Display, serif' }}>
                    Username
                  </label>
                  <input
                    className="felt-input rounded px-4 py-2.5 w-full"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a display name"
                    maxLength={20}
                    required
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--cream-dim)', fontFamily: 'Playfair Display, serif' }}>
                  Email
                </label>
                <input
                  type="email"
                  className="felt-input rounded px-4 py-2.5 w-full"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--cream-dim)', fontFamily: 'Playfair Display, serif' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="felt-input rounded px-4 py-2.5 w-full"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold rounded py-3 mt-2 w-full text-sm"
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Enter the Board' : 'Create Account'}
              </button>

              <div className="relative my-1">
                <div className="gold-rule" />
                <span
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs"
                  style={{ color: 'var(--cream-dim)', background: 'var(--felt-card)', top: '50%' }}
                >
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="btn-ghost rounded py-3 w-full flex items-center justify-center gap-3 text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* GUEST FORM */}
          {mode === 'guest' && (
            <form onSubmit={handleGuest} className="flex flex-col gap-4">
              <p className="text-sm text-center" style={{ color: 'var(--cream-dim)' }}>
                Jump in without an account. Your progress won't be saved.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--cream-dim)', fontFamily: 'Playfair Display, serif' }}>
                  Display Name
                </label>
                <input
                  className="felt-input rounded px-4 py-2.5 w-full"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. RichUncle"
                  maxLength={20}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold rounded py-3 mt-2 w-full text-sm"
              >
                {loading ? 'Joining…' : 'Play as Guest'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--cream-dim)', opacity: 0.5 }}>
          For entertainment purposes only.
        </p>
      </div>
    </main>
  )
}
