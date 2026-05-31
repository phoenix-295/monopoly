import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    const base = (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'player'
    ).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'player'
    let username = base
    let suffix = 1
    while (await prisma.profile.findUnique({ where: { username } })) {
      username = `${base}${suffix++}`
    }
    await prisma.profile.create({ data: { id: user.id, username } })
  }

  const { code } = await request.json()
  if (!code) return Response.json({ error: 'Room code required' }, { status: 400 })

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { roomPlayers: true },
  })

  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'waiting') return Response.json({ error: 'Game already started' }, { status: 409 })
  if (room.roomPlayers.length >= room.maxPlayers) return Response.json({ error: 'Room is full' }, { status: 409 })

  const alreadyIn = room.roomPlayers.find(p => p.userId === user.id)
  if (alreadyIn) return Response.json({ code: room.code })

  await prisma.roomPlayer.create({
    data: {
      roomId: room.id,
      userId: user.id,
      isReady: false,
      turnOrder: room.roomPlayers.length,
    },
  })

  return Response.json({ code: room.code })
}
