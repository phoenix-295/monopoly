import { GameState } from './types'
import { GO_INDEX, GO_TO_JAIL_INDEX, JAIL_INDEX } from './board'
import { updatePlayer, addLog } from './state'

export const GO_SALARY = 200
export const BOARD_SIZE = 40

export function movePlayer(
  state: GameState,
  playerId: string,
  steps: number,
): { state: GameState; passedGo: boolean } {
  const player = state.players.find(p => p.id === playerId)!
  const newPos = ((player.position + steps) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE
  const passedGo = steps > 0 && player.position + steps >= BOARD_SIZE

  let next = updatePlayer(state, playerId, { position: newPos })
  if (passedGo) {
    next = updatePlayer(next, playerId, { cash: player.cash + GO_SALARY })
    next = addLog(next, `${player.name} passed GO and collected $${GO_SALARY}.`)
  }

  return { state: next, passedGo }
}

export function movePlayerTo(
  state: GameState,
  playerId: string,
  targetIndex: number,
  collectGo: boolean,
): { state: GameState; passedGo: boolean } {
  const player = state.players.find(p => p.id === playerId)!
  const passedGo = collectGo && targetIndex <= player.position && targetIndex !== player.position

  let next = updatePlayer(state, playerId, { position: targetIndex })
  if (passedGo) {
    next = updatePlayer(next, playerId, { cash: player.cash + GO_SALARY })
    next = addLog(next, `${player.name} passed GO and collected $${GO_SALARY}.`)
  }

  return { state: next, passedGo }
}

export function sendToJail(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId)!
  let next = updatePlayer(state, playerId, { position: JAIL_INDEX, jailTurns: 3 })
  next = addLog(next, `${player.name} went to Jail!`)
  return next
}
