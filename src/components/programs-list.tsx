import * as React from 'react';
import { Component } from 'react';

const roms = [
  {
    title: 'Astro Dodge',
    path: './roms/games/Astro Dodge [Revival Studios, 2008].ch8'
  },
  {
    title: 'Cave',
    path: './roms/games/Cave.ch8'
  },
  {
    title: 'Lunar Lander',
    path: './roms/games/Lunar Lander (Udo Pernisz, 1979).ch8'
  },
  {
    title: 'Maze (Demo)',
    path: './roms/demos/Maze (alt) [David Winter, 199x].ch8'
  },
  {
    title: 'Space Intercept',
    path: './roms/games/Space Intercept [Joseph Weisbecker, 1978].ch8'
  },
  {
    title: 'Tetris',
    path: './roms/games/Tetris [Fran Dachille, 1991].ch8'
  }
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
