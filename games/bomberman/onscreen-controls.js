import { CONFIG } from './config.js';

export class OnScreenControls {
  constructor(container, playerId, controls) {
    this.container = container;
    this.playerId = playerId;
    this.controls = controls;
    this.activeDirection = null;
    this.bombCallback = null;

    this._buildUI();
  }

  _buildUI() {
    const wrapper = document.createElement('div');
    wrapper.className = 'onscreen-controls';
    wrapper.dataset.playerId = this.playerId;

    const dpad = document.createElement('div');
    dpad.className = 'dpad';

    const dirs = [
      { label: '\u25B2', dir: 'up', cls: 'up' },
      { label: '\u25BC', dir: 'down', cls: 'down' },
      { label: '\u25C0', dir: 'left', cls: 'left' },
      { label: '\u25B6', dir: 'right', cls: 'right' }
    ];

    for (const d of dirs) {
      const btn = document.createElement('button');
      btn.className = `dpad-btn ${d.cls}`;
      btn.textContent = d.label;
      btn.dataset.dir = d.dir;

      const setDir = (dir) => { this.activeDirection = dir; };
      const clearDir = () => { if (this.activeDirection === d.dir) this.activeDirection = null; };

      btn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir(d.dir); });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); clearDir(); });
      btn.addEventListener('touchcancel', (e) => { clearDir(); });
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); setDir(d.dir); });
      btn.addEventListener('mouseup', (e) => { e.preventDefault(); clearDir(); });
      btn.addEventListener('mouseleave', (e) => { clearDir(); });

      dpad.appendChild(btn);
    }

    const bombBtn = document.createElement('button');
    bombBtn.className = 'bomb-btn-onscreen';
    bombBtn.textContent = '\uD83D\uDCA3';

    bombBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.bombCallback) this.bombCallback(this.playerId);
    });
    bombBtn.addEventListener('click', () => {
      if (this.bombCallback) this.bombCallback(this.playerId);
    });

    wrapper.appendChild(dpad);
    wrapper.appendChild(bombBtn);
    this.container.appendChild(wrapper);
  }

  getDirection() {
    return this.activeDirection;
  }

  onBomb(callback) {
    this.bombCallback = callback;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
