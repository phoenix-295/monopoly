export const TOKENS = [
  { id: 'top_hat',  emoji: '🎩', label: 'Top Hat'   },
  { id: 'car',      emoji: '🚗', label: 'Car'        },
  { id: 'dog',      emoji: '🐕', label: 'Dog'        },
  { id: 'ship',     emoji: '⛵', label: 'Ship'       },
  { id: 'iron',     emoji: '🪂', label: 'Iron'       },
  { id: 'boot',     emoji: '👞', label: 'Boot'       },
] as const

export type TokenId = typeof TOKENS[number]['id']
