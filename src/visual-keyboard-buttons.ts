import Keyboard, { IKeyboard, KeyboardButton } from './keyboard';
import { IDisposable } from './i-disposable';

const buttons: { label: KeyboardButton, alt: string, keyCode: number }[] = [
  { label: 0x1, alt: '1', keyCode: 49 },
  { label: 0x2, alt: '2', keyCode: 50 },
  { label: 0x3, alt: '3', keyCode: 51 },
  { label: 0xc, alt: '4', keyCode: 52 },
  { label: 0x4, alt: 'q', keyCode: 81 },
  { label: 0x5, alt: 'w', keyCode: 87 },
  { label: 0x6, alt: 'e', keyCode: 69 },
  { label: 0xd, alt: 'r', keyCode: 82 },
  { label: 0x7, alt: 'a', keyCode: 65 },
  { label: 0x8, alt: 's', keyCode: 83 },
  { label: 0x9, alt: 'd', keyCode: 68 },
  { label: 0xe, alt: 'f', keyCode: 70 },
  { label: 0xa, alt: 'z', keyCode: 90 },
  { label: 0x0, alt: 'x', keyCode: 88 },
  { label: 0xb, alt: 'c', keyCode: 67 },
  { label: 0xf, alt: 'v', keyCode: 86 }
];

const ACTIVE_BUTTON_CLASS = 'active';

export default class VisualKeyboardButtons implements IDisposable, IKeyboard {
  private buttons: {
    buttonElement: HTMLButtonElement,
    downListener: EventListener,
    upListener: EventListener,
    keydownListener: (event: KeyboardEvent) => void,
    keyupListener: (event: KeyboardEvent) => void
  }[];

  private pressedKey: KeyboardButton | null;
  private keypressListeners: ((buttonNumber: KeyboardButton) => void)[];

  constructor(private targetDom: HTMLElement) {
    this.buttons = [];

    this.pressedKey = null;
    this.keypressListeners = [];

    for (let button of buttons) {
      const buttonElement = document.createElement('button');
      const buttonText = document.createTextNode(button.label.toString(16));

      buttonElement.appendChild(buttonText);

      const sup = document.createElement('sup');
      const supText = document.createTextNode(button.alt);
      sup.appendChild(supText);

      buttonElement.appendChild(sup);

      targetDom.appendChild(buttonElement);

      const downListener = () => {
        this.pressedKey = button.label;
        this.keypressListeners.forEach(listener => { listener(button.label); });
        this.keypressListeners = [];
      };
      const upListener = () => {
        this.pressedKey = null;
      };

      const keydownListener = (event: KeyboardEvent) => {
        if (event.keyCode === button.keyCode) {
          buttonElement.classList.add(ACTIVE_BUTTON_CLASS);
        }
      };
      const keyupListener = (event: KeyboardEvent) => {
        if (event.keyCode === button.keyCode) {
          buttonElement.classList.remove(ACTIVE_BUTTON_CLASS);
        }
      };

      // TODO: this is a bit wasteful.
      document.addEventListener('keydown', keydownListener);
      document.addEventListener('keyup', keyupListener);

      buttonElement.addEventListener('mousedown', downListener);
      buttonElement.addEventListener('mouseup', upListener);

      this.buttons.push({
        buttonElement,
        downListener,
        upListener,
        keydownListener,
        keyupListener
      });
    }
  }

  public dispose() {
    for (
      let {
        buttonElement,
        downListener,
        upListener,
        keydownListener,
        keyupListener
      } of this.buttons
    ) {
      buttonElement.removeEventListener('mousedown', downListener);
      buttonElement.removeEventListener('mouseup', upListener);
      this.targetDom.removeChild(buttonElement);

      document.removeEventListener('keydown', keydownListener);
      document.removeEventListener('keyup', keyupListener);
    }
  }

  public getKeyboardState() { return this.pressedKey; }

  public getNextKeyboardPress(): Promise<KeyboardButton> {
    return new Promise<KeyboardButton>(resolve => {
      this.keypressListeners = this.keypressListeners.concat([
        code => { resolve(code); }
      ]);
    });
  }
}