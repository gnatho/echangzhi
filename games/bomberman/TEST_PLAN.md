# Bomberman Game - Acceptance Criteria & Test Plan

## Architecture Overview

The game is organized into the following modules:

| Module | File | Responsibility |
|--------|------|----------------|
| Configuration | `config.js` | All tunable constants: tileSize, grid dimensions, baseSpeed, bombDelay, bombLimit, etc. |
| Map | `map.js` | Grid generation, tile queries, pixel-to-grid conversion, destructible walls |
| Player | `player.js` | Tile-center-to-tile-center movement, animation, direction queuing |
| Bomb System | `bombs.js` | Bomb placement, countdown timers, explosion propagation, chain reactions |
| Collision | `collision.js` | 4-corner point collision against walls, blocks, and bombs |
| Input | `input.js` | Keyboard and gamepad polling with drift-free deadzone |
| Renderer | `renderer.js` | Layered canvas rendering: grid, powerups, bombs, explosions, players, particles |
| Particles | `particles.js` | Particle emission, physics (gravity), lifecycle management |
| On-Screen Controls | `onscreen-controls.js` | Touch-friendly D-pad and bomb button |
| Main | `bomberman.js` | Game orchestration, fixed-timestep loop, UI integration |

## Configuration Object

All key parameters are in `config.js` and can be tweaked:

```js
CONFIG = {
  TILE_SIZE: 48,           // Pixel size of each tile
  GRID_WIDTH: 15,          // Map width in tiles
  GRID_HEIGHT: 13,         // Map height in tiles
  BASE_SPEED: 180,         // Pixels per second for player movement
  BOMB_DELAY_MS: 3000,     // Milliseconds before bomb explodes
  BOMB_LIMIT: 1,           // Default max simultaneous bombs per player
  EXPLOSION_DURATION_MS: 500,
  PLAYER_RADIUS: 14,
  CENTER_THRESHOLD_RATIO: 0.35,
  FIXED_TIMESTEP: 1/60,    // 60 Hz fixed update rate
  MAX_FRAME_TIME: 0.25,
  POWERUP_SPAWN_CHANCE: 0.08,
  POWERUP_DROP_CHANCE: 0.3,
  BLOCK_SPAWN_CHANCE: 0.7,
  SAFE_ZONE_SIZE: 3,
  INDESTRUCTIBLE_PILLAR_SPACING: 2
}
```

## Acceptance Criteria

### AC-1: Smooth Center-to-Center Movement
- Player position is stored in pixels
- Movement targets are tile centers (tileX * tileSize + tileSize/2, tileY * tileSize + tileSize/2)
- Player interpolates smoothly from current tile center to target tile center using `moveProgress / TILE_SIZE`
- Player always ends movement exactly at a tile center (snapped via `snapToTargetCenter()`)
- Movement is frame-rate independent via fixed timestep accumulator

### AC-2: Direction Queuing
- When a directional input is given while the player is moving, the direction is queued
- When the player arrives at a tile center, the queued direction is checked
- If the adjacent tile in the queued direction is walkable, movement begins immediately
- No stuttering or hesitation when changing directions at tile centers

### AC-3: Collision Resolution
- 4-corner point collision detection prevents clipping into walls/blocks/bombs
- Buffer collisions resolve gracefully: if a corner would enter a blocked tile, movement is prevented
- Player cannot enter tiles occupied by bombs
- Player can leave a tile immediately after planting a bomb (bomb blocks entry, not exit)

### AC-4: Bomb Placement
- Bomb is placed on the player's current tile, centered at the tile center
- Bomb placement does NOT freeze or lock the player
- Player can walk off the bomb tile immediately after planting
- Bomb acts as a temporary obstacle on its tile until detonation
- Bomb countdown timer decreases in real-time (seconds, not frames)

### AC-5: Explosion Behavior
- Explosion propagates in 4 cardinal directions up to bomb.range tiles
- Indestructible walls stop propagation
- Destructible blocks are destroyed and stop propagation
- Chain reactions: explosions touching other bombs set their timer to 0
- Players on explosion tiles are killed

