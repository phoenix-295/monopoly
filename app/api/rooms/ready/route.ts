import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomCode } = await request.json()
  if (!roomCode) return Response.json({ error: 'Room code required' }, { status: 400 })

  const room = await prisma.room.findUnique({ where: { code: roomCode } })
  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })

  const player = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: user.id },
  })
  if (!player) return Response.json({ error: 'Not in this room' }, { status: 403 })

  const updated = await prisma.roomPlayer.update({
    where: { id: player.id },
    data: { isReady: !player.isReady },
  })

  return Response.json({ isReady: updated.isReady })
}
