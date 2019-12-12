// @flow

import './App.css';
import 'paymentfont/css/paymentfont.css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import NoMatchPage from '../../pages/NoMatchPage';
import SignupPage from '../../pages/SignupPage';

const theme = createMuiTheme({
  palette: {
    // primary: blue,
    primary: {
      main: '#0464B0',
    },
    secondary: {
      main: teal[500],
    },
    text: {
      primary: '#31394F',
    },
  },
  typography: {
    // fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    fontWeightLight: 500,
    fontWeightRegular: 600,
    fontWeightMedium: 700,
  },
});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <Router>
          <Switch>
            <Route
              path="/:plan(monthly|annual|annual-$147|annual-147|yearly|yearly-$147|yearly-147)"
              component={SignupPage}
            />
            <Route path="/" exact component={SignupPage} />
            <Route component={NoMatchPage} />
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
