import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { applyAction } from '@/lib/apply-action'
import { rateLimit } from '@/lib/rate-limit'
import type { GameAction } from '@/lib/game-engine'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(user.id, 20, 10_000)) {
    return Response.json({ error: 'Too many actions — slow down' }, { status: 429 })
  }

  const body = await request.json()
  const { roomCode, action } = body as { roomCode: string; action: GameAction }

  if (!roomCode || !action) {
    return Response.json({ error: 'Missing roomCode or action' }, { status: 400 })
  }

  const room = await prisma.room.findUnique({ where: { code: roomCode } })
  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'active') return Response.json({ error: 'Game not active' }, { status: 409 })

  // Verify caller is in room
  const membership = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: user.id },
  })
  if (!membership) return Response.json({ error: 'Not in room' }, { status: 403 })

  const result = await applyAction(
    room.id,
    user.id,
    action,
    action.type,
    action as unknown as Record<string, unknown>
  )

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }

  return Response.json({ ok: true, state: result.state })
}
