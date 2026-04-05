export class InputHandler {
  constructor() {
    this.keyStates = {};
    this.gamepadStates = {};
    this.bombPressed = {};
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  _onKeyDown(e) {
    this.keyStates[e.code] = true;
  }

  _onKeyUp(e) {
    this.keyStates[e.code] = false;
  }

  getDirection(controls) {
    if (this.keyStates[controls.left])  return 'left';
    if (this.keyStates[controls.right]) return 'right';
    if (this.keyStates[controls.up])    return 'up';
    if (this.keyStates[controls.down])  return 'down';
    return null;
  }

  isBombPressed(playerId, controls) {
    if (this.keyStates[controls.bomb]) {
      if (!this.bombPressed[playerId]) {
        this.bombPressed[playerId] = true;
        return true;
      }
    } else {
      this.bombPressed[playerId] = false;
    }
    return false;
  }

  pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;

      const deadzone = 0.5;
      let dir = null;
      if (gp.axes[0] < -deadzone) dir = 'left';
      else if (gp.axes[0] > deadzone) dir = 'right';
      else if (gp.axes[1] < -deadzone) dir = 'up';
      else if (gp.axes[1] > deadzone) dir = 'down';

      this.gamepadStates[i] = {
        direction: dir,
        bomb: gp.buttons[0] && gp.buttons[0].pressed
      };
    }
  }

  getGamepadDirection(index) {
    return this.gamepadStates[index] ? this.gamepadStates[index].direction : null;
  }

  isGamepadBombPressed(index) {
    if (this.gamepadStates[index] && this.gamepadStates[index].bomb) {
      if (!this.gamepadStates[index].bombConsumed) {
        this.gamepadStates[index].bombConsumed = true;
        return true;
      }
    } else if (this.gamepadStates[index]) {
      this.gamepadStates[index].bombConsumed = false;
    }
    return false;
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
  }
}
