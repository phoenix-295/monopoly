'use client'

import { BoardSquare } from '@/lib/board-data'

interface Props {
  square: BoardSquare | null
  onClose: () => void
}

export default function PropertyCard({ square, onClose }: Props) {
  if (!square) return null

  const isProperty = square.type === 'property'
  const isRailroad = square.type === 'railroad'
  const isUtility = square.type === 'utility'

  const headerBg = isProperty
    ? square.color
    : isRailroad || isUtility
      ? '#1A0800'
      : 'var(--gold)'

  return (
    <div
      className="card-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="card-modal"
        style={{
          position: 'relative',
          width: 288,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--felt-card)',
          border: '2px solid var(--felt-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)',
          fontFamily: 'Crimson Pro, serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header stripe */}
        <div
          style={{
            background: headerBg,
            padding: '1.1rem 1rem 0.9rem',
            textAlign: 'center',
          }}
        >
          {(isRailroad || isUtility) && (
            <div style={{ fontSize: '2rem', lineHeight: 1, marginBottom: '0.3rem' }}>
              {isRailroad ? '🚂' : square.icon}
            </div>
          )}
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1rem',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.25,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: 0,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {square.name}
          </h2>
          {square.price && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', marginTop: '0.25rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Title Deed
            </p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          {isProperty && square.rent && (
            <>
              <div className="deed-row" style={{ borderBottom: '1px solid var(--felt-border)', paddingBottom: '0.5rem', marginBottom: '0.4rem' }}>
                <span>Rent</span>
                <span>${square.rent[0]}</span>
              </div>
              {['1 House', '2 Houses', '3 Houses', '4 Houses', 'Hotel'].map((label, i) => (
                <div key={label} className="deed-row">
                  <span>With {label}</span>
                  <span>${square.rent![i + 1]}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--felt-border)', margin: '0.6rem 0' }} />
              <div className="deed-row">
                <span>Mortgage Value</span>
                <span>${square.mortgage}</span>
              </div>
              <div className="deed-row">
                <span>Houses cost</span>
                <span>${square.housePrice} each</span>
              </div>
              <div className="deed-row">
                <span>Hotels cost</span>
                <span>${square.housePrice} + 4 houses</span>
              </div>
            </>
          )}

          {isRailroad && (
            <>
              <div className="deed-row"><span>Rent (1 railroad)</span><span>$25</span></div>
              <div className="deed-row"><span>2 railroads</span><span>$50</span></div>
              <div className="deed-row"><span>3 railroads</span><span>$100</span></div>
              <div className="deed-row"><span>4 railroads</span><span>$200</span></div>
              <div style={{ height: 1, background: 'var(--felt-border)', margin: '0.6rem 0' }} />
              <div className="deed-row"><span>Mortgage Value</span><span>$100</span></div>
            </>
          )}

          {isUtility && (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                If one utility owned, rent = 4× dice roll.
                <br />
                If both utilities owned, rent = 10× dice roll.
              </p>
              <div style={{ height: 1, background: 'var(--felt-border)', margin: '0.6rem 0' }} />
              <div className="deed-row"><span>Mortgage Value</span><span>$75</span></div>
            </>
          )}

          <div style={{ marginTop: '0.85rem', textAlign: 'center', padding: '0.5rem', background: 'var(--felt-raised)', borderRadius: 8, border: '1px solid var(--felt-border)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cream)' }}>
              {square.price ? `Purchase Price: $${square.price}` : ''}
              {square.taxAmount ? `Pay $${square.taxAmount}` : ''}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          className="card-close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.6rem',
            width: '1.6rem',
            height: '1.6rem',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.25)',
            border: 'none',
            color: '#fff',
            fontSize: '0.8rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        .deed-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--cream);
          padding: 0.18rem 0;
        }
        .deed-row span:first-child { color: var(--cream-dim); }
        .deed-row span:last-child { font-weight: 700; }
      `}</style>
    </div>
  )
}
