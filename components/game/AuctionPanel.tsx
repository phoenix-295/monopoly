'use client'

import { useState } from 'react'
import type { Player, AuctionState } from '@/lib/game-engine'
import { BOARD } from '@/lib/board-data'

interface Props {
  auction: AuctionState
  players: Player[]
  myUserId: string
  isMyBidTurn: boolean
  acting: boolean
  onBid: (amount: number) => void
  onPass: () => void
}

export default function AuctionPanel({ auction, players, myUserId, isMyBidTurn, acting, onBid, onPass }: Props) {
  const [bidInput, setBidInput] = useState(auction.highestBid + 1)

  const square = BOARD[auction.squareIndex]
  const currentBidder = players.find(p => p.id === auction.currentBidderId)
  const highestBidder = players.find(p => p.id === auction.highestBidderId)
  const myPlayer = players.find(p => p.id === myUserId)
  const passed = auction.passedPlayerIds.includes(myUserId)

  return (
    <div
      style={{
        background: 'var(--felt-card)',
        border: '2px solid var(--gold)',
        borderRadius: 14,
        padding: '1rem',
        boxShadow: 'var(--shadow-deep)',
      }}
    >
      <h3
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '0.85rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          margin: '0 0 0.5rem',
        }}
      >
        Auction
      </h3>

      <p style={{ fontSize: '0.82rem', color: 'var(--cream)', marginBottom: '0.25rem', fontWeight: 600 }}>
        {square.name}
      </p>

      <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginBottom: '0.75rem' }}>
        {auction.highestBidderId
          ? <>High bid: <strong style={{ color: 'var(--gold)' }}>${auction.highestBid}</strong> by {highestBidder?.name}</>
          : 'No bids yet'}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--cream-dim)', marginBottom: '0.75rem' }}>
        Bidding: <strong style={{ color: 'var(--cream)' }}>{currentBidder?.name ?? '…'}</strong>
      </p>

      {isMyBidTurn && !passed && (
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="number"
              min={auction.highestBid + 1}
              max={myPlayer?.cash ?? 9999}
              value={bidInput}
              onChange={e => setBidInput(Number(e.target.value))}
              className="felt-input"
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.82rem', borderRadius: 8, width: '100%' }}
            />
            <button
              className="btn-gold"
              disabled={acting || bidInput <= auction.highestBid || bidInput > (myPlayer?.cash ?? 0)}
              onClick={() => onBid(bidInput)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: 8, flexShrink: 0 }}
            >
              Bid
            </button>
          </div>
          <button
            className="btn-ghost"
            disabled={acting}
            onClick={onPass}
            style={{ padding: '0.35rem', fontSize: '0.75rem', borderRadius: 8 }}
          >
            Pass
          </button>
        </div>
      )}

      {passed && (
        <p style={{ fontSize: '0.72rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>You passed.</p>
      )}

      {!isMyBidTurn && !passed && (
        <p style={{ fontSize: '0.72rem', color: 'var(--cream-dim)' }}>Waiting for {currentBidder?.name}…</p>
      )}
    </div>
  )
}
