// @flow

import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { InjectedProps, injectStripe } from 'react-stripe-elements';
import validate from 'validate.js';

import environment from '../../config/environment';
import constraints from '../../services/validation/constraints';
import FeedbackSnackbarContent from '../FeedbackSnackbarContent';
import StripeCardsSection from '../StripeCardsSection';

type Props = InjectedProps & {};

type State = {
  emailAddress: string,
  fullName: string,
  password: string,
  passwordConfirmation: string,
  marketingOptIn: boolean,
  plan: string,
  price: number,
  trialDays: number,

  performingAction: boolean,
  complete: boolean,
  errors: Object,
  serverError: string,
  showErrors: boolean,
};

const styles = (theme) => ({
  root: {
    width: 500,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(8),
  },
  logo: {
    width: 150,
  },
  paper: {
    padding: theme.spacing(3),
  },
  grid: {
    marginBottom: theme.spacing(2),
  },
  gridPayment: {
    marginTop: theme.spacing(2),
  },
  register: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
  },
  link: {
    fontWeight: 'bold',
  },
  login: {
    marginTop: theme.spacing(3),
  },
});

class CheckoutForm extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      emailAddress: '',
      fullName: '',
      password: '',
      passwordConfirmation: '',
      marketingOptIn: false,
      plan: '',
      price: 0,
      trialDays: 0,

      performingAction: false,
      complete: false,
      errors: null,
      serverError: '',
      showErrors: false,
    };
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;

    const plan = (params.plan || 'yearly').trim().toLowerCase();
    const price = environment.plan.amount / 100;
    const trialDays = environment.plan.trial_period_days;

    this.setState({
      plan,
      price,
      trialDays,
    });
  }

  handlePurchaseClick = () => {
    const errors = this.validateForm();

    if (errors) {
      this.setState({
        errors,
        showErrors: true,
      });
    } else {
      this.setState(
        {
          performingAction: true,
          errors: null,
          serverError: '',
          showErrors: true,
        },
        async () => {
          const { stripe } = this.props;
          const { fullName, emailAddress, password, marketingOptIn, plan } = this.state;
          const { token } = await stripe.createToken({ name: fullName });

          if (!token) {
            this.setState({ performingAction: false });
            return;
          }

          const metadata = {
            stripeToken: token.id,
            name: fullName,
            email: emailAddress,
            password,
            marketingOptIn,
            plan,
          };
          const response = await fetch(`${environment.REACT_APP_BACKEND_URL}/signup`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          });
          if (response.ok) {
            const content = await response.json();
            console.log('Signup Succeed', content);
            this.setState({ complete: true, performingAction: false });
            window.location = 'https://subscribe.brillianttv.com/welcome';
          } else {
            const content = await response.json();
            const error = (content && content.message) || response.statusText;
            console.error('Signup Error', error);
            this.setState({ performingAction: false, serverError: error });
          }
        },
      );
    }
  };

  handleFieldChange = (fieldName) => (event) => {
    const { showErrors } = this.state;
    const { value } = event.target;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  handleFieldCheck = (fieldName) => (event) => {
    const { showErrors } = this.state;
    const value = event.target.checked;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  validateForm = () => {
    const { fullName, emailAddress, password, passwordConfirmation, marketingOptIn } = this.state;

    const errors = validate(
      {
        fullName,
        emailAddress,
        password,
        passwordConfirmation,
        marketingOptIn,
      },
      {
        fullName: constraints.fullName,
        emailAddress: constraints.emailAddress,
        password: constraints.password,
        passwordConfirmation: constraints.passwordConfirmation,
        marketingOptIn: constraints.marketingOptIn,
      },
    );

    return errors;
  };

  validateField = (fieldName, fieldValue) => {
    switch (fieldName) {
      case 'password':
      case 'passwordConfirmation': {
        const { errors, password, passwordConfirmation } = this.state;
        const newErrors =
          validate(
            { password, passwordConfirmation },
            {
              password: constraints.password,
              passwordConfirmation: constraints.passwordConfirmation,
            },
          ) || {};
        this.setState({
          errors: {
            ...errors,
            password: newErrors.password,
            passwordConfirmation: newErrors.passwordConfirmation,
          },
        });
        return;
      }
      default: {
        const { errors } = this.state;
        const newErrors = validate({ [fieldName]: fieldValue }, { [fieldName]: constraints[fieldName] }) || {};
        this.setState({ errors: { ...errors, [fieldName]: newErrors[fieldName] } });
      }
    }
  };

  handleFeedbackClose = () => {
    this.setState({ serverError: '' });
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
      marketingOptIn,
      plan,
      price,
      trialDays,

      errors,
      serverError,
      showErrors,
    } = this.state;

    if (complete) {
      return <></>;
      //   return (
      //     <form className={c.root}>
      //       <Typography variant="h3">Registration Complete</Typography>

      //       <Button
      //         className={c.login}
      //         color="secondary"
      //         href={`${environment.VHX_PORTAL_URL}/login`}
      //         size="large"
      //         variant="contained"
      //       >
      //         Go to Login
      //       </Button>
      //     </form>
      //   );
    }

    return (
      <form className={c.root}>
        <Box mb={3}>
          <img src="/BTV_Logo_White300px.png" className={c.logo} alt="logo" />
        </Box>
        <Paper className={c.paper} elevation={3}>
          <Box mt={1} mb={4} align="center">
            <Typography variant="h5">Start your {trialDays}-day free trial</Typography>
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
              />
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
              />
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
              />
            </Grid>
            <Grid item className={c.grid}>
              <FormControlLabel
                disabled={performingAction}
                control={
                  <Checkbox
                    checked={marketingOptIn}
                    value="marketingOptIn"
                    color="secondary"
                    onChange={this.handleFieldCheck('marketingOptIn')}
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
                />
              </Grid>
              <Grid item className={c.grid}>
                <StripeCardsSection showError={showErrors} />
              </Grid>
              <Grid item className={c.grid}>
                <Divider variant="middle" />
              </Grid>
              <Grid item className={c.grid}>
                <Typography color="textSecondary" variant="body2">
                  We will place a $1 authorization hold on your card, which will convert to a ${price} USD (plus any
                  tax) recurring {plan} payment unless you cancel before your {trialDays}-day trial ends. Charges on
                  your card will appear as brillianttv.
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {serverError && (
            <Box my={2}>
              <FeedbackSnackbarContent variant="error" message={serverError} onClose={this.handleFeedbackClose} />
            </Box>
          )}

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
