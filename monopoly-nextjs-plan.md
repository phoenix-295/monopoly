# 🎲 Monopoly Online — Next.js Project Plan

A complete phase-by-phase development plan for building a multiplayer Monopoly game
using **Next.js**, **Supabase**, and **Vercel**.

---

## Overview

| Detail | Info |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth + DB + Realtime | Supabase |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State Management | Zustand + Immer |
| Hosting | Vercel (app) + Supabase (backend) |
| Total Phases | 6 |
| Estimated Duration | 10–14 weeks (solo dev) |

---

## Phase 1 — Project Setup & Foundation

**Duration:** ~1 week

**Goal:** Get the skeleton of the project running locally with all tools configured correctly before writing any game logic.

### What to do

- Scaffold a new Next.js 14 project using the App Router
- Set up Tailwind CSS and configure a base design system (colors, fonts, spacing)
- Create a Supabase project and connect it to the Next.js app
- Install and configure Zustand for client-side state management
- Set up ESLint, Prettier, and a `.env.local` file for secrets
- Push to a GitHub repository and connect to Vercel for CI/CD (every push auto-deploys)

### Folder structure to establish

```
/app
  /lobby          → Room creation and joining
  /game/[code]    → Active game screen
  /login          → Auth page
  /profile        → Player stats
/components
  /board          → Board, squares, tokens
  /ui             → Buttons, modals, cards
/lib
  /supabase.ts    → Supabase client
  /game-engine    → Core game logic
/store
  gameStore.ts    → Zustand global state
```

### Environment variables to configure

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Done when

- App runs locally at `localhost:3000`
- Supabase is connected and you can query from the app
- GitHub repo is live and Vercel auto-deploys on push

---

## Phase 2 — Authentication & Room System

**Duration:** ~1.5 weeks

**Goal:** Players can sign up, log in (or play as a guest), create a room with a code, and share that code with friends to join.

### Authentication

- Implement Supabase Auth with email/password sign up and login
- Add Google OAuth as an alternative login option
- Support **guest mode** — player just enters a username, Supabase creates an anonymous session
- Build the login page UI at `/login`
- Protect game routes — redirect to login if no session

### Supabase tables to create

```sql
-- Extends Supabase's built-in auth.users
profiles (
  id           uuid references auth.users primary key,
  username     text unique not null,
  avatar_url   text,
  wins         int default 0,
  losses       int default 0,
  created_at   timestamptz default now()
)

-- Game rooms
rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,       -- e.g. "MNP-4X2"
  host_id      uuid references profiles,
  status       text default 'waiting',    -- waiting | active | finished
  max_players  int default 6,
  settings     jsonb default '{}',        -- house rules, timer, etc.
  created_at   timestamptz default now()
)

-- Players inside a room
room_players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid references rooms on delete cascade,
  user_id      uuid references profiles,
  token        text,                       -- top_hat | car | dog | etc.
  turn_order   int,
  is_ready     boolean default false,
  joined_at    timestamptz default now()
)
```

### Room flow to build

- **Create Room** → generates a unique 6-character code (e.g. `MNP-4X2`), saves to DB, redirects host to `/lobby/MNP-4X2`
- **Join Room** → player enters code on the home page, server validates it exists and isn't full, inserts into `room_players`, redirects to `/lobby/MNP-4X2`
- **Lobby screen** at `/lobby/[code]`:
  - Shows all connected players in real time using Supabase Realtime
  - Each player has a ready/not-ready toggle
  - Host sees the room code prominently with a copy button
  - Host can kick players
  - "Start Game" button appears when 2+ players are all ready

### Row Level Security (add immediately after creating each table)

```sql
-- profiles: users can only update their own row
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- rooms: anyone can read, only host can update/delete
alter table rooms enable row level security;
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (auth.uid() = host_id);
create policy "rooms_update" on rooms for update using (auth.uid() = host_id);

-- room_players: members of the room can read; users insert/delete their own row
alter table room_players enable row level security;
create policy "room_players_select" on room_players for select using (true);
create policy "room_players_insert" on room_players for insert with check (auth.uid() = user_id);
create policy "room_players_delete" on room_players for delete using (auth.uid() = user_id);
```

### Done when

- Can sign up, log in, and play as a guest
- Can create a room and get a shareable code
- A second browser tab (or another device) can join using that code
- Both players appear in the lobby in real time
- RLS policies verified: player cannot modify another player's row

---

## Phase 3 — Game Board & UI

**Duration:** ~2 weeks

**Goal:** Render the complete Monopoly board visually with all 40 squares, property colors, names, and prices. No game logic yet — just the visual layer.

### Board layout

- Use CSS Grid to create an 11×11 grid where the outer ring of cells forms the board
- The 4 corner squares are larger (Go, Jail, Free Parking, Go To Jail)
- Text and property strips rotate based on which side of the board they're on
- The center of the board shows logos, player info, or a card draw area

### All 40 squares to implement

