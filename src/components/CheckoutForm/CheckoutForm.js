// @flow

import { Box, Button, Checkbox, FormControlLabel, Grid, Link, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import pluralize from 'pluralize';
import React, { Component } from 'react';
import { InjectedProps, injectStripe } from 'react-stripe-elements';
import validate from 'validate.js';

import environment from '../../config/environment';
import { PadlockIcon } from '../../icons';
import constraints from '../../services/validation/constraints';
import { formatCurrency } from '../../utilities/formatter';
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
  promptCoupon: boolean,
  couponCode: string,
  couponDetails: Object,
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
  promptCouponClickHereLink: {
    cursor: 'pointer',
    marginLeft: theme.spacing(1),
    textDecoration: 'underline',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  applyCouponContainer: {
    marginLeft: theme.spacing(1),
    alignSelf: 'flex-end',
  },
  couponAppliedContainer: {
    backgroundColor: '#f2f9f1',
    border: '1px dashed green',
    color: 'green',
    fontSize: '16px',
    fontWeight: 600,
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  couponApplied: {
    border: '1px solid green',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1, 2),
  },
  feedback: {
    textAlign: 'left',
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
      promptCoupon: false,
      couponCode: '',
      couponDetails: null,
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

  handlePromptCouponClick = () => {
    this.setState({ promptCoupon: true });
  };

  handleApplyCouponClick = async () => {
    const { couponCode, couponDetails } = this.state;

    if (!couponCode || (couponDetails && couponCode === couponDetails.id)) {
      this.setState({ promptCoupon: false });
      return;
    }

    this.setState(
      {
        performingAction: true,
        couponDetails: null,
        serverError: '',
      },
      async () => {
        const response = await fetch(`${environment.REACT_APP_BACKEND_URL}/coupon/${encodeURIComponent(couponCode)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const content = await response.json();
          this.setState({ performingAction: false, promptCoupon: false, couponDetails: content });
        } else {
          const content = await response.json();
          const error = (content && content.message) || response.statusText;
          console.error('Coupon Error', error);
          this.setState({ performingAction: false, serverError: error });
        }
      },
    );
  };

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
          const { fullName, emailAddress, password, couponCode, marketingOptIn, plan } = this.state;
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
            couponCode,
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

  handleCouponFieldKeyPress = (event) => {
    if (event.key === 'Enter') {
      this.handleApplyCouponClick();
    }
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

  renderAppliedCoupon({ couponCode, couponDetails }) {
    const { classes: c } = this.props;

    return (
      <Box my={2} align="center" className={c.couponAppliedContainer}>
        <Box className={c.couponAppliedDetails}>
          {couponCode} -{' '}
          {couponDetails.amount_off
            ? `${formatCurrency(couponDetails.amount_off / 100)} OFF`
            : `${couponDetails.percent_off}% OFF`}{' '}
          {couponDetails.duration === 'forever'
            ? ''
            : couponDetails.duration === 'once'
            ? 'FOR FIRST PAYMENT'
            : couponDetails.duration === 'repeating'
            ? `FOR NEXT ${pluralize('month', couponDetails.duration_in_months, true).toUpperCase()}`
            : ''}
        </Box>
        <Box className={c.couponApplied}>COUPON APPLIED</Box>
      </Box>
    );
  }

  render() {
    const { classes: c } = this.props;

    const {
      performingAction,

      fullName,
      emailAddress,
      password,
      passwordConfirmation,
      promptCoupon,
      couponCode,
      couponDetails,
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

        {!promptCoupon && !couponDetails && (
          <Box my={2}>
            <Typography variant="subtitle1" align="left" className={c.promptCoupon}>
              Have a coupon?
              <Link onClick={this.handlePromptCouponClick} className={c.promptCouponClickHereLink}>
                Click here to enter your code
              </Link>
            </Typography>
          </Box>
        )}

        {promptCoupon && (
          <Grid item container direction="row" className={c.grid}>
            <Grid item xs>
              <TextField
                autoFocus
                className={c.textField}
                disabled={performingAction}
                fullWidth
                label="Coupon Code"
                onChange={this.handleFieldChange('couponCode')}
                onKeyPress={this.handleCouponFieldKeyPress}
                readOnly={performingAction}
                type="text"
                value={couponCode}
                variant="filled"
              />
            </Grid>
            <Grid item className={c.applyCouponContainer}>
              <Button
                aria-label="click to apply coupon code"
                className={c.applyCoupon}
                color="secondary"
                disabled={(couponCode && couponDetails && couponCode === couponDetails.id) || performingAction}
                onClick={this.handleApplyCouponClick}
                variant="contained"
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        )}

        {!promptCoupon && couponDetails && this.renderAppliedCoupon({ couponCode, couponDetails })}

        {serverError && (
          <Box my={2}>
            <FeedbackSnackbarContent
              className={c.feedback}
              variant="error"
              message={serverError}
              onClose={this.handleFeedbackClose}
            />
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