### AC-6: Performance
- Fixed timestep game loop (60 Hz) with accumulator prevents spiral of death
- Max frame time cap (250ms) prevents large jumps after tab-switch
- No per-frame allocations in hot paths
- requestAnimationFrame-based rendering loop

### AC-7: Input Support
- Keyboard: 4 players with distinct key bindings
- Gamepad: Standard gamepad API with 0.5 deadzone on analog sticks
- On-screen D-pad and bomb button for touch devices (auto-shown on touch devices)
- All input sources are normalized into a single direction string

## Test Plan

### Test 1: Smooth Center-to-Center Movement (All 4 Directions)
**Steps:**
1. Start game with 1 player
2. Hold Arrow Right - observe player slides smoothly to the right tile center
3. Release, then hold Arrow Left - observe player slides back to the left tile center
4. Repeat for Arrow Up and Arrow Down
5. Verify player always stops exactly centered on tiles (no half-tile offsets)

**Expected:** Player moves at a constant speed from tile center to tile center with smooth interpolation. No jitter, no overshooting, no undershooting.

### Test 2: No Immobilization After Bomb Planting
**Steps:**
1. Start game with 1 player
2. Move to an open tile
3. Press Space to drop a bomb
4. Immediately press Arrow Right (or any direction)
5. Verify player moves away from the bomb tile without hesitation

**Expected:** Player walks off the bomb tile normally. The bomb blocks re-entry to that tile but does not trap the player.

### Test 3: Bomb Placement and Detention
**Steps:**
1. Drop a bomb on an open tile
2. Walk away from the bomb
3. Wait for the bomb timer to expire (~3 seconds)
4. Verify explosion appears with correct radius (default: 2 tiles in each direction)
5. Verify destructible blocks in explosion path are destroyed
6. Verify indestructible walls stop the explosion

**Expected:** Bomb explodes after countdown, explosion propagates correctly, blocks are destroyed, walls block explosion.

### Test 4: Bomb Does Not Block Movement in Normal Operation
**Steps:**
1. Drop a bomb
2. Walk around the bomb (not through it)
3. Verify you can navigate all adjacent tiles
4. Verify you cannot walk onto the bomb's tile
5. Verify you can walk off the bomb's tile immediately after planting

**Expected:** Bomb acts as a temporary obstacle on its tile only. Player can freely navigate around it.

### Test 5: Performance
**Steps:**
1. Open browser DevTools > Performance tab
2. Start recording
3. Play for 30 seconds with multiple players, bombs, and explosions
4. Stop recording and check frame rate

**Expected:** Consistent 60 FPS. No frame drops below 55 FPS during normal gameplay. No memory leaks (particle count stays bounded).

### Test 6: Direction Change at Tile Center
**Steps:**
1. Move player right continuously
2. While moving, press Up before reaching the next tile center
3. Observe that the player reaches the tile center, then immediately turns up
4. No stuttering or pause at the turn

**Expected:** Direction change happens seamlessly at the tile center. The queued direction is applied without delay.

### Test 7: Gamepad Input
**Steps:**
1. Connect a gamepad
2. Use left analog stick to move
3. Press button 0 (A/Cross) to drop bomb
4. Verify movement and bomb placement work correctly

**Expected:** Gamepad input works identically to keyboard input. Deadzone prevents drift.

### Test 8: On-Screen Controls (Touch Devices)
**Steps:**
1. Open game on a touch device or use Chrome DevTools device emulation
2. Verify D-pad and bomb button are visible
3. Tap D-pad directions and verify movement
4. Tap bomb button and verify bomb placement

**Expected:** On-screen controls appear on touch devices. Tapping D-pad moves player. Tapping bomb button drops a bomb.

## How to Run

1. Open `games/bomberman/bomberman.html` in a modern browser (Chrome, Firefox, Edge)
2. Note: Must be served via HTTP (not file://) for ES modules to work. Use a local server:
   ```
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000/games/bomberman/bomberman.html`
3. Select number of players and character tokens
4. Click "Start Game"
5. Use keyboard controls as shown in the controls bar at the bottom
