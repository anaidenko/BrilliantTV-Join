import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import { loadRemoteConfig } from './config/environment';
import * as serviceWorker from './serviceWorker';

loadRemoteConfig(window.location.pathname).finally(() => {
  ReactDOM.render(<App />, document.querySelector('#root'));
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();