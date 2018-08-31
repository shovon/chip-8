import * as React from 'react';
import { Component } from 'react';

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

type ProgramsListState = {};
type ProgramsListProps = {
  onProgramSelected: (path: string) => void
};

export default class ProgramsList extends Component<ProgramsListProps, ProgramsListState> {
  constructor(props: ProgramsListProps) {
    super(props);
  }

  render() {
    return (
      <div className='programs-list'>
        <ul>
          {roms.map(rom =>
            <li key={`${rom.title}${rom.path}`}>
              <a
                href='#'
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.props.onProgramSelected(rom.path)
                }}>
                  {rom.title}
              </a>
            </li>
          )}
        </ul>
      </div>
    );
  }
}
