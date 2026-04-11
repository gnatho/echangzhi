# 3D Dice Controller - Implementation Guide

## Overview

This document describes the complete refactor of the dice rolling system for the Snakes & Ladders game. The new implementation provides a production-ready, physically-plausible 3D dice animation while preserving the exact game logic and outcome mechanics.

---

## Architecture

### Components

1. **Dice3DController Class** (`dice-controller.js`)
   - Manages 3D dice animation with physics-based motion
   - Handles async roll resolution via Promises
   - Manages roll queue for rapid successive requests
   - Implements accessibility features

2. **Legacy Compatibility Functions**
   - `rollDice()` - Main entry point, maintains backward compatibility
   - `rollDiceAsync()` - Async version returning Promise
   - `rollDiceForce(value)` - Testing utility

3. **CSS Enhancements** (`snakes.css`)
   - Enhanced 3D cube styling with realistic lighting
   - Face-specific coloring for visual distinction
   - Reduced motion support for accessibility
   - Result face highlighting

---

## Integration Guide

### 1. Include the New Script

The dice controller script must be loaded BEFORE `snakes.js`:

```html
<!-- In games/snakes/index.html -->
<script src="dice-controller.js"></script>
<script src="questions.js"></script>
<script src="snakes.js"></script>
```

### 2. Initialize the Controller

The controller is automatically initialized when `initDOM()` is called. No manual initialization needed.

### 3. Call rollDice()

The existing game loop remains unchanged:

```javascript
// Existing code - still works
document.getElementById('dice').addEventListener('click', rollDice);

// Or via keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.waitingForRoll) {
        rollDice();
    }
});
```

### 4. Get Roll Result

The result is automatically passed to `movePlayer()` after animation completes:

```javascript
// Inside handleRollResult in dice-controller.js
setTimeout(() => {
    movePlayer(rollResult);
}, 450);
```

---

## Face Orientation (Standard Dice)

The dice uses proper pip configurations with the opposite-face sum rule:

| Face | Value | Position | Opposite |
|------|-------|----------|----------|
| Front | 1 | translateZ(100px) | 6 |
| Back | 6 | rotateY(180deg) | 1 |
| Right | 3 | rotateY(90deg) | 4 |
| Left | 4 | rotateY(-90deg) | 3 |
| Top | 2 | rotateX(90deg) | 5 |
| Bottom | 5 | rotateX(-90deg) | 2 |

**Sum of opposite faces = 7**

---

## Animation Flow

```
1. User clicks dice / presses Space
       ↓
2. Check gameState.waitingForRoll
       ↓
3. Show overlay, start animation
       ↓
4. Physics-based rotation (1200ms)
       ↓
5. Settle animation (400ms)
       ↓
6. Highlight result face
       ↓
7. Shrink and hide (450ms)
       ↓
8. Resolve Promise → movePlayer(result)
```

---

## Accessibility Features

### ARIA Labels
- Dice cube: `role="img"`, `aria-label="3D Dice"`
- Result announcement: `aria-live="polite"` for screen readers

### Keyboard Support
- Space key triggers roll when dice is focused
- Works with game-screen active state

### Reduced Motion
- Detects `prefers-reduced-motion: reduce` media query
- Falls back to simpler animation
- Can be toggled dynamically via `setReducedMotion()`

### Focus Styles
- Visible focus indicator on dice element
- Keyboard navigable

---

## Handling Rapid Successive Rolls

The controller queues roll requests automatically:

```javascript
// First roll
rollDice(); // Starts animation

// Second roll during animation
rollDice(); // Queued, will execute after first completes

// Third roll
rollDice(); // Queued
```

To check if rolling:
```javascript
if (isDiceRolling()) {
    console.log('Dice is currently rolling');
}
```

---

## Testing

### Run Dice Face Tests
```javascript
// Test all 6 faces in sequence
testDiceFaces();
```

### Run Rapid Roll Test
```javascript
// Test rapid successive rolls
testRapidRolls();
```

