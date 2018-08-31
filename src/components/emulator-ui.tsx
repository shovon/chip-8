import * as React from 'react';
import { Component } from 'react';
import ProgramsList from './programs-list';
import Session from '../session';

type EmulatorProps = {
  program: Uint8Array
};
type EmulatorState = {};

class Emulator extends Component<EmulatorProps, EmulatorState> {
  private session: Session | null;

  constructor(props: EmulatorProps) {
    super(props);

    this.session = null;
  }

  componentWillUnmount() {
    if (this.session !== null) {
      this.session.dispose();
    }
  }

  render() {
    return (
      <div ref={el => {
        if (el !== null) {
          this.session = new Session(el, this.props.program);
          this.session.play();
        }
      }} />
    );
  }
}

enum EmulatorUIStatus {
  menu,
  loading,
  playing
}

type EmulatorUIState = {
  uiStatus: EmulatorUIStatus
  program: Uint8Array | null,
  loadingFailed: boolean
}

export default class EmualtorUI extends Component<{}, EmulatorUIState> {
  constructor(props: EmulatorUIState) {
    super(props);
    this.state = {
      uiStatus: EmulatorUIStatus.menu,
      program: null,
      loadingFailed: false
    }
  }

  render() {
    switch (this.state.uiStatus) {
      case EmulatorUIStatus.menu: {
        return (
          <div>
            <div className='header'>
              <p>This is a <a target='_blank' href='https://en.wikipedia.org/wiki/CHIP-8'>Chip-8</a> emulator.</p>
              <p>Pick a program. Any program.</p>
            </div>
            
            {this.state.loadingFailed ? <div className='loading-failed'>Loading Failed</div> : null}
            <ProgramsList
              onProgramSelected={path => {
                this.setState({
                  uiStatus: EmulatorUIStatus.loading,
                  loadingFailed: false
                });
                fetch(path)
                  .then(response => {
                    if (response.status >= 400) {
                      throw new Error(
                        'An error occurred while loading the ROM'
                      );
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
                    })
                  })
              }} />
          </div>
          
        );
      };
      case EmulatorUIStatus.loading: {
        return (
          <div>ROM is loading</div>
        );
      };
      case EmulatorUIStatus.playing: {
        if (this.state.program === null) {
          return <div>Error! There should have been a program, here</div>;
        }
        return (
          <div>
            <a
              className='back-arrow' href='/'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                this.setState({
                  uiStatus: EmulatorUIStatus.menu,
                  program: null,
                  loadingFailed: false
                })
              }}>⟵</a>
            <Emulator program={this.state.program} />
          </div>
        )
      };
      default: {
        return (
          <div>Sorry, there was a bad state somewhere!</div>
        )
      }
    }
  }
}