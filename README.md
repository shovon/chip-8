# CHIP 8 Emulator in TypeScript

My first attempt at writing an emulator for an arbitrary computer architecture (even if it never existed). Chip-8 was designed back in—what I assume to be—the 1970s, and I thought I'd give it a shot at emulating it, in order to test the waters of computer emulation.

The CPU and the UI is written in TypeScript, an React is used as the UI management framework.

## Building and Running

You'll only need to install Node.js.

- From this project's root, run `npm i` (installs dependencies)
- Run `./node_modules/.bin/tsc` (compiles the TypeScript code)
- Install any web server. I like to use nws. And so install it by running `npm i -g nws`

To run the code, `cd` into `public`, then run `nws`.

## License

MIT