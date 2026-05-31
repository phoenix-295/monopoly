'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Profile {
  username: string
  wins: number
  losses: number
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('username, wins, losses, created_at')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          username: data.username,
          wins: data.wins,
          losses: data.losses,
          createdAt: data.created_at,
        })
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const gamesPlayed = (profile?.wins ?? 0) + (profile?.losses ?? 0)
  const winRate = gamesPlayed > 0 ? Math.round((profile!.wins / gamesPlayed) * 100) : 0

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
            Profile
          </h1>
          <div className="gold-rule" style={{ marginTop: '1rem' }} />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--cream-dim)' }}>Loading…</p>
        ) : profile ? (
          <>
            {/* Avatar + name */}
            <div
              style={{
                background: 'var(--felt-card)',
                border: '2px solid var(--felt-border)',
                borderRadius: 14,
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem' }}>🎩</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: 'var(--cream)', margin: 0 }}>
                {profile.username}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginTop: '0.25rem' }}>
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Stats */}
            <div
              style={{
                background: 'var(--felt-card)',
                border: '2px solid var(--felt-border)',
                borderRadius: 14,
                padding: '1.25rem',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream-dim)', margin: '0 0 1rem' }}>
                Statistics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Games', value: gamesPlayed },
                  { label: 'Wins', value: profile.wins },
                  { label: 'Win Rate', value: `${winRate}%` },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--felt-raised)', borderRadius: 10, border: '1.5px solid var(--felt-border)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'monospace' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--cream-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => router.push('/lobby')} className="btn-gold" style={{ width: '100%', padding: '0.75rem', borderRadius: 100, fontSize: '0.9rem' }}>
              Back to Lobby
            </button>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--cream-dim)' }}>Profile not found.</p>
        )}
      </div>
    </main>
  )
}
