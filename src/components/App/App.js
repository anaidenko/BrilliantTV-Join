// @flow

import React from 'react';
import './App.css';
import 'paymentfont/css/paymentfont.css';
import CheckoutForm from '../../components/CheckoutForm/CheckoutForm';
import { Elements, StripeProvider } from 'react-stripe-elements';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

const theme = createMuiTheme({});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <header className="App-header">
          <StripeProvider apiKey="pk_test_TYooMQauvdEDq54NiTphI7jx">
            <Elements>
              <CheckoutForm></CheckoutForm>
            </Elements>
          </StripeProvider>
        </header>
      </ThemeProvider>
    </div>
  );
}

export default App;
