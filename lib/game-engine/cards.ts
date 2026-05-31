import { Card } from './types'

export const CHANCE_CARDS: Card[] = [
  { id: 'ch1',  text: 'Advance to Boardwalk.',                                     action: { type: 'move_to', squareIndex: 39, collectGo: true } },
  { id: 'ch2',  text: 'Advance to Go (Collect $200).',                             action: { type: 'move_to', squareIndex: 0, collectGo: true } },
  { id: 'ch3',  text: 'Advance to Illinois Avenue. If you pass Go, collect $200.', action: { type: 'move_to', squareIndex: 24, collectGo: true } },
  { id: 'ch4',  text: 'Advance to St. Charles Place. If you pass Go, collect $200.', action: { type: 'move_to', squareIndex: 11, collectGo: true } },
  { id: 'ch5',  text: 'Advance token to the nearest Railroad.',                    action: { type: 'move_to_nearest', squareType: 'railroad' } },
  { id: 'ch6',  text: 'Advance token to the nearest Railroad.',                    action: { type: 'move_to_nearest', squareType: 'railroad' } },
  { id: 'ch7',  text: 'Advance token to the nearest Utility.',                     action: { type: 'move_to_nearest', squareType: 'utility' } },
  { id: 'ch8',  text: 'Bank pays you dividend of $50.',                            action: { type: 'collect_bank', amount: 50 } },
  { id: 'ch9',  text: 'Get Out of Jail Free.',                                     action: { type: 'get_out_of_jail_free' } },
  { id: 'ch10', text: 'Go Back 3 Spaces.',                                         action: { type: 'move_by', steps: -3 } },
  { id: 'ch11', text: 'Go to Jail. Go directly to Jail.',                          action: { type: 'go_to_jail' } },
  { id: 'ch12', text: 'Make general repairs on all your property. For each house pay $25, for each hotel $100.', action: { type: 'pay_repairs', perHouse: 25, perHotel: 100 } },
  { id: 'ch13', text: 'Speeding fine $15.',                                        action: { type: 'pay_bank', amount: 15 } },
  { id: 'ch14', text: 'Take a trip to Reading Railroad. If you pass Go, collect $200.', action: { type: 'move_to', squareIndex: 5, collectGo: true } },
  { id: 'ch15', text: 'You have been elected Chairman of the Board. Pay each player $50.', action: { type: 'pay_all_players', amount: 50 } },
  { id: 'ch16', text: 'Your building and loan matures. Collect $150.',             action: { type: 'collect_bank', amount: 150 } },
]

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: 'cc1',  text: 'Advance to Go (Collect $200).',              action: { type: 'move_to', squareIndex: 0, collectGo: true } },
  { id: 'cc2',  text: 'Bank error in your favor. Collect $200.',    action: { type: 'collect_bank', amount: 200 } },
  { id: 'cc3',  text: 'Doctor\'s fees. Pay $50.',                   action: { type: 'pay_bank', amount: 50 } },
  { id: 'cc4',  text: 'From sale of stock you get $50.',            action: { type: 'collect_bank', amount: 50 } },
  { id: 'cc5',  text: 'Get Out of Jail Free.',                      action: { type: 'get_out_of_jail_free' } },
  { id: 'cc6',  text: 'Go to Jail. Go directly to Jail.',           action: { type: 'go_to_jail' } },
  { id: 'cc7',  text: 'Grand Opera Night. Collect $50 from every player for opening night seats.', action: { type: 'collect_all_players', amount: 50 } },
  { id: 'cc8',  text: 'Holiday Fund matures. Receive $100.',        action: { type: 'collect_bank', amount: 100 } },
  { id: 'cc9',  text: 'Income tax refund. Collect $20.',            action: { type: 'collect_bank', amount: 20 } },
  { id: 'cc10', text: 'It is your birthday. Collect $10 from every player.', action: { type: 'collect_all_players', amount: 10 } },
  { id: 'cc11', text: 'Life insurance matures. Collect $100.',      action: { type: 'collect_bank', amount: 100 } },
  { id: 'cc12', text: 'Pay hospital fees of $100.',                 action: { type: 'pay_bank', amount: 100 } },
  { id: 'cc13', text: 'Pay school fees of $50.',                    action: { type: 'pay_bank', amount: 50 } },
  { id: 'cc14', text: 'Receive $25 consultancy fee.',               action: { type: 'collect_bank', amount: 25 } },
  { id: 'cc15', text: 'You are assessed for street repairs: $40 per house, $115 per hotel.', action: { type: 'pay_repairs', perHouse: 40, perHotel: 115 } },
  { id: 'cc16', text: 'You have won second prize in a beauty contest. Collect $10.', action: { type: 'collect_bank', amount: 10 } },
]

export function shuffle<T>(deck: T[]): T[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}
