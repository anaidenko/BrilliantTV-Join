// @flow
import React from 'react';
import logo from './logo.svg';
import './App.css';
import CheckoutForm from './CheckoutForm';
import { Elements, StripeProvider } from 'react-stripe-elements';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