### Verify Opposite Face Sums
```javascript
// Verify 1+6=7, 2+5=7, 3+4=7
testOppositeFaceSums();
```

### Accessibility Test
```javascript
testAccessibility();
```

---

## Configuration Options

```javascript
const controller = new Dice3DController({
    rollDuration: 1500,      // Main roll animation duration (ms)
    settleDuration: 400,     // Settle animation duration (ms)
    bounceEnabled: true,     // Enable bounce effect
    reducedMotion: false     // Override reduced motion detection
});
```

---

## Cross-Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

### Fallbacks
- CSS 3D transforms: `transform-style: preserve-3d`
- Graceful degradation: 2D fallback for older browsers
- Reduced motion: Auto-detected and handled

---

## Performance Considerations

- Uses `requestAnimationFrame` for smooth animation
- CSS transforms for GPU acceleration
- Minimal DOM manipulation during animation
- Cleanup on component destroy

---

## File Structure

```
games/snakes/
├── index.html          # Updated with dice-controller.js
├── snakes.js           # Modified - removed old rollDice()
├── snakes.css          # Enhanced - better 3D visuals
├── dice-controller.js  # NEW - 3D dice controller
└── questions.js        # Unchanged
```

---

## Acceptance Criteria

### Normal Operation
- [ ] Rolling 1-6 produces correct face
- [ ] Dice animation is smooth and natural
- [ ] Result matches random outcome
- [ ] Opposite face sum rule: 1+6=7, 2+5=7, 3+4=7

### Rapid Successive Rolls
- [ ] Multiple rolls queued properly
- [ ] No crashes or inconsistent state
- [ ] All queued rolls execute in order

### Accessibility
- [ ] Reduced motion preference respected
- [ ] Keyboard navigation works (Space key)
- [ ] ARIA labels present
- [ ] Focus indicators visible

### Integration
- [ ] Token moves correct number of steps
- [ ] Turn progression works
- [ ] UI indicators synchronized
- [ ] Correct/Wrong buttons unaffected

---

## API Reference

### Dice3DController

```javascript
// Create instance
const controller = new Dice3DController(options);

// Roll dice (returns Promise)
const result = await controller.roll(); // 1-6

// Check if rolling
controller.isCurrentlyRolling(); // boolean

// Clear queue
controller.clearQueue();

// Force result (testing)
controller.roll(3); // Always rolls 3

// Cleanup
controller.destroy();
```

### Global Functions

```javascript
// Initialize (called automatically)
initDiceController();

// Async roll (for advanced use)
rollDiceAsync(gameState); // Returns Promise<number>

// Backward compatible roll
rollDice();

// Force specific result (testing)
rollDiceForce(5);

// Check state
isDiceRolling(); // boolean
getDiceController(); // returns controller instance
resetDiceController(); // resets state
```

---

## Sample Code

### Basic Usage

```javascript
// Simple roll - animation completes, then movePlayer called
rollDice();

// Async usage - get result directly
const result = await rollDiceAsync(gameState);
movePlayer(result);

// Force result for testing
rollDiceForce(6);
```

### Custom Animation Duration

```javascript
// Adjust timing
const controller = getDiceController();
controller.options.rollDuration = 2000;
controller.options.settleDuration = 600;
```

---

## Troubleshooting

### Dice Not Visible
- Check that `#dice-cube` and `.dice-face` elements exist in HTML
- Verify CSS is loaded

### Animation Not Playing
- Check if reduced motion is enabled
- Verify browser supports CSS 3D transforms

### Rolls Not Executing
- Check `gameState.waitingForRoll` is true
- Verify game is not over: `!gameState.gameOver`

### Result Mismatch
- Use `rollDiceForce(value)` to test specific outcomes
- Check `calculateFinalRotation()` mapping

---

## Future Enhancements

Possible improvements:
1. Sound effects synchronized with bounce
2. Camera shake on impact
3. Shadow that moves with dice
4. Multiple dice for advanced games
5. Touch gesture support for mobile