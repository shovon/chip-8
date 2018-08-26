import { IDisposable } from './i-disposable';
import {
  CHIP8_MEMORY_SIZE,
  CHIP8_PROGRAM_MEMORY_LOCATION,
  CHIP8_REGISTERS_COUNT,
  CHIP8_STACK_SIZE,
  CHIP8_DISPLAY_WIDTH,
  CHIP8_DISPLAY_HEIGHT
} from './constants';
import { IKeyboard } from './keyboard';

export default class Chip8 implements IDisposable {
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
    }, Math.floor(1000 / 120));

    this.cleared = false;
  }

  public loadProgram(program: Uint8Array) {
    this.memory.set(program, CHIP8_PROGRAM_MEMORY_LOCATION);
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
    const integer = (msb << 8) | lsb;
    return integer;
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

    if (this.PC < 0 || this.PC >= CHIP8_MEMORY_SIZE) {
      throw new Error('PC out of bounds');
    }

    const instruction = this.readUint16(this.PC);
    const opcode = (instruction >> 12) & 0xF;
    const nnn = instruction & 0xFFF;
    const n = instruction & 0xF;
    const x = (instruction >> 8) & 0xF;
    const y = (instruction >> 4) & 0xF;
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
      }; break;
      case 0x1: {
        this.PC = nnn;
      }; break;
      case 0x2: {
        this.SP++;
        this.stack[this.SP] = this.PC;
        this.PC = nnn;
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
        switch (n) {
          case 0x0: {
            if (this.V[x] === this.V[y]) {
              this.PC += 2;
            }
          }; break;
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
            const sum = this.V[x] + this.V[y];
            const shouldCarry = sum > 255;
            this.V[x] = sum;
            this.V[0xf] = shouldCarry ? 1 : 0;
          }; break;
          case 0x5: {
            const noBorrow = this.V[x] >= this.V[y];
            this.V[x] = this.V[x] - this.V[y];
            this.V[0xf] = noBorrow ? 1 : 0;
          }; break;
          case 0x6: {
            this.V[0xf] = (this.V[x] & 0x1) === 1 ? 1 : 0;
            this.V[x] = this.V[x] >> 1;
          }; break;
          case 0x7: {
            const noBorrow = this.V[y] >= this.V[x];
            this.V[x] = this.V[y] - this.V[x];
            this.V[0xf] = noBorrow ? 1 : 0;
          }; break;
          case 0xE: {
            this.V[0xf] = (this.V[x] & 0x80) !== 0 ? 1 : 0;
            this.V[x] = this.V[x] << 1;
          }; break;
        }
      }; break;
      case 0x9: {
        switch (n) {
          case 0x0: {
            if (this.V[x] !== this.V[y]) {
              this.PC += 2;
            }
          }; break;
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
              .toString(10)
              .padStart(3, '0')
              .split('')
              .map(v => parseInt(v, 10));

            this.writeUint8(this.I, h);
            this.writeUint8(this.I + 1, t);
            this.writeUint8(this.I + 2, o);
          }; break;
          case 0x55: {
            for (let i = 0; i <= x; i++) {
              this.writeUint8(this.I + i, this.V[i]);
            }
          }; break;
          case 0x65: {
            for (let i = 0; i <= x; i++) {
              this.V[i] = this.readUint8(this.I + i);
            }
          }; break;
        }
      }; break;
    }
  }

  public getMemoryDump() {
    const self = this;
    function * generator() {
      for (let i = 0; i < self.memory.length; i++) {
        yield [ i, self.memory[i] ];
      }
    }
    return generator();
  }

}