'use client'

import { useRef, useCallback } from 'react'

type SoundType = 'dice' | 'buy' | 'rent' | 'jail' | 'win' | 'move'

// Procedural sound generation via Web Audio API — no audio files needed
function createSound(ctx: AudioContext, type: SoundType) {
  const now = ctx.currentTime

  switch (type) {
    case 'dice': {
      // Short rattle: rapid clicks
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.value = 80 + Math.random() * 40
        gain.gain.setValueAtTime(0.15, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.05)
        osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.06)
      }
      break
    }
    case 'buy': {
      // Cash register: rising tone
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.start(now); osc.stop(now + 0.35)
      break
    }
    case 'rent': {
      // Descending: money leaving
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.start(now); osc.stop(now + 0.3)
      break
    }
    case 'jail': {
      // Low thud
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.start(now); osc.stop(now + 0.4)
      break
    }
    case 'win': {
      // Fanfare: ascending chord
      const freqs = [523, 659, 784, 1047]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + i * 0.12)
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5)
        osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.55)
      })
      break
    }
    case 'move': {
      // Soft step click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 600
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
      osc.start(now); osc.stop(now + 0.07)
      break
    }
  }
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((type: SoundType) => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      createSound(ctx, type)
    } catch {
      // Audio not supported — silently ignore
    }
  }, [])

  return play
}
