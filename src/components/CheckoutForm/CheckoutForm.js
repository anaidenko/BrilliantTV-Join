// @flow

import { Box, Button, Checkbox, FormControlLabel, Grid, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { InjectedProps, injectStripe } from 'react-stripe-elements';
import validate from 'validate.js';

import environment from '../../config/environment';
import { PadlockIcon } from '../../icons';
import constraints from '../../services/validation/constraints';
import FeedbackSnackbarContent from '../FeedbackSnackbarContent';
import StripeCardsSection from '../StripeCardsSection';
import TextField from '../TextField';

type Props = InjectedProps & {
  onComplete: Function,
};

type State = {
  emailAddress: string,
  fullName: string,
  password: string,
  passwordConfirmation: string,
  marketingOptIn: boolean,
  plan: string,

  performingAction: boolean,
  errors: Object,
  serverError: string,
  showErrors: boolean,
};

const styles = (theme) => ({
  root: {
    '& small': {
      fontSize: 12,
    },
  },
  grid: {
    marginBottom: theme.spacing(2),
  },
  gridPayment: {
    marginTop: theme.spacing(2),
  },
  formHeader: {
    textAlign: 'left',
    marginBottom: theme.spacing(2),
  },
  marketingOptIn: {
    fontWeight: 600,
  },
  register: {
    backgroundColor: '#35BA0D',
    fontSize: '18px',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
    textTransform: 'none',
  },
  link: {
    fontWeight: 'bold',
  },
  login: {
    marginTop: theme.spacing(3),
  },
  padlock: {
    marginBottom: -2,
    marginRight: 4,
  },
  paymentTypeIcon: {
    width: 35,
    marginLeft: theme.spacing(1),
    '&:first-of-type': {
      marginLeft: 0,
    },
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

      performingAction: false,
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

    this.setState({ plan });
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
          const { stripe, onComplete } = this.props;
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
            if (onComplete) {
              onComplete();
            }
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
    const { fullName, emailAddress, password, passwordConfirmation } = this.state;

    const errors = validate(
      {
        fullName,
        emailAddress,
        password,
        passwordConfirmation,
      },
      {
        fullName: constraints.fullName,
        emailAddress: constraints.emailAddress,
        password: constraints.password,
        passwordConfirmation: constraints.passwordConfirmation,
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

      fullName,
      emailAddress,
      password,
      passwordConfirmation,
      marketingOptIn,

      errors,
      serverError,
      showErrors,
    } = this.state;

    return (
      <form className={c.root}>
        <Typography align="left" variant="h6" color="primary" className={c.formHeader}>
          BrilliantTV Account Information
        </Typography>
        <Grid item container direction="column" className={c.grid}>
          <Grid item className={c.grid}>
            <TextField
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.fullName)}
              fullWidth
              helperText={errors && errors.fullName ? errors.fullName[0] : ''}
              label="Your Full Name"
              onChange={this.handleFieldChange('fullName')}
              placeholder="Your Name Here"
              required
              type="text"
              value={fullName}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.emailAddress)}
              fullWidth
              helperText={errors && errors.emailAddress ? errors.emailAddress[0] : ''}
              label="Your Email Address"
              onChange={this.handleFieldChange('emailAddress')}
              placeholder="Your Email Address Here"
              required
              type="email"
              value={emailAddress}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              autoComplete="new-password"
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.password)}
              fullWidth
              helperText={errors && errors.password ? errors.password[0] : ''}
              label="Set your BrilliantTV password"
              onChange={this.handleFieldChange('password')}
              placeholder="Your Password"
              required
              type="password"
              value={password}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              autoComplete="new-password"
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.passwordConfirmation)}
              fullWidth
              helperText={errors && errors.passwordConfirmation ? errors.passwordConfirmation[0] : ''}
              label="Confirm your password"
              onChange={this.handleFieldChange('passwordConfirmation')}
              placeholder="Repeat Password"
              required
              type="password"
              value={passwordConfirmation}
              variant="filled"
            />
          </Grid>
        </Grid>

        <Typography variant="h6" color="primary" className={c.formHeader}>
          Payment Information
        </Typography>
        <Grid item container direction="column" className={c.grid}>
          <StripeCardsSection showError={showErrors} />
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
          aria-label="click to submit payment"
        >
          Submit Payment
        </Button>

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
              <Typography color="textSecondary" variant="body2" align="left" className={c.marketingOptIn}>
                I agree to receive newsletters and product updates from Brilliant TV
              </Typography>
            }
          />
        </Grid>

        <Box spacing={2}>
          <img src="/icons/payment/visa.png" className={c.paymentTypeIcon} alt="visa card" />
          <img src="/icons/payment/mastercard.png" className={c.paymentTypeIcon} alt="master card" />
          <img src="/icons/payment/american-express.png" className={c.paymentTypeIcon} alt="americal express card" />
          <img src="/icons/payment/discover.png" className={c.paymentTypeIcon} alt="discover card" />
        </Box>
        <Typography color="textSecondary" component="small">
          <PadlockIcon className={c.padlock} height="12" />
          100% Safe &amp; Secure Payment
        </Typography>
      </form>
    );
  }
}

export default injectStripe(withStyles(styles, { withTheme: true })(CheckoutForm));
