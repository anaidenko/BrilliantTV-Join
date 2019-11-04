// @flow

import './App.css';
import 'paymentfont/css/paymentfont.css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import { blue, teal } from '@material-ui/core/colors';
import React from 'react';
import { Elements, StripeProvider } from 'react-stripe-elements';

import environment from '../../config/environment';
import CheckoutForm from '../CheckoutForm/CheckoutForm';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: {
      main: teal[500],
    },
  },
});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <header className="App-header">
          <StripeProvider apiKey={environment.STRIPE_PUBLISHABLE_KEY}>
            <Elements>
              <CheckoutForm />
            </Elements>
          </StripeProvider>
        </header>
      </ThemeProvider>
    </div>
  );
}

export default App;
