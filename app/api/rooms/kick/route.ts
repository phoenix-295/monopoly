import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomCode, targetUserId } = await request.json()

  const room = await prisma.room.findUnique({ where: { code: roomCode } })
  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.hostId !== user.id) return Response.json({ error: 'Only host can kick' }, { status: 403 })
  if (targetUserId === user.id) return Response.json({ error: 'Cannot kick yourself' }, { status: 400 })

  await prisma.roomPlayer.deleteMany({
    where: { roomId: room.id, userId: targetUserId },
  })

  return Response.json({ ok: true })
}
