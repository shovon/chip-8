import { IKeyboard } from './keyboard';

export default class MultiKeyboardSource implements IKeyboard {
  private sources: IKeyboard[];

  constructor(...sources: IKeyboard[]) {
    this.sources = sources;
  }

  getKeyboardState() {
    return  this.sources
      .map(source => source.getKeyboardState())
      .find(state => !!state) || null;
  }

  getNextKeyboardPress() {
    return Promise.race(
      this.sources.map(source => source.getNextKeyboardPress())
    );
  }
}
