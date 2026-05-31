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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-72 rounded-xl overflow-hidden animate-fade-up"
        style={{
          background: 'var(--felt-card)',
          border: '2px solid var(--felt-border)',
          boxShadow: 'var(--shadow-deep)',
          fontFamily: 'Crimson Pro, serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Color stripe header */}
        <div
          style={{
            background: isProperty
              ? square.color
              : isRailroad
                ? '#1A0800'
                : isUtility
                  ? '#1A0800'
                  : 'var(--gold)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          {isRailroad && (
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚂</div>
          )}
          {isUtility && (
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{square.icon}</div>
          )}
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1rem',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {square.name}
          </h2>
          {square.price && (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Title Deed
            </p>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '1rem' }}>
          {isProperty && square.rent && (
            <>
              <div className="deed-row" style={{ borderBottom: '1px solid var(--felt-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span>Rent</span>
                <span>${square.rent[0]}</span>
              </div>
              {['1 House', '2 Houses', '3 Houses', '4 Houses', 'Hotel'].map((label, i) => (
                <div key={label} className="deed-row">
                  <span>With {label}</span>
                  <span>${square.rent![i + 1]}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--felt-border)', margin: '0.6rem 0' }} />
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
              <div className="deed-row"><span>Rent</span><span>$25</span></div>
              <div className="deed-row"><span>If 2 railroads owned</span><span>$50</span></div>
              <div className="deed-row"><span>If 3 railroads owned</span><span>$100</span></div>
              <div className="deed-row"><span>If 4 railroads owned</span><span>$200</span></div>
              <div style={{ height: '1px', background: 'var(--felt-border)', margin: '0.6rem 0' }} />
              <div className="deed-row"><span>Mortgage Value</span><span>$100</span></div>
            </>
          )}

          {isUtility && (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                If one utility is owned, rent is 4× dice roll.
                <br />
                If both utilities owned, rent is 10× dice roll.
              </p>
              <div style={{ height: '1px', background: 'var(--felt-border)', margin: '0.6rem 0' }} />
              <div className="deed-row"><span>Mortgage Value</span><span>$75</span></div>
            </>
          )}

          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cream)' }}>
              {square.price ? `Purchase Price: $${square.price}` : ''}
              {square.taxAmount ? `Pay $${square.taxAmount}` : ''}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '0.85rem',
            lineHeight: 1,
            cursor: 'pointer',
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
          padding: 0.15rem 0;
        }
        .deed-row span:first-child { color: var(--cream-dim); }
        .deed-row span:last-child { font-weight: 700; }
      `}</style>
    </div>
  )
}
