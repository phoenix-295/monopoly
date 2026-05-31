import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const part1 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const part2 = Array.from({ length: 3 }, () => digits[Math.floor(Math.random() * digits.length)]).join('')
  return `${part1}-${part2}`
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
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
    profile = await prisma.profile.create({ data: { id: user.id, username } })
  }

  const body = await request.json().catch(() => ({}))
  const maxPlayers = Number(body.maxPlayers) || 6

  let code = generateCode()
  let attempts = 0
  while (await prisma.room.findUnique({ where: { code } }) && attempts < 10) {
    code = generateCode()
    attempts++
  }

  const room = await prisma.room.create({
    data: {
      code,
      hostId: user.id,
      maxPlayers,
      status: 'waiting',
      roomPlayers: {
        create: {
          userId: user.id,
          isReady: false,
          turnOrder: 0,
        },
      },
    },
  })

  return Response.json({ code: room.code }, { status: 201 })
}