- **22 properties** across 8 color groups (Brown, Light Blue, Pink, Orange, Red, Yellow, Green, Dark Blue)
- **4 railroads** (Reading, Pennsylvania, B&O, Short Line)
- **2 utilities** (Electric Company, Water Works)
- **3 Chance squares** and **3 Community Chest squares**
- **Tax squares** (Income Tax, Luxury Tax)
- **4 corners** (Go, Jail/Just Visiting, Free Parking, Go To Jail)

### Components to build

- `<Board />` — the outer grid container
- `<Square />` — individual square with color strip, name, price
- `<Token />` — player piece that sits on a square, stacks when multiple players share it
- `<PropertyCard />` — popup showing full deed info (rent table, house costs, mortgage value)
- `<Dice />` — animated dice pair (CSS 3D or SVG-based animation)
- `<PlayerPanel />` — sidebar showing each player's cash, properties, and net worth
- `<EventLog />` — scrolling feed of game events ("Nikhil bought Boardwalk for $400")

### Done when

- Full board renders correctly at different screen sizes
- All 40 squares show the right name, price, and color
- Clicking a property opens a popup with its deed card
- Player tokens can be placed on any square manually (no movement logic yet)

---

## Phase 4 — Core Game Engine

**Duration:** ~3 weeks

**Goal:** Implement all Monopoly rules as a pure TypeScript game engine that takes a game state + player action and returns a new game state. This is completely separate from the UI.

### Game state shape

```typescript
type GameState = {
  players: Player[]
  board: Square[]
  currentTurn: string         // player id
  phase: TurnPhase            // rolling | moving | landing | buying | auctioning | end
  bank: { houses: number; hotels: number }
  deck_chance: Card[]
  deck_community: Card[]
  winner: string | null
}
```

### Turn state machine

Each turn flows through these phases in order:

```
WAITING → ROLLING → MOVING → LANDING → ACTION → END_TURN
```

With branching sub-states: `BUYING`, `AUCTIONING`, `TRADING`, `IN_JAIL`, `BANKRUPT`

### Rules to implement (in priority order)

**Movement**
- Roll two dice, move that many squares forward
- Rolling doubles → take another turn (max 3 doubles in a row → go to jail)
- Passing Go → collect $200
- Landing on Go To Jail → move directly to jail, do not pass Go

**Properties**
- Landing on an unowned property → offer to buy at list price
- Player declines to buy → trigger auction (all players bid, highest wins)
- Landing on owned property → pay rent to owner
- Rent increases when owner has a monopoly (all of a color group)
- Building houses (must own full color group, build evenly across group)
- Building hotels (4 houses → 1 hotel, limited supply of 32 houses and 12 hotels)
- Mortgaging a property → no rent collected, receive half the list price
- Unmortgaging → pay back half price plus 10% interest

**Rent calculation**
- Regular properties: rent table based on houses/hotels (0–5 levels)
- Railroads: $25 × (2 ^ number of railroads owned by same player)
- Utilities: dice roll × 4 (one utility) or dice roll × 10 (both utilities)

**Cards**
- 16 Chance cards, 16 Community Chest cards — shuffled independently
- Effects: move to a specific square, pay the bank, collect from bank, collect from all players, pay all players, go to jail, get out of jail free, pay for repairs (per house/hotel)

**Jail**
- Enter jail via: landing on Go To Jail, drawing a jail card, rolling 3 doubles
- Exit jail via: paying $50 before rolling, using a Get Out of Jail Free card, rolling doubles (3 attempts max — on 3rd failed attempt must pay $50 and move)
- Rent is still collected while in jail

**Bankruptcy**
- When a player cannot pay a debt, they must sell houses, unmortgage, and sell properties
- If still unable to pay → declare bankrupt, all remaining assets go to the creditor (or back to bank if tax/card debt)
- Bankrupt player is eliminated from the game
- Last player standing wins

**Trading**
- Any player can initiate a trade with another on their turn or between turns
- Trade can include: properties, cash, Get Out of Jail Free cards
- Both players must accept for trade to complete

### Done when

- All rules are implemented and tested with Jest unit tests
- Rent is correctly calculated for all property types
- Bankruptcy and elimination work correctly
- A full game can be played through to completion in test

---

## Phase 5 — Multiplayer & Real-time Sync

**Duration:** ~2 weeks

**Goal:** Connect the game engine to the database so all players see the same state in real time. Every action by one player instantly updates everyone else's screen.

### Supabase table for game state

```sql
game_state (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references rooms on delete cascade unique,
  state       jsonb not null,    -- the full GameState object serialized
  version     int not null default 0,  -- incremented on every write for optimistic locking
  updated_at  timestamptz default now()
)

-- Required: full event log for disconnect/rejoin recovery and replay
game_events (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references rooms,
  player_id   uuid references profiles,
  action      text,             -- "roll_dice" | "buy_property" | "end_turn" etc.
  payload     jsonb,
  created_at  timestamptz default now()
)
```

### How real-time sync works

