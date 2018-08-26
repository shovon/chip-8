type KeyboardButton =
  0x1 | 0x2 | 0x3 | 0xC |
  0x4 | 0x5 | 0x6 | 0xD |
  0x7 | 0x8 | 0x9 | 0xE |
  0xA | 0x0 | 0xB | 0xF
  ;

interface IKeyboard {
  getKeyboardState: () => KeyboardButton | null;
  getNextKeyboardPress: () => Promise<KeyboardButton | null>;
};

interface IDisposable {
  dispose(): void
}

class ReadOnlyMap<K, V> {
  constructor(private map: Map<K, V>) {}

  get(key: K): V | undefined { return this.map.get(key); }
}

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

class Keyboard implements IDisposable, IKeyboard {
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

  public getNextKeyboardPress() {
    return new Promise<KeyboardButton>(resolve => {
      this.keypressListeners = this.keypressListeners.concat([
        code => { resolve(code); }
      ]);
    });
  }
}

const CHIP8_MEMORY_SIZE = 0x1000;
const CHIP8_PROGRAM_MEMORY_LOCATION = 0x200;
const CHIP8_REGISTERS_COUNT = 0x10;
const CHIP8_STACK_SIZE = 0x10;
const CHIP8_DISPLAY_WIDTH = 64;
const CHIP8_DISPLAY_HEIGHT = 32;

class Chip8 implements IDisposable {
  private memory: Uint8Array;
  private V: Uint8Array;
  private I: number;
  private dt: number;
  private st: number;
  private PC: number;
  private SP: number;
  private stack: Uint16Array;
  private display: Array<boolean>;
  private timersInterval: number;
  private cleared: boolean;

  constructor(private keyboard: IKeyboard) {
    this.memory = new Uint8Array(CHIP8_MEMORY_SIZE);

    // TODO: set hex sprites here.

    const digitSprites = [
      // 0
      0xF0,
      0x90,
      0x90,
      0x90,
      0xF0,

      // 1
      0x20,
      0x60,
      0x20,
      0x20,
      0x70,

      // 2
      0xF0,
      0x10,
      0xF0,
      0x80,
      0xF0,

      // 3
      0xF0,
      0x10,
      0xF0,
      0x10,
      0xF0,

      // 4
      0x90,
      0x90,
      0xF0,
      0x10,
      0x10,

      // 5
      0xF0,
      0x80,
      0xF0,
      0x10,
      0xF0,

      // 6
      0xF0,
      0x80,
      0xF0,
      0x90,
      0xF0,

      // 7
      0xF0,
      0x10,
      0x20,
      0x40,
      0x40,

      // 8
      0xF0,
      0x90,
      0xF0,
      0x90,
      0xF0,

      // 9
      0xF0,
      0x90,
      0xF0,
      0x10,
      0xF0,

      // A
      0xF0,
      0x90,
      0xF0,
      0x90,
      0x90,

      // B
      0xE0,
      0x90,
      0xE0,
      0x90,
      0xE0,

      // C
      0xF0,
      0x80,
      0x80,
      0x80,
      0xF0,

      // D
      0xE0,
      0x90,
      0x90,
      0x90,
      0xE0,

      // E
      0xF0,
      0x80,
      0xF0,
      0x80,
      0xF0,

      // F
      0xF0,
      0x80,
      0xF0,
      0x80,
      0x80,
    ];

    digitSprites.forEach((digit, i) => {
      this.writeUint8(i, digit);
    });

    this.V = new Uint8Array(CHIP8_REGISTERS_COUNT);
    this.I = 0;
    this.dt = 0;
    this.st = 0;
    this.PC = CHIP8_PROGRAM_MEMORY_LOCATION;
    this.SP = -1;
    this.stack = new Uint16Array(CHIP8_STACK_SIZE);
    this.display = new Array(CHIP8_DISPLAY_HEIGHT * CHIP8_DISPLAY_HEIGHT);
    this.display.fill(false);

    // TODO: resource leak potential!
    this.timersInterval = setInterval(() => {
      this.dt--;
      this.st--;
      if (this.dt <= 0) {
        this.dt = 0;
      }
      if (this.st <= 0) {
        this.st = 0;
      }
    }, Math.floor(1000 / 60));

    this.cleared = false;
  }

  public loadProgram(program: Uint8Array) {
    this.memory.set(program, 0x200);
  }

  public dispose() {
    clearInterval(this.timersInterval);
    this.cleared = true;
  }

  public getDisplay() {
    return this.display.slice();
  }

  private readUint16(address: number) {
    const msb = this.memory[address];
    const lsb = this.memory[address + 1];
    return (msb << 8) & lsb;
  }

  private writeUint8(address: number, value: number) {
    this.memory[address] = value;
  }

  private readUint8(address: number) { return this.memory[address]; }

