import Keyboard from './keyboard';
import Chip8 from './chip-8';
import {
  CHIP8_DISPLAY_WIDTH,
  CHIP8_DISPLAY_HEIGHT
} from './constants';

let play = true;

const PIXEL_SIDE_LENGTH = 12;

const keyboard = new Keyboard();
const cpu = new Chip8(keyboard);

const canvas = document.createElement('canvas');
canvas.width = CHIP8_DISPLAY_WIDTH * PIXEL_SIDE_LENGTH;
canvas.height = CHIP8_DISPLAY_HEIGHT * PIXEL_SIDE_LENGTH;
const canvasContext = canvas.getContext('2d');

const canvasArea = document.getElementById('canvas-area');

const chip8Speed = 1000 / 500;

const backgroundColor = '#fffeea';
const foregroundColor = 'black';
const blockStrokeColor = '#fffeea';

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

const run = async () => {
  if (canvasContext === null) {
    throw new Error('Canvas context is null');
  }
  if (play) {
    await cpu.runNext();
    drawCanvas(
      canvasContext,
      CHIP8_DISPLAY_WIDTH,
      CHIP8_DISPLAY_HEIGHT,
      cpu.getDisplay()
    );
  }
  setTimeout(() => {
    run().catch(e => { console.error(e); });
  }, chip8Speed);
};

if (canvasArea !== null && canvasContext !== null) {

  canvasArea.appendChild(canvas);

  drawCanvas(
    canvasContext,
    CHIP8_DISPLAY_WIDTH,
    CHIP8_DISPLAY_HEIGHT,
    cpu.getDisplay()
  );

  fetch('./space-invaders.ch8')
    .then(response => response.arrayBuffer())
    .then(buf => {
      const program = new Uint8Array(buf, 0);
      cpu.loadProgram(program);
    })
    .then(() => run())
    .catch(e => { console.error(e); });

} else {
  throw new Error('The canvas area was not defined');
}
