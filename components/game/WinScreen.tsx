'use client'

import { useEffect, useState } from 'react'

interface Props {
  winnerName: string
  onClose: () => void
}

export default function WinScreen({ winnerName, onClose }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        opacity: show ? 1 : 0,
        transition: 'opacity 600ms var(--ease-out)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(30px)',
          transition: 'transform 600ms var(--ease-out)',
        }}
      >
        <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}>🏆</div>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 900,
            color: 'var(--gold)',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {winnerName}
        </h1>
        <p
          style={{
            fontFamily: 'Crimson Pro, serif',
            fontSize: '1.4rem',
            color: 'var(--cream-dim)',
            marginTop: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          wins the game!
        </p>
        <button
          onClick={onClose}
          className="btn-gold"
          style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', borderRadius: 100 }}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  )
}