  public async runNext() {
    if (this.cleared) {
      throw new Error(
        'The CPU has been disposed, and thus, nothing can be run'
      );
    }

    const instruction = this.readUint16(this.PC);
    const opcode = (instruction >> 24) & 0xF;
    const nnn = instruction & 0xFFF;
    const n = instruction & 0xF;
    const x = (instruction >> 16) & 0xF;
    const y = (instruction >> 8) & 0xF;
    const kk = instruction & 0xFF;

    this.PC += 2;

    switch (opcode) {
      case 0x0: {
        switch (kk) {
          case 0xE0: {
            this.display.forEach((el, i) => {
              this.display[i] = false;
            });
          }; break;
          case 0xEE: {
            this.PC = this.stack[this.SP];
            this.SP--;
          }; break;
        }

        // Otherwise, just noop.
      }
      case 0x1: {
        this.PC = nnn;
      }; break;
      case 0x2: {
        this.SP++;
        this.stack[this.SP] = this.PC;
      }; break;
      case 0x3: {
        if (this.V[x] === kk) {
          this.PC += 2;
        }
      }; break;
      case 0x4: {
        if (this.V[x] !== kk) {
          this.PC += 2;
        }
      }; break;
      case 0x5: {
        // TODO: check to see if nibble absolutely must be 0.
        if (this.V[x] === this.V[y]) {
          this.PC += 2;
        }
      }; break;
      case 0x6: {
        this.V[x] = kk;
      }; break;
      case 0x7: {
        this.V[x] = this.V[x] + kk;
      }; break;
      case 0x8: {
        switch (n) {
          case 0x0: {
            this.V[x] = this.V[y];
          }; break;
          case 0x1: {
            this.V[x] = this.V[x] | this.V[y];
          }; break;
          case 0x2: {
            this.V[x] = this.V[x] & this.V[y];
          }; break;
          case 0x3: {
            this.V[x] = this.V[x] ^ this.V[y];
          }; break;
          case 0x4: {
            const shouldCarry = this.V[x] + this.V[y] > 255;
            this.V[x] = this.V[x] + this.V[y];
            this.V[0xf] = shouldCarry ? 1 : 0;
          }; break;
          case 0x5: {
            const noBorrow = this.V[x] > this.V[y];
            this.V[x] = this.V[x] - this.V[y];
            this.V[0xf] = noBorrow ? 1 : 0;
          }; break;
          case 0x6: {
            this.V[0xf] = (this.V[x] & 0x1) === 1 ? 1 : 0;
            this.V[x] = this.V[x] >> 1;
          }; break;
          case 0x7: {
            const noBorrow = this.V[y] > this.V[x];
            this.V[y] = this.V[x] - this.V[y];
            this.V[0xf] = noBorrow ? 1 : 0;
          }; break;
          case 0xE: {
            this.V[0xf] = (this.V[x] & 0x80) === 1 ? 1 : 0;
            this.V[x] = this.V[x] >> 1;
          }; break;
        }
      }; break;
      case 0x9: {
        if (this.V[x] !== this.V[y]) {
          this.PC += 2;
        }
      }; break;
      case 0xA: {
        this.I = nnn;
      }; break;
      case 0xB: {
        this.PC = nnn + this.V[0];
      }; break;
      case 0xC: {
        this.V[x] = Math.floor(Math.random() * 256) & kk;
      }; break;
      case 0xD: {
        let hasCollided = false;

        // Iterate through the rows of the sprite.
        for (let i = 0; i < n; i++) {
          const row = this.readUint8(this.I + i);

          // Iterate through the elements of the row, left-to-right.
          for (let px = 0; px < 8; px++) {

            const isSpritePixelWhite = !!((row >> (8 - px - 1)) & 0x1);

            const drawX = (this.V[x] + px) % CHIP8_DISPLAY_WIDTH;
            const drawY = (this.V[y] + i) % CHIP8_DISPLAY_HEIGHT;

            const index = drawX + CHIP8_DISPLAY_WIDTH * drawY;

            if (isSpritePixelWhite && this.display[index]) {
              this.display[index] = false;
              hasCollided = true;
            } else if (isSpritePixelWhite && !this.display[index]) {
              this.display[index] = true;
            }

          }

        }

        this.V[0xf] = hasCollided ? 1 : 0;
      }; break;
      case 0xE: {
        switch (kk) {
          case 0x9e: {
            if (this.V[x] === this.keyboard.getKeyboardState()) {
              this.PC += 2;
            }
          }; break;
          case 0xa1: {
            if (this.V[x] !== this.keyboard.getKeyboardState()) {
              this.PC += 2;
            }
          }; break;
        }
      }; break;
      case 0xF: {
        switch (kk) {
          case 0x07: {
            this.V[x] = this.dt;
          }; break;
          case 0x0a: {
            this.V[x] = await this.keyboard.getNextKeyboardPress();
          }; break;
          case 0x15: {
            this.dt = this.V[x];
          }; break;
          case 0x18: {
            this.st = this.V[x];
          }; break;
          case 0x1e: {
            this.I = this.I + this.V[x]
          }; break;
          case 0x29: {
            this.I = this.V[x] * 5;
          }; break;
          case 0x33: {
            const [ h, t, o ] = this.V[x]
              .toString()
              .padStart(3, '0')
              .split('')
              .map(v => parseInt(v, 10));

            this.writeUint8(this.I, h);
            this.writeUint8(this.I + 1, t);
            this.writeUint8(this.I + 2, o);
          }; break;
          case 0x55: {
            for (let i = 0; i < 0x10; i++) {
              this.writeUint8(this.I + i, this.V[i]);
            }
          }; break;
          case 0x65: {
            for (let i = 0; i < 0x10; i++) {
              this.V[i] = this.readUint8(this.I + i);
            }
          }
        }
      }; break;
    }
  }
};

const keyboard = new Keyboard();
const cpu = new Chip8(keyboard);

const canvas = document.createElement('canvas');
const canvasContext = canvas.getContext('2d');

const canvasArea = document.getElementById('canvas-area');

const chip8Speed = 1000 / 500;

const run = async () => {
  await cpu.runNext();
  setTimeout(() => {
    run().catch(e => { console.error(e); });
  }, chip8Speed);
};

if (canvasArea !== null && canvasContext !== null) {
  canvasArea.appendChild(canvas);

  run()
    .catch(e => { console.error(e); });
} else {
  throw new Error('The canvas area was not defined');
}
