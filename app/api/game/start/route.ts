import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomCode } = await request.json()

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { roomPlayers: true },
  })

  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.hostId !== user.id) return Response.json({ error: 'Only host can start' }, { status: 403 })
  if (room.status !== 'waiting') return Response.json({ error: 'Game already started' }, { status: 409 })

  const players = room.roomPlayers
  if (players.length < 2) return Response.json({ error: 'Need at least 2 players' }, { status: 400 })

  const notReady = players.filter(p => !p.isReady)
  if (notReady.length > 0) return Response.json({ error: 'All players must be ready' }, { status: 400 })

  const shuffled = [...players].sort(() => Math.random() - 0.5)

  await prisma.$transaction([
    prisma.room.update({ where: { id: room.id }, data: { status: 'active' } }),
    ...shuffled.map((p, i) =>
      prisma.roomPlayer.update({
        where: { id: p.id },
        data: { turnOrder: i },
      })
    ),
  ])

  return Response.json({ ok: true })
}
