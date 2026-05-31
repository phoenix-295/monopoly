import { prisma } from '@/lib/prisma'
import { gameEngine } from '@/lib/game-engine'
import type { GameAction, GameState } from '@/lib/game-engine'

export type ApplyResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string; status: number }

export async function applyAction(
  roomId: string,
  playerId: string,
  action: GameAction,
  actionName: string,
  payload?: Record<string, unknown>
): Promise<ApplyResult> {
  const row = await prisma.gameState.findUnique({ where: { roomId } })
  if (!row) return { ok: false, error: 'Game not found', status: 404 }

  const current = row.state as unknown as GameState

  let next: GameState
  try {
    next = gameEngine(current, action)
  } catch (err) {
    return { ok: false, error: (err as Error).message, status: 400 }
  }

  // Optimistic lock: only update if version hasn't changed
  const updated = await prisma.gameState.updateMany({
    where: { roomId, version: row.version },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { state: next as any, version: row.version + 1 },
  })

  if (updated.count === 0) {
    return { ok: false, error: 'Conflict: state changed, retry', status: 409 }
  }

  await prisma.gameEvent.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { roomId, playerId, action: actionName, payload: payload ? payload as any : undefined },
  })

  return { ok: true, state: next }
}
