// @flow

import React, { Component } from 'react';
import { CardElement, injectStripe, InjectedProps } from 'react-stripe-elements';
import {
  FormControlLabel,
  Checkbox,
  Divider,
  Link,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Container,
  Box,
  Card,
  CardContent
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import StripeCardsSection from '../../components/StripeCardsSection';
import validate from 'validate.js';
import constraints from '../../services/validation/constraints';

type Props = InjectedProps & {};

type State = {
  emailAddress: string,
  fullName: string,
  password: string,
  passwordConfirmation: string,
  agreeMarketing: boolean,

  performingAction: boolean,
  complete: boolean,
  errors: Object,
  showErrors: boolean
};

const styles = theme => ({
  root: {
    width: 500,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(8)
  },
  logo: {
    width: 150
  },
  paper: {
    padding: theme.spacing(3)
  },
  grid: {
    marginBottom: theme.spacing(2)
  },
  gridPayment: {
    marginTop: theme.spacing(2)
  },
  register: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2)
  },
  link: {
    fontWeight: 'bold'
  }
});

class CheckoutForm extends Component<Props, State> {
  state = {
    emailAddress: '',
    fullName: '',
    password: '',
    passwordConfirmation: '',
    agreeMarketing: false,

    performingAction: false,
    complete: false,
    errors: null,
    showErrors: false
  };

  handlePurchaseClick = ev => {
    const errors = this.validateForm();

    if (errors) {
      this.setState({
        errors: errors,
        showErrors: true
      });
    } else {
      this.setState(
        {
          performingAction: true,
          errors: null,
          showErrors: true
        },
        async () => {
          let { token } = await this.props.stripe.createToken({ name: 'Name' });
          console.log('stripe token issued', token);
          // todo: submit to VHX registration API
          this.setState({ complete: true });
        }
      );
    }
  };

