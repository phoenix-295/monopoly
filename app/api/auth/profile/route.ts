import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { userId, username } = await request.json()

  if (!userId || !username) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const existing = await prisma.profile.findUnique({ where: { id: userId } })
  if (existing) return Response.json({ profile: existing })

  const base = username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'player'
  let finalUsername = base
  let suffix = 1
  while (await prisma.profile.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${base}${suffix++}`
  }

  const profile = await prisma.profile.create({
    data: { id: userId, username: finalUsername },
  })

  return Response.json({ profile }, { status: 201 })
}
