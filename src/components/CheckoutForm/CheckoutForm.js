// @flow

import React, { Component } from 'react';
import { CardElement, injectStripe, InjectedProps } from 'react-stripe-elements';
import { Button, Grid, Paper, TextField, Container, Box, Card, CardContent } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import StripeCardsSection from '../../components/StripeCardsSection';

type Props = InjectedProps & {};

type State = {
  complete: boolean
};

const styles = theme => ({
  root: {
    minWidth: 500
  },
  paper: {
    padding: theme.spacing(3)
  },
  grid: {
    marginBottom: theme.spacing(2)
  }
});

class CheckoutForm extends Component<Props, State> {
  state = {
    complete: false
  };

  submit = async ev => {
    let { token } = await this.props.stripe.createToken({ name: 'Name' });
    console.log('stripe token issued', token);
    this.setState({ complete: true });
  };

  render() {
    const { classes: c } = this.props;

    if (this.state.complete) {
      return <h1>Purchase Complete</h1>;
    }

    return (
      <form className={c.root}>
        <Paper className={c.paper} elevation={3}>
          <Grid container direction="column">
            <Grid item className={c.grid}>
              <TextField fullWidth variant="outlined" label="Email" autoFocus></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <TextField fullWidth variant="outlined" label="Password"></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <TextField fullWidth variant="outlined" label="Full Name"></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <StripeCardsSection></StripeCardsSection>
            </Grid>
          </Grid>

          <Button variant="contained" color="primary" onClick={this.submit}>
            Purchase
          </Button>
        </Paper>
      </form>
    );
  }
}

export default injectStripe(withStyles(styles, { withTheme: true })(CheckoutForm));
