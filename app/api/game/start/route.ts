import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { createInitialState } from '@/lib/game-engine'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomCode } = await request.json()

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { roomPlayers: { include: { profile: true } } },
  })

  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.hostId !== user.id) return Response.json({ error: 'Only host can start' }, { status: 403 })
  if (room.status !== 'waiting') return Response.json({ error: 'Game already started' }, { status: 409 })

  const players = room.roomPlayers
  if (players.length < 2) return Response.json({ error: 'Need at least 2 players' }, { status: 400 })

  const notReady = players.filter(p => !p.isReady)
  if (notReady.length > 0) return Response.json({ error: 'All players must be ready' }, { status: 400 })

  const shuffled = [...players].sort(() => Math.random() - 0.5)

  const initialState = createInitialState({
    players: shuffled.map((p, i) => ({
      id: p.userId,
      name: p.profile.username,
      turnOrder: i,
    })),
  })

  await prisma.$transaction([
    prisma.room.update({ where: { id: room.id }, data: { status: 'active' } }),
    ...shuffled.map((p, i) =>
      prisma.roomPlayer.update({
        where: { id: p.id },
        data: { turnOrder: i },
      })
    ),
    prisma.gameState.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { roomId: room.id, state: initialState as any, version: 0 },
    }),
  ])

  return Response.json({ ok: true })
}