```
Player clicks "Roll Dice"
        ↓
Next.js API Route receives action (includes current version number from client)
        ↓
Server fetches current game_state from Supabase (reads id + version + state)
        ↓
Game engine processes action → returns new game_state
        ↓
Server writes new state with atomic version check:
  UPDATE game_state SET state = $new, version = version + 1, updated_at = now()
  WHERE room_id = $roomId AND version = $expectedVersion
  → if 0 rows updated: another action won the race → return 409 Conflict to client
  → client retries by re-fetching latest state and re-submitting
        ↓
Supabase Realtime detects the row change
        ↓
Broadcasts new state to ALL connected players simultaneously
        ↓
Every client's UI updates to reflect the new state
```

### API routes to build

```
POST /api/game/start          → Initialize game state, assign turn order
POST /api/game/roll-dice      → Roll dice, move player, determine landing action
POST /api/game/buy-property   → Purchase a property
POST /api/game/pass-property  → Decline purchase, trigger auction
POST /api/game/bid            → Place a bid in an auction
POST /api/game/build          → Buy houses or hotels
POST /api/game/mortgage       → Mortgage a property
POST /api/game/trade          → Propose or accept a trade
POST /api/game/end-turn       → End current player's turn
```

### Turn enforcement

- Server validates that the player making the request is the current turn's player
- Actions are validated server-side (player can't buy if they can't afford it)
- If a player disconnects, a 90-second timer starts — if they don't reconnect, their turn is skipped

### Client-side Supabase Realtime subscription

```typescript
// Subscribe to game state changes in the room
supabase
  .channel(`game:${roomCode}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'game_state',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    // Update Zustand store with new state
    useGameStore.setState({ game: payload.new.state })
  })
  .subscribe()
```

### Done when

- Two players in different browsers see the same board
- One player rolls dice and both boards animate the token moving
- Buying a property updates both players' UIs instantly
- The game correctly enforces whose turn it is

---

## Phase 6 — Polish, Edge Cases & Deployment

**Duration:** ~1.5 weeks

**Goal:** Handle all the rough edges, add sound/animations, and deploy the finished game publicly.

### Animations to add

- Dice rolling animation (3D CSS flip or canvas-based)
- Token movement — step-by-step along the board, not a teleport
- Money flying off the screen when paying rent
- Card flip animation for Chance and Community Chest
- Property card slide-in when landing on a new property

### Sound effects

- Dice roll
- Token movement (each step)
- Buying a property (cash register)
- Paying rent (coins dropping)
- Going to jail (jail door slam)
- Winning (celebration fanfare)

### Edge cases to handle

- Player closes tab mid-game → state is preserved in DB, they can rejoin via room code
- All other players leave → show a "waiting for players" screen
- Host disconnects → promote next player to host
- House/hotel supply runs out → players must wait until others sell back
- Trade is proposed but other player disconnects → auto-decline after timeout
- Network goes offline momentarily → show a reconnecting banner

### House rules to add as toggleable settings

- **Free Parking jackpot** — taxes go to center, first to land collects it
- **Auctions on/off** — some groups skip auctions when a player declines
- **Speed die** — extra die for faster games
- **No build until full lap** — must pass Go before buying houses

### Profile and stats page

- Total wins, losses, games played
- Total rent collected across all games
- Favorite property / most bought property
- Past game history with final standings

### Pre-deployment checklist

- Verify all RLS policies under adversarial conditions (player spoofing another's user_id)
- Make sure all sensitive logic runs server-side (no client-side cheating)
- Add rate limiting to API routes
- Test on mobile browsers (board must scale correctly)
- Run Lighthouse audit — aim for 90+ performance score
- Set up error logging (Sentry or Vercel's built-in logs)

### Deployment

```
1. Push final code to GitHub main branch
2. Vercel auto-deploys from GitHub (already connected from Phase 1)
3. Add production environment variables in Vercel dashboard
4. Enable Supabase Realtime on the game_state table
5. Set up UptimeRobot to monitor the Vercel URL
6. Share the URL!
```

### Done when

- Game is playable end-to-end: login → create room → share code → play → win screen
- Deployed on Vercel with a custom domain (optional)
- No crashes during a full 4-player game

---

## Phase Summary

| Phase | Focus | Duration |
|---|---|---|
| 1 | Project setup, tooling, folder structure | ~1 week |
| 2 | Auth, guest mode, room codes, lobby | ~1.5 weeks |
| 3 | Board UI, all 40 squares, visual components | ~2 weeks |
| 4 | Game engine — all Monopoly rules in TypeScript | ~3 weeks |
| 5 | Multiplayer sync via Supabase Realtime | ~2 weeks |
| 6 | Polish, animations, sounds, deployment | ~1.5 weeks |
| **Total** | | **~11 weeks** |

---

## Tech Stack Reference

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Auth | Supabase Auth | Login, guest sessions, OAuth |
| Database | Supabase PostgreSQL | Game state, rooms, profiles |
| Real-time | Supabase Realtime | Instant state sync across players |
| State (client) | Zustand + Immer | Local UI state management |
| Styling | Tailwind CSS | Utility-first styling |
| Animation | Framer Motion | Token movement, card flips |
| Testing | Jest + Playwright | Unit tests for game engine |
| Hosting | Vercel | Free, zero-config Next.js deployment |
| Monitoring | UptimeRobot | Keep app alive, uptime alerts |

---

*Start with Phase 1 and resist the urge to jump ahead — the foundation determines everything.*
