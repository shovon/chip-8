import Keyboard from './keyboard';
import MultiKeyboardSource from './multi-keyboard-source';
import Chip8 from './chip-8';
import VisualKeyboardButtons from './visual-keyboard-buttons';
import { IDisposable } from './i-disposable';
import {
  CHIP8_DISPLAY_WIDTH,
  CHIP8_DISPLAY_HEIGHT
} from './constants';

const backgroundColor = 'black';
const foregroundColor = 'white';
const blockStrokeColor = 'black';
const PIXEL_SIDE_LENGTH = 12;
const chip8Speed = 1000 / 500;

const drawCanvas = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  display: boolean[]
) => {
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
        context.fillRect(
          x * pixelWidth,
          y * pixelHeight,
          pixelWidth,
          pixelHeight
        );
        context.strokeRect(
          x * pixelWidth,
          y * pixelHeight,
          pixelWidth,
          pixelHeight
        );
      }
    }
  }
};

export default class Session implements IDisposable {
  private canvasArea: HTMLElement;
  private canvasContext: CanvasRenderingContext2D;
  private cpu: Chip8;
  private disposables: IDisposable[];
  private disposed: boolean;

  constructor(private gameArea: HTMLElement, program: Uint8Array) {
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

    const keyboard = new Keyboard();
    this.disposables.push(keyboard);
    const visualKeyboard = new VisualKeyboardButtons(buttonsArea);
    this.disposables.push(visualKeyboard);
    const multiKeyboard = new MultiKeyboardSource(keyboard, visualKeyboard);

    this.cpu = new Chip8(multiKeyboard);
    this.disposables.push(this.cpu);
    this.cpu.loadProgram(program);

    const canvas = document.createElement('canvas');
    canvas.width = CHIP8_DISPLAY_WIDTH * PIXEL_SIDE_LENGTH;
    canvas.height = CHIP8_DISPLAY_HEIGHT * PIXEL_SIDE_LENGTH;

    canvasArea.appendChild(canvas);

    const canvasContext = canvas.getContext('2d');
    // TODO: find a better way to relay errors.
    if (canvasContext === null) {
      throw new Error(
        'An error occurred while attempting acquire canvas context'
      );
    }
    this.canvasContext = canvasContext;

    drawCanvas(
      this.canvasContext,
      CHIP8_DISPLAY_WIDTH,
      CHIP8_DISPLAY_HEIGHT,
      this.cpu.getDisplay()
    );
  }

  public play() {
    const run = async () => {
      if (this.disposed) {
        return;
      }

      await this.cpu.runNext();
      drawCanvas(
        this.canvasContext,
        CHIP8_DISPLAY_WIDTH,
        CHIP8_DISPLAY_HEIGHT,
        this.cpu.getDisplay()
      );
      setTimeout(() => {
        run()
        
          // Catching like this must not be good.
          .catch(e => { console.error(e); });
      }, chip8Speed);
    };

    run()
      // Catching like this must not be good.
      .catch(e => { console.error(e); })
  }

  public dispose() {
    this.disposables.forEach(disposable => {
      disposable.dispose();
    });

    this.gameArea.childNodes.forEach(child => {
      child.remove();
    });

    this.disposed = true;
  }
}