  handleFieldChange = fieldName => event => {
    const { showErrors } = this.state;
    const value = event.target.value;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  handleFieldCheck = fieldName => event => {
    const { showErrors } = this.state;
    const value = event.target.checked;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  validateForm = () => {
    const { fullName, emailAddress, password, passwordConfirmation, agreeMarketing } = this.state;

    const errors = validate(
      {
        fullName: fullName,
        emailAddress: emailAddress,
        password: password,
        passwordConfirmation: passwordConfirmation,
        agreeMarketing: agreeMarketing
      },
      {
        fullName: constraints.fullName,
        emailAddress: constraints.emailAddress,
        password: constraints.password,
        passwordConfirmation: constraints.passwordConfirmation,
        agreeMarketing: constraints.agreeMarketing
      }
    );

    return errors;
  };

  validateField = (fieldName, fieldValue) => {
    switch (fieldName) {
      case 'password':
      case 'passwordConfirmation':
        const { errors, password, passwordConfirmation } = this.state;
        const newErrors =
          validate(
            { password: password, passwordConfirmation: passwordConfirmation },
            {
              password: constraints.password,
              passwordConfirmation: constraints.passwordConfirmation
            }
          ) || {};
        this.setState({
          errors: {
            ...errors,
            password: newErrors.password,
            passwordConfirmation: newErrors.passwordConfirmation
          }
        });
        return;
      default: {
        const { errors } = this.state;
        const newErrors = validate({ [fieldName]: fieldValue }, { [fieldName]: constraints[fieldName] }) || {};
        this.setState({ errors: { ...errors, [fieldName]: newErrors[fieldName] } });
        return;
      }
    }
  };

  render() {
    const { classes: c } = this.props;

    const {
      performingAction,
      complete,

      fullName,
      emailAddress,
      password,
      passwordConfirmation,
      agreeMarketing,

      errors,
      showErrors
    } = this.state;

    if (complete) {
      return <h1>Purchase Complete</h1>;
    }

    return (
      <form className={c.root}>
        <Box my={2}>
          <img src="/BTV_Logo_White300px.png" className={c.logo} />
        </Box>
        <Paper className={c.paper} elevation={3}>
          <Box mt={1} mb={4} align="center">
            <Typography variant="h5">Start your 7-day free trial</Typography>
          </Box>
          <Grid container direction="column">
            <Grid item className={c.grid}>
              <TextField
                disabled={performingAction}
                error={!!(errors && errors.emailAddress)}
                fullWidth
                helperText={errors && errors.emailAddress ? errors.emailAddress[0] : ''}
                label="Email"
                onChange={this.handleFieldChange('emailAddress')}
                required
                type="email"
                value={emailAddress}
                variant="outlined"
              ></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <TextField
                autoComplete="new-password"
                disabled={performingAction}
                error={!!(errors && errors.password)}
                fullWidth
                helperText={errors && errors.password ? errors.password[0] : ''}
                label="Password"
                onChange={this.handleFieldChange('password')}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                type="password"
                value={password}
                variant="outlined"
              ></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <TextField
                autoComplete="new-password"
                disabled={performingAction}
                error={!!(errors && errors.passwordConfirmation)}
                fullWidth
                helperText={errors && errors.passwordConfirmation ? errors.passwordConfirmation[0] : ''}
                label="Confirm Password"
                onChange={this.handleFieldChange('passwordConfirmation')}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                type="password"
                value={passwordConfirmation}
                variant="outlined"
              ></TextField>
            </Grid>
            <Grid item className={c.grid}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeMarketing}
                    value="agreeMarketing"
                    color="secondary"
                    onChange={this.handleFieldCheck('agreeMarketing')}
                  />
                }
                label={
                  <Typography color="textSecondary" variant="body2" align="left">
                    I agree to receive newsletters and products updates from Brilliant TV
                  </Typography>
                }
              />
            </Grid>
            <Grid item className={c.grid}>
              <Divider variant="middle" />
              <Box mt={3}>
                <Typography variant="h5">Payment details</Typography>
              </Box>
            </Grid>
            <Grid item container direction="column" className={c.grid}>
              <Grid item className={c.gridPayment}>
                <TextField
                  disabled={performingAction}
                  error={!!(errors && errors.fullName)}
                  fullWidth
                  helperText={errors && errors.fullName ? errors.fullName[0] : ''}
                  label="Name on card"
                  onChange={this.handleFieldChange('fullName')}
                  required
                  type="text"
                  value={fullName}
                  variant="outlined"
                ></TextField>
              </Grid>
              <Grid item className={c.grid}>
                <StripeCardsSection showError={showErrors}></StripeCardsSection>
              </Grid>
              <Grid item className={c.grid}>
                <Divider variant="middle" />
              </Grid>
              <Grid item className={c.grid}>
                <Typography color="textSecondary" variant="body2">
                  We will place a $1 authorization hold on your card, which will convert to a $192 USD (plus any tax) recurring yearly
                  payment unless you cancel before your 7-day trial ends. Charges on your card will appear as brillianttv.
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Button
            className={c.register}
            color="secondary"
            disabled={!fullName || !emailAddress || !password || !passwordConfirmation || performingAction}
            fullWidth
            onClick={this.handlePurchaseClick}
            size="large"
            variant="contained"
          >
            Register
          </Button>

          <Typography color="textSecondary" variant="body2" align="center">
            By registering you agree to our
            <br />
            <Link href="https://www.brillianttv.com/tos" className={c.link} target="_blank">
              Terms
            </Link>
            ,{' '}
            <Link href="https://www.brillianttv.com/cookies" className={c.link} target="_blank">
              Cookies Policy
            </Link>{' '}
            &{' '}
            <Link href="https://www.brillianttv.com/privacy" className={c.link} target="_blank">
              Privacy Policy
            </Link>
            <br />
            and represent that you are at least 16 years of age.
          </Typography>
        </Paper>
      </form>
    );
  }
}

export default injectStripe(withStyles(styles, { withTheme: true })(CheckoutForm));
