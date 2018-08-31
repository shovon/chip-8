define("i-disposable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CHIP8_MEMORY_SIZE = 0x1000;
    exports.CHIP8_PROGRAM_MEMORY_LOCATION = 0x200;
    exports.CHIP8_REGISTERS_COUNT = 0x10;
    exports.CHIP8_STACK_SIZE = 0x10;
    exports.CHIP8_DISPLAY_WIDTH = 64;
    exports.CHIP8_DISPLAY_HEIGHT = 32;
});
define("read-only-map", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ReadOnlyMap {
        constructor(map) {
            this.map = map;
        }
        get(key) { return this.map.get(key); }
        *[Symbol.iterator]() {
            for (let value of this.map) {
                yield value;
            }
        }
        ;
    }
    exports.default = ReadOnlyMap;
});
define("keyboard", ["require", "exports", "read-only-map"], function (require, exports, read_only_map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    const keycodeMapping = new read_only_map_1.default(new Map([
        [49, 0x1],
        [50, 0x2],
        [51, 0x3],
        [52, 0xc],
        [81, 0x4],
        [87, 0x5],
        [69, 0x6],
        [82, 0xd],
        [65, 0x7],
        [83, 0x8],
        [68, 0x9],
        [70, 0xe],
        [90, 0xa],
        [88, 0x0],
        [67, 0xb],
        [86, 0xf],
    ]));
    class Keyboard {
        constructor() {
            this.onKeydown = (event) => {
                const buttonCode = keycodeMapping.get(event.keyCode);
                if (buttonCode !== undefined) {
                    this.pressedKey = buttonCode;
                    this.keypressListeners.forEach(listener => { listener(buttonCode); });
                    this.keypressListeners = [];
                }
            };
            this.onKeyUp = (event) => {
                this.pressedKey = null;
            };
            this.pressedKey = null;
            this.keypressListeners = [];
            document.addEventListener('keydown', this.onKeydown);
            document.addEventListener('keyup', this.onKeyUp);
        }
        dispose() {
            document.removeEventListener('keydown', this.onKeydown);
            document.removeEventListener('keyup', this.onKeyUp);
        }
        getKeyboardState() {
            return this.pressedKey;
        }
        getNextKeyboardPress() {
            return new Promise(resolve => {
                this.keypressListeners = this.keypressListeners.concat([
                    code => { resolve(code); }
                ]);
            });
        }
    }
    exports.default = Keyboard;
});
define("chip-8", ["require", "exports", "constants"], function (require, exports, constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Chip8 {
        constructor(keyboard) {
            this.keyboard = keyboard;
            this.memory = new Uint8Array(constants_1.CHIP8_MEMORY_SIZE);
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
            this.V = new Uint8Array(constants_1.CHIP8_REGISTERS_COUNT);
            this.I = 0;
            this.dt = 0;
            this.st = 0;
            this.PC = constants_1.CHIP8_PROGRAM_MEMORY_LOCATION;
            this.SP = -1;
            this.stack = new Uint16Array(constants_1.CHIP8_STACK_SIZE);
            this.display = new Array(constants_1.CHIP8_DISPLAY_HEIGHT * constants_1.CHIP8_DISPLAY_HEIGHT);
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
        loadProgram(program) {
            this.memory.set(program, constants_1.CHIP8_PROGRAM_MEMORY_LOCATION);
        }
        dispose() {
            clearInterval(this.timersInterval);
            this.cleared = true;
        }
        getDisplay() {
            return this.display.slice();
        }
        readUint16(address) {
            const msb = this.memory[address];
            const lsb = this.memory[address + 1];
            const integer = (msb << 8) | lsb;
            return integer;
        }
        writeUint8(address, value) {
            this.memory[address] = value;
        }
        readUint8(address) { return this.memory[address]; }
        async runNext() {
            if (this.cleared) {
                return;
            }
            if (this.PC < 0 || this.PC >= constants_1.CHIP8_MEMORY_SIZE) {
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
                case 0x0:
                    {
                        switch (kk) {
                            case 0xE0:
                                {
                                    this.display.forEach((el, i) => {
                                        this.display[i] = false;
                                    });
                                }
                                ;
                                break;
                            case 0xEE:
                                {
                                    this.PC = this.stack[this.SP];
                                    this.SP--;
                                }
                                ;
                                break;
                        }
                        // Otherwise, just noop.
                    }
                    ;
                    break;
                case 0x1:
                    {
                        this.PC = nnn;
                    }
                    ;
                    break;
                case 0x2:
                    {
                        this.SP++;
                        this.stack[this.SP] = this.PC;
                        this.PC = nnn;
                    }
                    ;
                    break;
                case 0x3:
                    {
                        if (this.V[x] === kk) {
                            this.PC += 2;
                        }
                    }
                    ;
                    break;
                case 0x4:
                    {
                        if (this.V[x] !== kk) {
                            this.PC += 2;
                        }
                    }
                    ;
                    break;
                case 0x5:
                    {
                        // TODO: check to see if nibble absolutely must be 0.
                        switch (n) {
                            case 0x0:
                                {
                                    if (this.V[x] === this.V[y]) {
                                        this.PC += 2;
                                    }
                                }
                                ;
                                break;
                        }
                    }
                    ;
                    break;
                case 0x6:
                    {
                        this.V[x] = kk;
                    }
                    ;
                    break;
                case 0x7:
                    {
                        this.V[x] = this.V[x] + kk;
                    }
                    ;
                    break;
                case 0x8:
                    {
                        switch (n) {
                            case 0x0:
                                {
                                    this.V[x] = this.V[y];
                                }
                                ;
                                break;
                            case 0x1:
                                {
                                    this.V[x] = this.V[x] | this.V[y];
                                }
                                ;
                                break;
                            case 0x2:
                                {
                                    this.V[x] = this.V[x] & this.V[y];
                                }
                                ;
                                break;
                            case 0x3:
                                {
                                    this.V[x] = this.V[x] ^ this.V[y];
                                }
                                ;
                                break;
                            case 0x4:
                                {
                                    const sum = this.V[x] + this.V[y];
                                    const shouldCarry = sum > 255;
                                    this.V[x] = sum;
                                    this.V[0xf] = shouldCarry ? 1 : 0;
                                }
                                ;
                                break;
                            case 0x5:
                                {
                                    const noBorrow = this.V[x] >= this.V[y];
                                    this.V[x] = this.V[x] - this.V[y];
                                    this.V[0xf] = noBorrow ? 1 : 0;
                                }
                                ;
                                break;
                            case 0x6:
                                {
                                    this.V[0xf] = (this.V[x] & 0x1) === 1 ? 1 : 0;
                                    this.V[x] = this.V[x] >> 1;
                                }
                                ;
                                break;
                            case 0x7:
                                {
                                    const noBorrow = this.V[y] >= this.V[x];
                                    this.V[x] = this.V[y] - this.V[x];
                                    this.V[0xf] = noBorrow ? 1 : 0;
                                }
                                ;
                                break;
                            case 0xE:
                                {
                                    this.V[0xf] = (this.V[x] & 0x80) !== 0 ? 1 : 0;
                                    this.V[x] = this.V[x] << 1;
                                }
                                ;
                                break;
                        }
                    }
                    ;
                    break;
                case 0x9:
                    {
                        switch (n) {
                            case 0x0:
                                {
                                    if (this.V[x] !== this.V[y]) {
                                        this.PC += 2;
                                    }
                                }
                                ;
                                break;
                        }
                    }
                    ;
                    break;
                case 0xA:
                    {
                        this.I = nnn;
                    }
                    ;
                    break;
                case 0xB:
                    {
                        this.PC = nnn + this.V[0];
                    }
                    ;
                    break;
                case 0xC:
                    {
                        this.V[x] = Math.floor(Math.random() * 256) & kk;
                    }
                    ;
                    break;
                case 0xD:
                    {
                        let hasCollided = false;
                        // Iterate through the rows of the sprite.
                        for (let i = 0; i < n; i++) {
                            const row = this.readUint8(this.I + i);
                            // Iterate through the elements of the row, left-to-right.
                            for (let px = 0; px < 8; px++) {
                                const isSpritePixelWhite = !!((row >> (8 - px - 1)) & 0x1);
                                const drawX = (this.V[x] + px) % constants_1.CHIP8_DISPLAY_WIDTH;
                                const drawY = (this.V[y] + i) % constants_1.CHIP8_DISPLAY_HEIGHT;
                                const index = drawX + constants_1.CHIP8_DISPLAY_WIDTH * drawY;
                                if (isSpritePixelWhite && this.display[index]) {
                                    this.display[index] = false;
                                    hasCollided = true;
                                }
                                else if (isSpritePixelWhite && !this.display[index]) {
                                    this.display[index] = true;
                                }
                            }
                        }
                        this.V[0xf] = hasCollided ? 1 : 0;
                    }
                    ;
                    break;
                case 0xE:
                    {
                        switch (kk) {
                            case 0x9e:
                                {
                                    if (this.V[x] === this.keyboard.getKeyboardState()) {
                                        this.PC += 2;
                                    }
                                }
                                ;
                                break;
                            case 0xa1:
                                {
                                    if (this.V[x] !== this.keyboard.getKeyboardState()) {
                                        this.PC += 2;
                                    }
                                }
                                ;
                                break;
                        }
                    }
                    ;
                    break;
                case 0xF:
                    {
                        switch (kk) {
                            case 0x07:
                                {
                                    this.V[x] = this.dt;
                                }
                                ;
                                break;
                            case 0x0a:
                                {
                                    this.V[x] = await this.keyboard.getNextKeyboardPress();
                                }
                                ;
                                break;
                            case 0x15:
                                {
                                    this.dt = this.V[x];
                                }
                                ;
                                break;
                            case 0x18:
                                {
                                    this.st = this.V[x];
                                }
                                ;
                                break;
                            case 0x1e:
                                {
                                    this.I = this.I + this.V[x];
                                }
                                ;
                                break;
                            case 0x29:
                                {
                                    this.I = this.V[x] * 5;
                                }
                                ;
                                break;
                            case 0x33:
                                {
                                    const [h, t, o] = this.V[x]
                                        .toString(10)
                                        .padStart(3, '0')
                                        .split('')
                                        .map(v => parseInt(v, 10));
                                    this.writeUint8(this.I, h);
                                    this.writeUint8(this.I + 1, t);
                                    this.writeUint8(this.I + 2, o);
                                }
                                ;
                                break;
                            case 0x55:
                                {
                                    for (let i = 0; i <= x; i++) {
                                        this.writeUint8(this.I + i, this.V[i]);
                                    }
                                }
                                ;
                                break;
                            case 0x65:
                                {
                                    for (let i = 0; i <= x; i++) {
                                        this.V[i] = this.readUint8(this.I + i);
                                    }
                                }
                                ;
                                break;
                        }
                    }
                    ;
                    break;
            }
        }
        getMemoryDump() {
            const self = this;
            function* generator() {
                for (let i = 0; i < self.memory.length; i++) {
                    yield [i, self.memory[i]];
                }
            }
            return generator();
        }
    }
    exports.default = Chip8;
});
define("multi-keyboard-source", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MultiKeyboardSource {
        constructor(...sources) {
            this.sources = sources;
        }
        getKeyboardState() {
            return this.sources
                .map(source => source.getKeyboardState())
                .find(state => !!state) || null;
        }
        getNextKeyboardPress() {
            return Promise.race(this.sources.map(source => source.getNextKeyboardPress()));
        }
    }
    exports.default = MultiKeyboardSource;
});
define("visual-keyboard-buttons", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const buttons = [
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
    class VisualKeyboardButtons {
        constructor(targetDom) {
            this.targetDom = targetDom;
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
                const keydownListener = (event) => {
                    if (event.keyCode === button.keyCode) {
                        buttonElement.classList.add(ACTIVE_BUTTON_CLASS);
                    }
                };
                const keyupListener = (event) => {
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
        dispose() {
            for (let { buttonElement, downListener, upListener, keydownListener, keyupListener } of this.buttons) {
                buttonElement.removeEventListener('mousedown', downListener);
                buttonElement.removeEventListener('mouseup', upListener);
                this.targetDom.removeChild(buttonElement);
                document.removeEventListener('keydown', keydownListener);
                document.removeEventListener('keyup', keyupListener);
            }
        }
        getKeyboardState() { return this.pressedKey; }
        getNextKeyboardPress() {
            return new Promise(resolve => {
                this.keypressListeners = this.keypressListeners.concat([
                    code => { resolve(code); }
                ]);
            });
        }
    }
    exports.default = VisualKeyboardButtons;
});
define("session", ["require", "exports", "keyboard", "multi-keyboard-source", "chip-8", "visual-keyboard-buttons", "constants"], function (require, exports, keyboard_1, multi_keyboard_source_1, chip_8_1, visual_keyboard_buttons_1, constants_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const backgroundColor = 'black';
    const foregroundColor = 'white';
    const blockStrokeColor = 'black';
    const PIXEL_SIDE_LENGTH = 12;
    const chip8Speed = 1000 / 500;
    const drawCanvas = (context, width, height, display) => {
        const pixelWidth = (context.canvas.clientWidth / width);
        const pixelHeight = (context.canvas.clientHeight / height);
        context.strokeStyle = 'transparent'; // No stroke.
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width * pixelWidth, height * pixelHeight);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const i = x + width * y;
                context.strokeStyle = blockStrokeColor;
                context.fillStyle = foregroundColor;
                if (display[i]) {
                    context.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
                    context.strokeRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
                }
            }
        }
    };
    class Session {
        constructor(gameArea, program) {
            this.gameArea = gameArea;
            this.disposables = [];
            this.disposed = false;
            // Canvas
            const canvasArea = this.canvasArea = document.createElement('div');
            canvasArea.classList.add('canvas-area');
            this.gameArea.appendChild(canvasArea);
            // Buttons
            const buttonsArea = document.createElement('div');
            buttonsArea.classList.add('buttons');
            this.gameArea.appendChild(buttonsArea);
            const keyboard = new keyboard_1.default();
            this.disposables.push(keyboard);
            const visualKeyboard = new visual_keyboard_buttons_1.default(buttonsArea);
            this.disposables.push(visualKeyboard);
            const multiKeyboard = new multi_keyboard_source_1.default(keyboard, visualKeyboard);
            this.cpu = new chip_8_1.default(multiKeyboard);
            this.disposables.push(this.cpu);
            this.cpu.loadProgram(program);
            const canvas = document.createElement('canvas');
            canvas.width = constants_2.CHIP8_DISPLAY_WIDTH * PIXEL_SIDE_LENGTH;
            canvas.height = constants_2.CHIP8_DISPLAY_HEIGHT * PIXEL_SIDE_LENGTH;
            canvasArea.appendChild(canvas);
            const canvasContext = canvas.getContext('2d');
            // TODO: find a better way to relay errors.
            if (canvasContext === null) {
                throw new Error('An error occurred while attempting acquire canvas context');
            }
            this.canvasContext = canvasContext;
            drawCanvas(this.canvasContext, constants_2.CHIP8_DISPLAY_WIDTH, constants_2.CHIP8_DISPLAY_HEIGHT, this.cpu.getDisplay());
        }
        play() {
            const run = async () => {
                if (this.disposed) {
                    return;
                }
                await this.cpu.runNext();
                drawCanvas(this.canvasContext, constants_2.CHIP8_DISPLAY_WIDTH, constants_2.CHIP8_DISPLAY_HEIGHT, this.cpu.getDisplay());
                setTimeout(() => {
                    run()
                        // Catching like this must not be good.
                        .catch(e => { console.error(e); });
                }, chip8Speed);
            };
            run()
                // Catching like this must not be good.
                .catch(e => { console.error(e); });
        }
        dispose() {
            this.disposables.forEach(disposable => {
                disposable.dispose();
            });
            this.gameArea.childNodes.forEach(child => {
                child.remove();
            });
            this.disposed = true;
        }
    }
    exports.default = Session;
});
define("components/programs-list", ["require", "exports", "react", "react"], function (require, exports, React, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const roms = [
        { title: '15 Puzzle [Roger Ivie] (alt)',
            path: './roms/games/15 Puzzle [Roger Ivie] (alt).ch8' },
        { title: '15 Puzzle [Roger Ivie]',
            path: './roms/games/15 Puzzle [Roger Ivie].ch8' },
        { title: 'Addition Problems [Paul C',
            path: './roms/games/Addition Problems [Paul C. Moews].ch8' },
        { title: 'Airplane', path: './roms/games/Airplane.ch8' },
        { title: 'Animal Race [Brian Astle]',
            path: './roms/games/Animal Race [Brian Astle].ch8' },
        { title: 'Astro Dodge [Revival Studios, 2008]',
            path: './roms/games/Astro Dodge [Revival Studios, 2008].ch8' },
        { title: 'Biorhythm [Jef Winsor]',
            path: './roms/games/Biorhythm [Jef Winsor].ch8' },
        { title: 'Blinky [Hans Christian Egeberg, 1991]',
            path: './roms/games/Blinky [Hans Christian Egeberg, 1991].ch8' },
        { title: 'Blinky [Hans Christian Egeberg] (alt)',
            path: './roms/games/Blinky [Hans Christian Egeberg] (alt).ch8' },
        { title: 'Blitz [David Winter]',
            path: './roms/games/Blitz [David Winter].ch8' },
        { title: 'Bowling [Gooitzen van der Wal]',
            path: './roms/games/Bowling [Gooitzen van der Wal].ch8' },
        { title: 'Breakout (Brix hack) [David Winter, 1997]',
            path: './roms/games/Breakout (Brix hack) [David Winter, 1997].ch8' },
        { title: 'Breakout [Carmelo Cortez, 1979]',
            path: './roms/games/Breakout [Carmelo Cortez, 1979].ch8' },
        { title: 'Brick (Brix hack, 1990)',
            path: './roms/games/Brick (Brix hack, 1990).ch8' },
        { title: 'Brix [Andreas Gustafsson, 1990]',
            path: './roms/games/Brix [Andreas Gustafsson, 1990].ch8' },
        { title: 'Cave', path: './roms/games/Cave.ch8' },
        { title: 'Coin Flipping [Carmelo Cortez, 1978]',
            path: './roms/games/Coin Flipping [Carmelo Cortez, 1978].ch8' },
        { title: 'Connect 4 [David Winter]',
            path: './roms/games/Connect 4 [David Winter].ch8' },
        { title: 'Craps [Camerlo Cortez, 1978]',
            path: './roms/games/Craps [Camerlo Cortez, 1978].ch8' },
        { title: 'Deflection [John Fort]',
            path: './roms/games/Deflection [John Fort].ch8' },
        { title: 'Figures', path: './roms/games/Figures.ch8' },
        { title: 'Filter', path: './roms/games/Filter.ch8' },
        { title: 'Guess [David Winter] (alt)',
            path: './roms/games/Guess [David Winter] (alt).ch8' },
        { title: 'Guess [David Winter]',
            path: './roms/games/Guess [David Winter].ch8' },
        { title: 'Hi-Lo [Jef Winsor, 1978]',
            path: './roms/games/Hi-Lo [Jef Winsor, 1978].ch8' },
        { title: 'Hidden [David Winter, 1996]',
            path: './roms/games/Hidden [David Winter, 1996].ch8' },
        { title: 'Kaleidoscope [Joseph Weisbecker, 1978]',
            path: './roms/games/Kaleidoscope [Joseph Weisbecker, 1978].ch8' },
        { title: 'Landing', path: './roms/games/Landing.ch8' },
        { title: 'Lunar Lander (Udo Pernisz, 1979)',
            path: './roms/games/Lunar Lander (Udo Pernisz, 1979).ch8' },
        { title: 'Mastermind FourRow (Robert Lindley, 1978)',
            path: './roms/games/Mastermind FourRow (Robert Lindley, 1978).ch8' },
        { title: 'Merlin [David Winter]',
            path: './roms/games/Merlin [David Winter].ch8' },
        { title: 'Missile [David Winter]',
            path: './roms/games/Missile [David Winter].ch8' },
        { title: 'Most Dangerous Game [Peter Maruhnic]',
            path: './roms/games/Most Dangerous Game [Peter Maruhnic].ch8' },
        { title: 'Nim [Carmelo Cortez, 1978]',
            path: './roms/games/Nim [Carmelo Cortez, 1978].ch8' },
        { title: 'Paddles', path: './roms/games/Paddles.ch8' },
        { title: 'Pong (1 player)',
            path: './roms/games/Pong (1 player).ch8' },
        { title: 'Pong (alt)', path: './roms/games/Pong (alt).ch8' },
        { title: 'Pong 2 (Pong hack) [David Winter, 1997]',
            path: './roms/games/Pong 2 (Pong hack) [David Winter, 1997].ch8' },
        { title: 'Pong [Paul Vervalin, 1990]',
            path: './roms/games/Pong [Paul Vervalin, 1990].ch8' },
        { title: 'Programmable Spacefighters [Jef Winsor]',
            path: './roms/games/Programmable Spacefighters [Jef Winsor].ch8' },
        { title: 'Puzzle', path: './roms/games/Puzzle.ch8' },
        { title: 'Reversi [Philip Baltzer]',
            path: './roms/games/Reversi [Philip Baltzer].ch8' },
        { title: 'Rocket Launch [Jonas Lindstedt]',
            path: './roms/games/Rocket Launch [Jonas Lindstedt].ch8' },
        { title: 'Rocket Launcher',
            path: './roms/games/Rocket Launcher.ch8' },
        { title: 'Rocket [Joseph Weisbecker, 1978]',
            path: './roms/games/Rocket [Joseph Weisbecker, 1978].ch8' },
        { title: 'Rush Hour [Hap, 2006] (alt)',
            path: './roms/games/Rush Hour [Hap, 2006] (alt).ch8' },
        { title: 'Rush Hour [Hap, 2006]',
            path: './roms/games/Rush Hour [Hap, 2006].ch8' },
        { title: 'Russian Roulette [Carmelo Cortez, 1978]',
            path: './roms/games/Russian Roulette [Carmelo Cortez, 1978].ch8' },
        { title: 'Sequence Shoot [Joyce Weisbecker]',
            path: './roms/games/Sequence Shoot [Joyce Weisbecker].ch8' },
        { title: 'Shooting Stars [Philip Baltzer, 1978]',
            path: './roms/games/Shooting Stars [Philip Baltzer, 1978].ch8' },
        { title: 'Slide [Joyce Weisbecker]',
            path: './roms/games/Slide [Joyce Weisbecker].ch8' },
        { title: 'Soccer', path: './roms/games/Soccer.ch8' },
        { title: 'Space Flight', path: './roms/games/Space Flight.ch8' },
        { title: 'Space Intercept [Joseph Weisbecker, 1978]',
            path: './roms/games/Space Intercept [Joseph Weisbecker, 1978].ch8' },
        { title: 'Space Invaders [David Winter] (alt)',
            path: './roms/games/Space Invaders [David Winter] (alt).ch8' },
        { title: 'Space Invaders [David Winter]',
            path: './roms/games/Space Invaders [David Winter].ch8' },
        { title: 'Spooky Spot [Joseph Weisbecker, 1978]',
            path: './roms/games/Spooky Spot [Joseph Weisbecker, 1978].ch8' },
        { title: 'Squash [David Winter]',
            path: './roms/games/Squash [David Winter].ch8' },
        { title: 'Submarine [Carmelo Cortez, 1978]',
            path: './roms/games/Submarine [Carmelo Cortez, 1978].ch8' },
        { title: 'Sum Fun [Joyce Weisbecker]',
            path: './roms/games/Sum Fun [Joyce Weisbecker].ch8' },
        { title: 'Syzygy [Roy Trevino, 1990]',
            path: './roms/games/Syzygy [Roy Trevino, 1990].ch8' },
        { title: 'Tank', path: './roms/games/Tank.ch8' },
        { title: 'Tapeworm [JDR, 1999]',
            path: './roms/games/Tapeworm [JDR, 1999].ch8' },
        { title: 'Tetris [Fran Dachille, 1991]',
            path: './roms/games/Tetris [Fran Dachille, 1991].ch8' },
        { title: 'Tic-Tac-Toe [David Winter]',
            path: './roms/games/Tic-Tac-Toe [David Winter].ch8' },
        { title: 'Timebomb', path: './roms/games/Timebomb.ch8' },
        { title: 'Tron', path: './roms/games/Tron.ch8' },
        { title: 'UFO [Lutz V, 1992]',
            path: './roms/games/UFO [Lutz V, 1992].ch8' },
        { title: 'Vers [JMN, 1991]',
            path: './roms/games/Vers [JMN, 1991].ch8' },
        { title: 'Vertical Brix [Paul Robson, 1996]',
            path: './roms/games/Vertical Brix [Paul Robson, 1996].ch8' },
        { title: 'Wall [David Winter]',
            path: './roms/games/Wall [David Winter].ch8' },
        { title: 'Wipe Off [Joseph Weisbecker]',
            path: './roms/games/Wipe Off [Joseph Weisbecker].ch8' },
        { title: 'Worm V4 [RB-Revival Studios, 2007]',
            path: './roms/games/Worm V4 [RB-Revival Studios, 2007].ch8' },
        { title: 'X-Mirror', path: './roms/games/X-Mirror.ch8' },
        { title: 'ZeroPong [zeroZshadow, 2007]',
            path: './roms/games/ZeroPong [zeroZshadow, 2007].ch8' }
    ];
    class ProgramsList extends react_1.Component {
        constructor(props) {
            super(props);
        }
        render() {
            return (React.createElement("div", { className: 'programs-list' },
                React.createElement("ul", null, roms.map(rom => React.createElement("li", { key: `${rom.title}${rom.path}` },
                    React.createElement("a", { href: '#', onClick: e => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.props.onProgramSelected(rom.path);
                        } }, rom.title))))));
        }
    }
    exports.default = ProgramsList;
});
define("components/emulator-ui", ["require", "exports", "react", "react", "components/programs-list", "session"], function (require, exports, React, react_2, programs_list_1, session_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Emulator extends react_2.Component {
        constructor(props) {
            super(props);
            this.session = null;
        }
        componentWillUnmount() {
            if (this.session !== null) {
                this.session.dispose();
            }
        }
        render() {
            return (React.createElement("div", { ref: el => {
                    if (el !== null) {
                        this.session = new session_1.default(el, this.props.program);
                        this.session.play();
                    }
                } }));
        }
    }
    var EmulatorUIStatus;
    (function (EmulatorUIStatus) {
        EmulatorUIStatus[EmulatorUIStatus["menu"] = 0] = "menu";
        EmulatorUIStatus[EmulatorUIStatus["loading"] = 1] = "loading";
        EmulatorUIStatus[EmulatorUIStatus["playing"] = 2] = "playing";
    })(EmulatorUIStatus || (EmulatorUIStatus = {}));
    class EmualtorUI extends react_2.Component {
        constructor(props) {
            super(props);
            this.state = {
                uiStatus: EmulatorUIStatus.menu,
                program: null,
                loadingFailed: false
            };
        }
        render() {
            switch (this.state.uiStatus) {
                case EmulatorUIStatus.menu:
                    {
                        return (React.createElement("div", null,
                            React.createElement("div", { className: 'header' },
                                React.createElement("p", null,
                                    "This is a ",
                                    React.createElement("a", { target: '_blank', href: 'https://en.wikipedia.org/wiki/CHIP-8' }, "Chip-8"),
                                    " emulator."),
                                React.createElement("p", null, "Pick a program. Any program.")),
                            this.state.loadingFailed ? React.createElement("div", { className: 'loading-failed' }, "Loading Failed") : null,
                            React.createElement(programs_list_1.default, { onProgramSelected: path => {
                                    this.setState({
                                        uiStatus: EmulatorUIStatus.loading,
                                        loadingFailed: false
                                    });
                                    fetch(path)
                                        .then(response => {
                                        if (response.status >= 400) {
                                            throw new Error('An error occurred while loading the ROM');
                                        }
                                        return response.arrayBuffer();
                                    })
                                        .then(buf => new Uint8Array(buf))
                                        .then(arr => {
                                        this.setState({
                                            uiStatus: EmulatorUIStatus.playing,
                                            program: arr,
                                            loadingFailed: false
                                        });
                                    })
                                        .catch(e => {
                                        console.error(e);
                                        this.setState({
                                            uiStatus: EmulatorUIStatus.menu,
                                            program: null,
                                            loadingFailed: true
                                        });
                                    });
                                } })));
                    }
                    ;
                case EmulatorUIStatus.loading:
                    {
                        return (React.createElement("div", null, "ROM is loading"));
                    }
                    ;
                case EmulatorUIStatus.playing:
                    {
                        if (this.state.program === null) {
                            return React.createElement("div", null, "Error! There should have been a program, here");
                        }
                        return (React.createElement("div", null,
                            React.createElement("a", { className: 'back-arrow', href: '/', onClick: e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    this.setState({
                                        uiStatus: EmulatorUIStatus.menu,
                                        program: null,
                                        loadingFailed: false
                                    });
                                } }, "\u27F5"),
                            React.createElement(Emulator, { program: this.state.program })));
                    }
                    ;
                default: {
                    return (React.createElement("div", null, "Sorry, there was a bad state somewhere!"));
                }
            }
        }
    }
    exports.default = EmualtorUI;
});
define("index", ["require", "exports", "react", "react-dom", "components/emulator-ui"], function (require, exports, React, ReactDOM, emulator_ui_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const appContent = document.getElementById('app-content');
    if (appContent === null) {
        const message = 'An error occurred while getting DOM component for app area';
        alert(message);
        throw new Error(message);
    }
    // fetch('./space-invaders.ch8')
    //   .then(response => response.arrayBuffer())
    //   .then(buf => {
    //     const session = new Session(gameArea, new Uint8Array(buf, 0));
    //     session.play();
    //   })
    //   .catch(e => { console.error(e); });
    ReactDOM.render(React.createElement(emulator_ui_1.default, null), appContent);
});
//# sourceMappingURL=bundle.js.map