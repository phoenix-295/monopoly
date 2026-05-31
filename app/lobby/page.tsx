'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LobbyPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<'create' | 'join' | null>(null)

  async function handleCreate() {
    setError('')
    setLoading('create')
    try {
      const res = await fetch('/api/rooms/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create room')
      router.push(`/lobby/${data.code}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating room')
    } finally {
      setLoading(null)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setError('')
    setLoading('join')
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join room')
      router.push(`/lobby/${data.code}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error joining room')
    } finally {
      setLoading(null)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Corner suits */}
      <div className="fixed top-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-blue)' }}>♠</div>
      <div className="fixed top-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-red)' }}>♥</div>
      <div className="fixed bottom-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-green)' }}>♣</div>
      <div className="fixed bottom-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-orange)' }}>♦</div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="fixed top-6 right-16 btn-ghost text-xs px-3 py-1.5 rounded"
        style={{ letterSpacing: '0.1em' }}
      >
        Sign Out
      </button>

      <div className="w-full max-w-lg animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-black italic mb-1"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--gold)' }}
          >
            Monopoly
          </h1>
          <p className="text-sm tracking-[0.25em] uppercase" style={{ color: 'var(--cream-dim)' }}>
            Choose your game
          </p>
          <div className="gold-rule mt-4" />
        </div>

        {error && (
          <div
            className="error-banner mb-6 px-4 py-3 text-sm rounded text-center"
            style={{
              background: 'rgba(192,57,43,0.15)',
              border: '1px solid rgba(192,57,43,0.4)',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}

        <div className="grid gap-4 stagger-children">
          {/* Create room */}
          <div className="felt-card p-7" style={{ borderTop: '4px solid var(--prop-red)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="token-badge text-2xl mt-0.5">🏛️</div>
              <div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'Playfair Display, serif', color: 'var(--cream)' }}
                >
                  Create a Room
                </h2>
                <p className="text-sm" style={{ color: 'var(--cream-dim)' }}>
                  Start a new game and invite up to 5 friends with a room code.
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading !== null}
              className="btn-gold w-full py-3 rounded text-sm"
            >
              {loading === 'create' ? 'Creating…' : 'Create New Room'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--felt-border)' }} />
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--cream-dim)', opacity: 0.6 }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--felt-border)' }} />
          </div>

          {/* Join room */}
          <div className="felt-card p-7" style={{ borderTop: '4px solid var(--prop-blue)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="token-badge text-2xl mt-0.5">🎟️</div>
              <div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'Playfair Display, serif', color: 'var(--cream)' }}
                >
                  Join a Room
                </h2>
                <p className="text-sm" style={{ color: 'var(--cream-dim)' }}>
                  Enter a room code shared by a friend.
                </p>
              </div>
            </div>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input
                className="felt-input rounded px-4 py-2.5 flex-1 text-center font-mono text-lg tracking-[0.2em] uppercase"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                maxLength={7}
              />
              <button
                type="submit"
                disabled={loading !== null || !joinCode.trim()}
                className="btn-gold px-6 py-2.5 rounded text-sm whitespace-nowrap"
              >
                {loading === 'join' ? 'Joining…' : 'Join'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
