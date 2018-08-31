import Session from './session';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import EmulatorUI from './components/emulator-ui';

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

ReactDOM.render(<EmulatorUI />, appContent);
