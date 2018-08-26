import ReadOnlyMap from './read-only-map';

import { IDisposable } from './i-disposable';

export type KeyboardButton =
  0x1 | 0x2 | 0x3 | 0xC |
  0x4 | 0x5 | 0x6 | 0xD |
  0x7 | 0x8 | 0x9 | 0xE |
  0xA | 0x0 | 0xB | 0xF
  ;

export interface IKeyboard {
  getKeyboardState: () => KeyboardButton | null;
  getNextKeyboardPress: () => Promise<KeyboardButton>;
};

const keycodeMapping = new ReadOnlyMap(new Map<number, KeyboardButton>([
  [ 49, 0x1 ],
  [ 50, 0x2 ],
  [ 51, 0x3 ],
  [ 52, 0xc ],
  [ 81, 0x4 ],
  [ 87, 0x5 ],
  [ 69, 0x6 ],
  [ 82, 0xd ],
  [ 65, 0x7 ],
  [ 83, 0x8 ],
  [ 68, 0x9 ],
  [ 70, 0xe ],
  [ 90, 0xa ],
  [ 88, 0x0 ],
  [ 67, 0xb ],
  [ 86, 0xf ],
]));

export default class Keyboard implements IDisposable, IKeyboard {
  private pressedKey: KeyboardButton | null;
  private keypressListeners: ((buttonNumber: KeyboardButton) => void)[];

  private onKeydown = (event: KeyboardEvent) => {
    const buttonCode = keycodeMapping.get(event.keyCode);
    if (buttonCode !== undefined) {
      this.pressedKey = buttonCode;
      this.keypressListeners.forEach(listener => { listener(buttonCode); });
      this.keypressListeners = [];
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.pressedKey = null;
  };

  constructor() {
    this.pressedKey = null;
    this.keypressListeners = [];

    document.addEventListener('keydown', this.onKeydown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  public dispose() {
    document.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  public getKeyboardState() {
    return this.pressedKey;
  }

  public getNextKeyboardPress(): Promise<KeyboardButton> {
    return new Promise<KeyboardButton>(resolve => {
      this.keypressListeners = this.keypressListeners.concat([
        code => { resolve(code); }
      ]);
    });
  }
}
