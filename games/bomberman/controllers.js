const DEFAULT_CONTROLS = [
  { up: 'KeyD',       down: 'KeyC',       left: 'KeyE',       right: 'KeyB',       bomb: 'KeyA' },
  { up: 'KeyI',       down: 'KeyH',       left: 'KeyJ',       right: 'KeyG',       bomb: 'KeyF' },
  { up: 'KeyI',       down: 'KeyK',       left: 'KeyJ',       right: 'KeyL',       bomb: 'KeyO' },
  { up: 'Numpad8',    down: 'Numpad5',    left: 'Numpad4',    right: 'Numpad6',    bomb: 'Numpad0' }
];

const STORAGE_KEY = 'bomberman_controllers';

export class ControllerConfig {
  constructor() {
    this.controllers = this._load();
  }

  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length === 4) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load controller config:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.controllers));
    } catch (e) {
      console.warn('Failed to save controller config:', e);
    }
  }

  getControls(playerIndex) {
    if (playerIndex >= 0 && playerIndex < 4) {
      return this.controllers[playerIndex];
    }
    return DEFAULT_CONTROLS[playerIndex];
  }

  setControl(playerIndex, action, key) {
    if (playerIndex >= 0 && playerIndex < 4 && this.controllers[playerIndex]) {
      this.controllers[playerIndex][action] = key;
      this._save();
    }
  }

  resetToDefaults() {
    this.controllers = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
    this._save();
  }

  getAllControls() {
    return JSON.parse(JSON.stringify(this.controllers));
  }
}

export const CONTROLLER_CONFIG = new ControllerConfig();

export function getKeyDisplayName(key) {
  const keyNames = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Space': 'Space',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'Tab': 'Tab',
    'ShiftLeft': 'L-Shift',
    'ShiftRight': 'R-Shift',
    'ControlLeft': 'L-Ctrl',
    'ControlRight': 'R-Ctrl',
    'AltLeft': 'L-Alt',
    'AltRight': 'R-Alt',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Insert': 'Insert',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Numpad0': 'Num0',
    'Numpad1': 'Num1',
    'Numpad2': 'Num2',
    'Numpad3': 'Num3',
    'Numpad4': 'Num4',
    'Numpad5': 'Num5',
    'Numpad6': 'Num6',
    'Numpad7': 'Num7',
    'Numpad8': 'Num8',
    'Numpad9': 'Num9',
    'NumpadDecimal': 'Num.',
    'NumpadAdd': 'Num+',
    'NumpadSubtract': 'Num-',
    'NumpadMultiply': 'Num*',
    'NumpadDivide': 'Num/',
    'F1': 'F1',
    'F2': 'F2',
    'F3': 'F3',
    'F4': 'F4',
    'F5': 'F5',
    'F6': 'F6',
    'F7': 'F7',
    'F8': 'F8',
    'F9': 'F9',
    'F10': 'F10',
    'F11': 'F11',
    'F12': 'F12'
  };

  if (keyNames[key]) {
    return keyNames[key];
  }

  if (key.startsWith('Key')) {
    return key.slice(3);
  }

  if (key.startsWith('Digit')) {
    return key.slice(5);
  }

  if (key.startsWith('Numpad')) {
    return key;
  }

  return key;
}